// Politeness and self-protection layer around AIS.
//
// The goal is that AIS never sees traffic it could reasonably call abusive, and that
// no failure mode can turn into a request storm. Three separate mechanisms:
//
//   * pacing    — a minimum gap between calls plus a per-minute ceiling
//   * dedupe    — identical concurrent calls share one upstream request
//   * caching   — repeat reads inside a TTL never reach AIS at all
//
// Plus a login circuit breaker, because repeated failed logins are the one thing that
// actually gets an account locked.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- pacing ---------------------------------------------------------------
// The official SPA polls check-light once a minute and fires a handful of calls per
// screen. Staying near that shape keeps us indistinguishable from a normal browser.
export class Pacer {
  constructor({ minGapMs = 350, perMinute = 40 } = {}) {
    this.minGapMs = minGapMs;
    this.perMinute = perMinute;
    this.last = 0;
    this.stamps = [];
    this.chain = Promise.resolve();
  }

  // Serialises callers so bursts become a queue rather than a spike.
  async slot() {
    const run = this.chain.then(async () => {
      const now = Date.now();
      this.stamps = this.stamps.filter((t) => now - t < 60_000);
      if (this.stamps.length >= this.perMinute) {
        const waitFor = 60_000 - (now - this.stamps[0]) + 50;
        await sleep(waitFor);
        this.stamps = this.stamps.filter((t) => Date.now() - t < 60_000);
      }
      const gap = Date.now() - this.last;
      if (gap < this.minGapMs) await sleep(this.minGapMs - gap);
      // A little jitter so the pattern is not perfectly periodic.
      await sleep(Math.floor(Math.random() * 120));
      this.last = Date.now();
      this.stamps.push(this.last);
    });
    this.chain = run.catch(() => {});
    return run;
  }
}

// --- single flight --------------------------------------------------------
export class SingleFlight {
  constructor() { this.inflight = new Map(); }
  run(key, fn) {
    const hit = this.inflight.get(key);
    if (hit) return hit;
    const p = Promise.resolve().then(fn).finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }
}

// --- TTL cache ------------------------------------------------------------
export class TtlCache {
  constructor() { this.map = new Map(); }
  get(key) {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (Date.now() > e.until) { this.map.delete(key); return undefined; }
    return e.value;
  }
  set(key, value, ttlMs) {
    this.map.set(key, { value, until: Date.now() + ttlMs });
  }
  clear() { this.map.clear(); }
}

// How long each kind of read stays fresh. Generous on purpose: a timetable does not
// change minute to minute, and every second of TTL is a request AIS never sees.
export const TTL = {
  'apps/rozvrh/data': 15 * 60_000,
  'portal/student-predmety/studia': 30 * 60_000,
  'portal/student-predmety/znamky': 5 * 60_000,
  'portal/student-predmety/studium-priemery': 5 * 60_000,
  'portal/student-predmety/skusky': 5 * 60_000,
  'portal/student-predmety/priebezne-hodnotenie': 5 * 60_000,
  'portal/student-predmety/studijny-plan': 60 * 60_000,
  'portal/portal/osoba/poplatky': 15 * 60_000,
  'portal/messages/list2': 5 * 60_000,
  'portal/users/info': 30 * 60_000,
  'portal/studium/list': 30 * 60_000,
  default: 5 * 60_000,
};

export function ttlFor(path) {
  const clean = String(path).replace(/^\/+/, '');
  for (const key of Object.keys(TTL)) {
    if (key !== 'default' && clean.startsWith(key)) return TTL[key];
  }
  return TTL.default;
}

// --- login circuit breaker -------------------------------------------------
// Wrong credentials retried in a loop is what locks an account. After a few failures
// we stop trying entirely and make the user act.
export class LoginGuard {
  constructor({ minIntervalMs = 5_000, maxFailures = 3, cooldownMs = 15 * 60_000 } = {}) {
    this.minIntervalMs = minIntervalMs;
    this.maxFailures = maxFailures;
    this.cooldownMs = cooldownMs;
    this.lastAttempt = 0;
    this.failures = 0;
    this.blockedUntil = 0;
  }

  check() {
    const now = Date.now();
    if (now < this.blockedUntil) {
      const mins = Math.ceil((this.blockedUntil - now) / 60_000);
      const e = new Error(`Too many failed logins; paused for ${mins} min to protect the account`);
      e.status = 429;
      throw e;
    }
  }

  async beforeAttempt() {
    this.check();
    const gap = Date.now() - this.lastAttempt;
    if (gap < this.minIntervalMs) await sleep(this.minIntervalMs - gap);
    this.lastAttempt = Date.now();
  }

  success() { this.failures = 0; this.blockedUntil = 0; }

  failure() {
    this.failures += 1;
    if (this.failures >= this.maxFailures) {
      this.blockedUntil = Date.now() + this.cooldownMs;
    }
  }
}

// One breaker per account, not one for the whole process.
//
// The breaker exists to keep AIS from locking an account after repeated bad
// passwords, so the account name is the thing it should be keyed by. A single global
// breaker meant that anyone who mistyped a password three times paused signing in for
// every other student as well — a denial of service that any stranger could trigger.
// Abuse of the endpoint itself is handled separately, by the per-IP limiter.
const guards = new Map();
const GUARD_IDLE_MS = 60 * 60 * 1000;
const MAX_GUARDS = 500;

function pruneGuards() {
  const now = Date.now();
  for (const [k, g] of guards) {
    // Never drop a breaker that is currently holding someone back: forgetting it
    // would hand the attacker a reset.
    if (now > g.blockedUntil && now - (g.seen || 0) > GUARD_IDLE_MS) guards.delete(k);
  }
  if (guards.size >= MAX_GUARDS) {
    const oldest = [...guards.entries()].sort((a, b) => (a[1].seen || 0) - (b[1].seen || 0));
    for (const [k] of oldest.slice(0, Math.floor(oldest.length / 2))) guards.delete(k);
  }
}

export function loginGuardFor(account, opts) {
  const key = String(account || '').trim().toLowerCase() || '(unknown)';
  let g = guards.get(key);
  if (!g) {
    if (guards.size >= MAX_GUARDS) pruneGuards();
    g = new LoginGuard(opts);
    guards.set(key, g);
  }
  g.seen = Date.now();
  return g;
}

// --- read-only allowlist ---------------------------------------------------
// AIS exposes destructive operations over plain GET (slavnosti/odhlasit,
// statne-skusky/ziadost-zrusit, zaverecne-prace/odhlasit, rozvrh-odhlasit ...).
// A passthrough proxy must therefore allow paths explicitly, never just block verbs.
const READ_ONLY = [
  /^apps\/rozvrh\/(data|akademickeRoky|aktualnyAkRok|studijneSkupinyStudenta)$/,
  /^portal\/users\/info$/,
  /^portal\/studium\/(list|dotazniky|statneskusky)$/,
  /^portal\/portal\/(osoba\/poplatky|menu\/student|zalozky)$/,
  /^portal\/messages\/list2$/,
  /^portal\/student-predmety\/studia$/,
  /^portal\/student-predmety\/(znamky|skusky|priebezne-hodnotenie|studijny-plan|studium-prehlad|studium-priemery|upozornenia|predmet|prerekvizity|rozvrhove-akcie|termin-detail|termin-prihlaseni|predmet-zapisneho-listu|config)\/[\w./-]+$/,
  /^portal\/pracovne-ponuky\/(list|detail\/\d+)$/,
  /^portal\/diskusia\/list$/,
];

export function isReadOnly(path) {
  const clean = String(path).replace(/^\/+/, '').split('?')[0];
  return READ_ONLY.some((re) => re.test(clean));
}
