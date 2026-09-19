// AIS2 (ais2.euba.sk) client: reverse-engineered auth chain + REST access.
//
// Auth chain, as used by the official Angular SPA:
//   1. POST /ais/login.do   (form: login, password)          -> sets JSESSIONID
//   2. POST /ais/rest/apps/get-access-token                    -> returns "AISAuth" response header (bearer-like token)
//      (requires a constant obfuscation header the SPA hard-codes)
//   3. Every REST call carries: Cookie: JSESSIONID=...  and  header AISAuth: <token>  and  ?lng=SK
//   4. Token is refreshed off GET /ais/rest/apps/check-session/check-light (response header "aisAuth")
//
// NOTE: the JSON response shapes of the /ais/rest/portal/* endpoints could not be
// captured live (no working session at build time). The normalize* helpers below map
// the fields defensively and fall back to returning the raw payload, so the UI keeps
// working; correct them once a live response is seen (see README "Calibrating adapters").

import { Pacer, SingleFlight, TtlCache, ttlFor, loginGuardFor } from './guard.js';

const BASE = process.env.AIS_BASE || 'https://ais2.euba.sk';
const LNG = (process.env.AIS_LNG || 'SK').toUpperCase();

// Constant obfuscation header the SPA sends to mint the access token.
const TOKEN_HEADER_NAME = '1lWgbIBjRKNgrgH';
const TOKEN_HEADER_VALUE = '2llVM1Fl3M';

const UA =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36';

// One pacer for the whole process: AIS sees a single client. The login breaker is
// per account (see guard.js), because it protects an account, not the process.
const pacer = new Pacer();

function parseSetCookie(headers) {
  // Node fetch exposes multiple Set-Cookie via getSetCookie() (Node 20.15+/undici).
  const out = {};
  const raw =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [headers.get('set-cookie')].filter(Boolean);
  for (const line of raw) {
    const [pair] = line.split(';');
    const idx = pair.indexOf('=');
    if (idx > 0) out[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return out;
}

export class AisSession {
  constructor() {
    this.jsessionid = null;
    this.token = null;
    this.creds = null; // {login, password} kept in memory only, for silent re-login
    this.lastRefresh = 0;
    this.cache = new TtlCache();
    this.flight = new SingleFlight();
    this.reloginAt = 0; // guards against re-login loops
  }

  get cookieHeader() {
    return this.jsessionid ? `JSESSIONID=${this.jsessionid}` : '';
  }

  async login(login, password) {
    const guard = loginGuardFor(login);
    await guard.beforeAttempt();
    await pacer.slot();
    const body = new URLSearchParams({ login, password }).toString();
    const res = await fetch(`${BASE}/ais/login.do`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
      },
      body,
    });
    const cookies = parseSetCookie(res.headers);
    if (cookies.JSESSIONID) this.jsessionid = cookies.JSESSIONID;

    // A 302 to the portal means success; a 200 (login page again) means bad credentials.
    const redirected = res.status >= 300 && res.status < 400;
    if (!redirected && !this.jsessionid) {
      guard.failure();
      throw new AisError(401, 'Login failed (no session established)');
    }
    this.creds = { login, password };
    await this.retrieveToken();
    if (!this.token) {
      guard.failure();
      throw new AisError(401, 'Login failed (wrong username or password)');
    }
    guard.success();
    this.cache.clear();
    return true;
  }

  async retrieveToken() {
    await pacer.slot();
    const res = await fetch(`${BASE}/ais/rest/apps/get-access-token`, {
      method: 'POST',
      headers: {
        [TOKEN_HEADER_NAME]: TOKEN_HEADER_VALUE,
        Cookie: this.cookieHeader,
        'User-Agent': UA,
      },
    });
    const token = res.headers.get('AISAuth') || res.headers.get('aisAuth');
    if (token) {
      this.token = token;
      this.lastRefresh = Date.now();
    }
    return this.token;
  }

  async refreshIfStale() {
    if (Date.now() - this.lastRefresh < 45_000) return;
    await pacer.slot();
    const res = await fetch(`${BASE}/ais/rest/apps/check-session/check-light`, {
      headers: { AISAuth: this.token || '', Cookie: this.cookieHeader, 'User-Agent': UA },
    });
    if (res.status === 401) {
      // Session died server-side: silently re-login if we still hold credentials.
      if (this.creds) {
        await this.relogin();
      } else {
        throw new AisError(401, 'Session expired');
      }
      return;
    }
    const fresh = res.headers.get('aisAuth') || res.headers.get('AISAuth');
    if (fresh) this.token = fresh;
    this.lastRefresh = Date.now();
  }

  // At most one re-login per minute, whatever asks for it.
  async relogin() {
    if (Date.now() - this.reloginAt < 60_000) {
      throw new AisError(401, 'Session expired');
    }
    this.reloginAt = Date.now();
    await this.login(this.creds.login, this.creds.password);
  }

  // Raw JSON GET against /ais/rest/<path>. Callers pass the namespace, because AIS
  // splits its API in two: portal/* (studies, fees, messages) and apps/* (rozvrh).
  // Served from cache when fresh; concurrent identical reads share one upstream call.
  async get(path, { query, force = false, _retry = false } = {}) {
    const key = path + (query ? '?' + new URLSearchParams(query).toString() : '');
    if (!force) {
      const hit = this.cache.get(key);
      if (hit !== undefined) return hit;
    }
    return this.flight.run(key, async () => {
      if (!force) {
        const hit = this.cache.get(key);
        if (hit !== undefined) return hit;
      }
      await this.refreshIfStale();
      const url = new URL(`${BASE}/ais/rest/${path.replace(/^\/+/, '')}`);
      url.searchParams.set('lng', LNG);
      if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

      await pacer.slot();
      const res = await fetch(url, {
        headers: {
          AISAuth: this.token || '',
          Cookie: this.cookieHeader,
          Accept: 'application/json',
          'User-Agent': UA,
        },
      });
      if (res.status === 401) {
        // One retry only — never recurse into a login loop.
        if (this.creds && !_retry) {
          await this.relogin();
          return this.get(path, { query, force: true, _retry: true });
        }
        throw new AisError(401, 'Session expired');
      }
      if (!res.ok) throw new AisError(res.status, `AIS ${res.status} for ${path}`);
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('json') ? await res.json() : await res.text();
      this.cache.set(key, data, ttlFor(path));
      return data;
    });
  }
}

export class AisError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Defensive field picking: AIS field names vary; try several, fall back to raw.
const pick = (obj, ...keys) => {
  for (const k of keys) if (obj && obj[k] != null && obj[k] !== '') return obj[k];
  return undefined;
};
const asArray = (x) => (Array.isArray(x) ? x : x && Array.isArray(x.list) ? x.list : x ? [x] : []);

export function normalizeStudies(raw) {
  const list = raw && Array.isArray(raw.data) ? raw.data : asArray(raw);
  return list.map((st) => ({
    id: pick(st, 'id'),
    program: pick(st, 'name', 'program'),
    sheets: asArray(st.zapisneListy).map((z) => ({
      id: pick(z, 'id'),
      year: pick(z, 'akRok'),
      name: pick(z, 'name'),
    })),
    raw: st,
  }));
}

// The id of the enrollment sheet (zapisný list) to show — newest by academic year.
export function currentSheetId(studies) {
  const sheets = studies.flatMap((s) => s.sheets || []);
  if (!sheets.length) return undefined;
  sheets.sort((a, b) => String(b.year || '').localeCompare(String(a.year || '')));
  return sheets[0].id;
}

export function normalizeSubjects(raw) {
  const list = raw && Array.isArray(raw.znamky) ? raw.znamky : asArray(raw);
  return list.map((p) => ({
    code: pick(p, 'predmetSkratka', 'skratka', 'kod'),
    name: pick(p, 'predmetNazov', 'nazov', 'name'),
    credits: pick(p, 'kredit', 'kredity', 'credits'),
    semester: pick(p, 'kodSemesterSK', 'kodSemester', 'semester'), // Z / L
    grade: pick(p, 'hodnotenieKod', 'znamka', 'grade'),            // A..FX, null until graded
    gradeText: pick(p, 'hodnoteniePopis'),
    gradeDate: pick(p, 'hodnotenieDatum'),
    completed: pick(p, 'popisSposobUkoncenia', 'ukoncenie'),       // Skúška / Zápočet
    scope: pick(p, 'rozsah'),                                       // e.g. 2P+2C
    raw: p,
  }));
}

export function normalizeAverages(raw) {
  if (!raw || typeof raw !== 'object') return {};
  return {
    all: pick(raw, 'priemerVsetkych'),
    graded: pick(raw, 'priemerHodnotenych'),
    gradedRecognised: pick(raw, 'priemerHodnotenychAjUznanych'),
  };
}

export function normalizePayments(raw) {
  return asArray(raw).map((p) => ({
    title: pick(p, 'nazov', 'popis', 'title'),
    amount: pick(p, 'suma', 'amount'),
    currency: pick(p, 'mena', 'currency') || 'EUR',
    dueDate: pick(p, 'splatnost', 'datum', 'dueDate'),
    paid: pick(p, 'uhradene', 'zaplatene', 'paid'),
    variableSymbol: pick(p, 'vs', 'variabilnySymbol'),
    raw: p,
  }));
}

export function normalizeMessages(raw) {
  const groups = asArray(raw);
  const out = [];
  for (const g of groups) {
    const cat = pick(g, 'key');
    for (const m of asArray(g.messages)) {
      out.push({
        id: pick(m, 'id'),
        category: cat,
        body: pick(m, 'text', 'obsah'),
        date: pick(m, 'casVzniku', 'datum', 'date'),
        url: pick(m, 'aplikaciaUrl'),
        download: pick(m, 'download'),
        raw: m,
      });
    }
  }
  out.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return out;
}

// Weekly schedule. Confirmed from the live rozvrh app's network log — note these sit
// under apps/, not portal/.
export const ROZVRH_PATH = process.env.AIS_ROZVRH_PATH || 'apps/rozvrh/data';
export const ROZVRH_YEARS = 'apps/rozvrh/akademickeRoky';
export const ROZVRH_CURRENT_YEAR = 'apps/rozvrh/aktualnyAkRok';
export const ROZVRH_GROUPS = 'apps/rozvrh/studijneSkupinyStudenta';

// Slovak weekday names, in case the API returns a label rather than an index.
const DAY_INDEX = { pondelok: 1, utorok: 2, streda: 3, stvrtok: 4, 'štvrtok': 4, piatok: 5 };
function dayToIndex(v) {
  if (v == null) return undefined;
  const n = Number(v);
  if (Number.isFinite(n)) return n;
  return DAY_INDEX[String(v).toLowerCase().trim()];
}
// "09:15 - 10:45 (90min)" style values appear in the UI; keep only HH:MM.
const hhmm = (v) => {
  const m = String(v ?? '').match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : undefined;
};
const TYP_LABEL = { RSP: 'prednáška', RSC: 'cvičenie', RSS: 'seminár' };
export function normalizeSchedule(raw) {
  const list = raw && Array.isArray(raw.data) ? raw.data
    : Array.isArray(raw) ? raw : [];
  return list.map((e) => {
    const rooms = asArray(e.miestnosti);
    const teachers = asArray(e.vyucujuci);
    const typ = pick(e, 'typ');
    return {
      day: Number(pick(e, 'den', 'dayOfWeek')) || undefined,
      from: hhmm(pick(e, 'casOd', 'od')),
      to: hhmm(pick(e, 'casDo', 'do')),
      subject: pick(e, 'predmetNazov', 'popis', 'nazov'),
      code: pick(e, 'predmetSkratka', 'skratka'),
      type: TYP_LABEL[typ] || pick(e, 'typRozsahu') || typ,
      room: pick(e, 'miestnostNazov') || rooms[0] || '',
      building: pick(e, 'budovaKod'),
      teacher: teachers[0] || pick(e, 'ucitel'),
      period: pick(e, 'pravidelnost'), // TYZ = weekly
      dateFrom: pick(e, 'datumOd'),
      dateTo: pick(e, 'datumDo'),
      raw: e,
    };
  });
}

// --- Academic calendar -----------------------------------------------------
// AIS calls these "upozornenia", but they are really the term calendar: semester
// spans, exam periods and registration windows, each with a date range.
// Dates arrive as "dd.mm.yyyy" optionally followed by "HH:MM".
function skDate(v, endOfDay = false) {
  const m = String(v ?? '').match(/(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return undefined;
  const [, d, mo, y, hh, mi] = m;
  const date = new Date(
    Number(y), Number(mo) - 1, Number(d),
    hh != null ? Number(hh) : (endOfDay ? 23 : 0),
    mi != null ? Number(mi) : (endOfDay ? 59 : 0)
  );
  return isNaN(date) ? undefined : date.toISOString();
}

export function normalizeCalendar(raw) {
  return asArray(raw)
    .map((e) => ({
      title: pick(e, 'text'),
      note: pick(e, 'popis'),
      from: skDate(pick(e, 'odDatumu')),
      to: skDate(pick(e, 'doDatumu'), true),
    }))
    .filter((e) => e.from)
    .sort((a, b) => a.from.localeCompare(b.from));
}

// Which period we are in right now, and what comes next.
export function calendarStatus(entries, now = new Date()) {
  const t = now.toISOString();
  // Prefer the long spans (semester / exam period) over one-day registration windows.
  const spans = entries.filter((e) => e.to && e.to > e.from);
  const current = spans.find((e) => e.from <= t && t <= e.to);
  const next = entries.find((e) => e.from > t);
  let dayOfSpan, daysLeft;
  if (current) {
    const start = new Date(current.from), end = new Date(current.to);
    dayOfSpan = Math.floor((now - start) / 86400000) + 1;
    daysLeft = Math.ceil((end - now) / 86400000);
  }
  return {
    current: current || null,
    next: next || null,
    week: current ? Math.ceil(dayOfSpan / 7) : undefined,
    daysLeft,
    daysToNext: next ? Math.ceil((new Date(next.from) - now) / 86400000) : undefined,
  };
}

// --- Exam terms ------------------------------------------------------------
export function normalizeExams(raw) {
  return asArray(raw).map((e) => ({
    id: pick(e, 'id', 'terminId'),
    subject: pick(e, 'predmetNazov', 'nazovPredmetu', 'predmet'),
    code: pick(e, 'predmetSkratka', 'skratka'),
    date: pick(e, 'datum', 'terminDatum', 'datumKonania'),
    time: hhmm(pick(e, 'cas', 'casOd')),
    room: pick(e, 'miestnost', 'miestnostNazov'),
    teacher: pick(e, 'hodnotiaci', 'ucitel', 'vyucujuci'),
    type: pick(e, 'terminPopis', 'typ'),
    registered: pick(e, 'prihlaseny', 'jePrihlaseny'),
    capacity: pick(e, 'kapacita', 'maxPocet'),
    taken: pick(e, 'pocetPrihlasenych', 'obsadene'),
    raw: e,
  }));
}

// --- Degree progress -------------------------------------------------------
const TYP_VYUCBY = { A: 'Povinné', B: 'Povinne voliteľné', C: 'Výberové', UZNANE: 'Uznané' };
export function normalizeProgress(raw) {
  const rows = asArray(raw)
    .map((r) => ({
      kind: TYP_VYUCBY[pick(r, 'kodTypVyucby')] || pick(r, 'kodTypVyucby'),
      enrolled: pick(r, 'pocetZapisane') ?? 0,
      passed: pick(r, 'pocetAbsolvovane') ?? 0,
      creditsEnrolled: pick(r, 'kredityZapisane') ?? 0,
      creditsPassed: pick(r, 'kredityAbsolvovane') ?? 0,
    }))
    .filter((r) => r.enrolled || r.creditsEnrolled);
  const total = rows.reduce(
    (a, r) => ({
      enrolled: a.enrolled + r.enrolled,
      passed: a.passed + r.passed,
      creditsEnrolled: a.creditsEnrolled + r.creditsEnrolled,
      creditsPassed: a.creditsPassed + r.creditsPassed,
    }),
    { enrolled: 0, passed: 0, creditsEnrolled: 0, creditsPassed: 0 }
  );
  return { rows, total };
}

// --- Study plan ------------------------------------------------------------
export function normalizePlan(raw) {
  const subjects = asArray(raw && raw.predmety).map((p) => ({
    code: pick(p, 'skratka'),
    name: pick(p, 'nazov'),
    credits: pick(p, 'kredit'),
    year: pick(p, 'rocnik'),
    semester: pick(p, 'semester'),
    kind: (p.typ && pick(p.typ, 'popis')) || undefined,
    block: (p.blok && pick(p.blok, 'popis')) || undefined,
    completion: pick(p, 'sposobUkoncenia'),
    done: !!pick(p, 'absolvovany'),
  }));
  return { code: pick(raw, 'skratka'), name: pick(raw, 'nazov'), subjects };
}
