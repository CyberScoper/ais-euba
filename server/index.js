import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AisSession,
  AisError,
  ROZVRH_PATH,
  currentSheetId,
  normalizeStudies,
  normalizeSubjects,
  normalizeAverages,
  normalizePayments,
  normalizeMessages,
  normalizeSchedule,
  normalizeCalendar,
  calendarStatus,
  normalizeExams,
  normalizeProgress,
  normalizePlan,
} from './aisClient.js';
import * as mock from './mock.js';
import { isReadOnly } from './guard.js';
import { getNews } from './news.js';
import { SessionStore, DEFAULT_TTL_MS } from './sessionStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4173;
const MOCK = process.env.AIS_MOCK === '1';
const USE_FIXTURE = MOCK && process.env.AIS_FIXTURE === '1';
const fx = USE_FIXTURE ? await import('./fixture.js') : null;
const SESSION_TTL_MS = Number(process.env.AIS_SESSION_DAYS) > 0
  ? Number(process.env.AIS_SESSION_DAYS) * 24 * 60 * 60 * 1000
  : DEFAULT_TTL_MS;

const app = express();
app.use(express.json());

// --- Sessions --------------------------------------------------------------
// `store` holds the session records: id, login, expiry and — only when the user ticked
// "stay signed in" — the AIS password, sealed with AES-256-GCM in a file outside the
// repo. `live` holds the live AisSession objects, which are per-process by nature and
// are rebuilt from the stored credential after a restart (see reviveSession).
const store = new SessionStore({ ttlMs: SESSION_TTL_MS }).init();
const live = new Map();
const reviving = new Map();

const truthy = (v) => v === true || v === 1 || v === '1' || v === 'true' || v === 'on' || v === 'yes';

function parseCookies(req) {
  const out = {};
  const h = req.headers.cookie;
  if (!h) return out;
  for (const part of h.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setSidCookie(req, res, sid, remember) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const parts = [`sid=${sid}`, 'HttpOnly', 'SameSite=Lax', 'Path=/'];
  // No Max-Age is the whole difference between the two modes: without it the cookie
  // dies with the browser, which is what "do not remember me" has to mean.
  if (remember) parts.push(`Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSidCookie(res) {
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
}

const unauth = (message = 'not_authenticated') => new AisError(401, message);

// A restored session has no AisSession yet: rebuild it from the stored credential.
// Everything goes through AisSession.login, so the LoginGuard circuit breaker still
// counts the failures and a wrong stored password can never loop against AIS.
function reviveSession(sid) {
  const pending = reviving.get(sid);
  if (pending) return pending;
  const p = (async () => {
    const cred = store.credential(sid);
    if (!cred) {
      store.destroy(sid);
      throw unauth('session_not_restorable');
    }
    const s = new AisSession();
    try {
      await s.login(cred.login, cred.password);
    } catch (e) {
      if (e && e.status === 401) {
        // The stored password is no longer right (changed in AIS, most likely).
        // Forget it and make the user type one, rather than retry a bad secret.
        store.destroy(sid);
        throw unauth('stored_credentials_rejected');
      }
      // 429 from the circuit breaker, or AIS simply being down: keep the credential,
      // the session is not the thing that is broken.
      throw e;
    }
    live.set(sid, s);
    return s;
  })().finally(() => reviving.delete(sid));
  reviving.set(sid, p);
  return p;
}

// Returns the AisSession for this request, reviving a restored session if needed.
async function sessionFor(req) {
  const sid = parseCookies(req).sid;
  const rec = store.get(sid);
  if (!rec) throw unauth();
  const ais = live.get(sid) || (await reviveSession(sid));
  store.touch(sid);
  return ais;
}

function requireAuth(req, res, next) {
  if (MOCK) return next();
  sessionFor(req).then(
    (ais) => {
      req.ais = ais;
      next();
    },
    (e) => {
      const status = e && e.status ? e.status : 500;
      if (status === 401) clearSidCookie(res);
      res.status(status).json({ error: e.message || 'internal_error' });
    }
  );
}

// Any error that carries a status keeps it — the LoginGuard's 429 is not an AisError,
// and the login screen has its own wording for exactly that status.
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    const status = Number(e && e.status) || 500;
    res.status(status).json({ error: (e && e.message) || 'internal_error' });
  });

// --- Auth ------------------------------------------------------------------
app.post(
  '/api/login',
  wrap(async (req, res) => {
    const { login, password, remember } = req.body || {};
    const stay = truthy(remember);
    if (MOCK) {
      const sid = store.create({ login: login || 'mock', password: password || 'mock', remember: stay, mock: true });
      setSidCookie(req, res, sid, stay);
      return res.json({ ok: true, user: (fx && fx.user) || mock.mockUser, remembered: stay });
    }
    if (!login || !password) return res.status(400).json({ error: 'missing_credentials' });
    const s = new AisSession();
    await s.login(login, password);
    const sid = store.create({ login, password, remember: stay });
    live.set(sid, s);
    setSidCookie(req, res, sid, stay);
    res.json({ ok: true, user: { login }, remembered: stay });
  })
);

app.post('/api/logout', (req, res) => {
  const sid = parseCookies(req).sid;
  if (sid) {
    live.delete(sid);
    store.destroy(sid); // drops the entry and the sealed credential with it
  }
  clearSidCookie(res);
  store.flush().then(() => res.json({ ok: true }), () => res.json({ ok: true }));
});

app.get('/api/me', wrap(async (req, res) => {
  const sid = parseCookies(req).sid;
  const rec = store.get(sid);
  if (!rec) {
    if (sid) clearSidCookie(res);
    return res.json({ authenticated: false, user: null, remembered: false });
  }
  store.touch(sid);
  // Sliding lifetime: a remembered cookie gets its full 30 days again on every visit.
  if (rec.remembered) setSidCookie(req, res, sid, true);
  if (MOCK) {
    return res.json({ authenticated: true, user: (fx && fx.user) || mock.mockUser, remembered: !!rec.remembered });
  }
  let ais = null;
  try {
    ais = await sessionFor(req);
  } catch (e) {
    // A stored credential AIS refuses means the session is really gone; AIS being down
    // or the login breaker being open does not — then the session simply stands.
    if (e && e.status === 401) {
      clearSidCookie(res);
      return res.json({ authenticated: false, user: null, remembered: false });
    }
  }
  let user = null;
  if (ais) {
    try { user = await ais.get('portal/users/info'); } catch { /* identity is optional */ }
  }
  res.json({ authenticated: true, user, remembered: !!rec.remembered });
}));

// Resolve the current enrolment sheet id; every student-predmety call needs it.
async function sheetId(ais) {
  const studies = normalizeStudies(await ais.get('portal/student-predmety/studia'));
  return currentSheetId(studies);
}

// --- Data ------------------------------------------------------------------
app.get(
  '/api/schedule',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(fx ? fx.schedule : mock.mockSchedule);
    res.json(normalizeSchedule(await req.ais.get(ROZVRH_PATH)));
  })
);

app.get(
  '/api/subjects',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(fx ? { subjects: fx.subjects, averages: fx.averages } : { subjects: mock.mockSubjects, averages: mock.mockAverages });
    const studies = normalizeStudies(await req.ais.get('portal/student-predmety/studia'));
    const zl = currentSheetId(studies);
    if (zl == null) return res.json({ subjects: [], averages: {} });
    const [znamky, priemery] = await Promise.all([
      req.ais.get(`portal/student-predmety/znamky/${zl}`),
      req.ais.get(`portal/student-predmety/studium-priemery/${zl}`).catch(() => null),
    ]);
    res.json({ subjects: normalizeSubjects(znamky), averages: normalizeAverages(priemery) });
  })
);

app.get(
  '/api/payments',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(fx ? fx.payments : mock.mockPayments);
    res.json(normalizePayments(await req.ais.get('portal/portal/osoba/poplatky')));
  })
);

app.get(
  '/api/messages',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(fx ? fx.messages : mock.mockMessages);
    res.json(normalizeMessages(await req.ais.get('portal/messages/list2')));
  })
);

app.get(
  '/api/studies',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(mock.mockStudies);
    res.json(normalizeStudies(await req.ais.get('portal/student-predmety/studia')));
  })
);

app.get(
  '/api/calendar',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(fx ? fx.calendar : { entries: [], status: {} });
    const zl = await sheetId(req.ais);
    if (zl == null) return res.json({ entries: [], status: {} });
    const entries = normalizeCalendar(await req.ais.get(`portal/student-predmety/upozornenia/${zl}`));
    res.json({ entries, status: calendarStatus(entries) });
  })
);

app.get(
  '/api/exams',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(fx ? fx.exams : []);
    const zl = await sheetId(req.ais);
    if (zl == null) return res.json([]);
    res.json(normalizeExams(await req.ais.get(`portal/student-predmety/skusky/${zl}`)));
  })
);

app.get(
  '/api/progress',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(fx ? fx.progress : { rows: [], total: {} });
    const zl = await sheetId(req.ais);
    if (zl == null) return res.json({ rows: [], total: {} });
    res.json(normalizeProgress(await req.ais.get(`portal/student-predmety/studium-prehlad/${zl}`)));
  })
);

app.get(
  '/api/plan',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(fx ? fx.plan : { subjects: [] });
    const zl = await sheetId(req.ais);
    if (zl == null) return res.json({ subjects: [] });
    res.json(normalizePlan(await req.ais.get(`portal/student-predmety/studijny-plan/${zl}`)));
  })
);

// University news from the public euba.sk RSS. Not an AIS call: no AIS session is
// touched and it stays out of the AIS pacer (see news.js). getNews() never throws and
// always resolves to an array, so a dead feed is an empty strip, not a broken screen.
app.get(
  '/api/news',
  requireAuth,
  wrap(async (_req, res) => {
    if (MOCK) return res.json(mock.mockNews);
    res.json(await getNews());
  })
);

// Escape hatch for calibrating adapters. Explicitly allowlisted: AIS exposes
// destructive actions over GET too (slavnosti/odhlasit, zaverecne-prace/odhlasit,
// statne-skusky/ziadost-zrusit), so refusing by verb would not be enough.
app.get(
  '/api/raw/:path(*)',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.status(400).json({ error: 'raw disabled in mock mode' });
    if (!isReadOnly(req.params.path)) {
      return res.status(403).json({ error: 'not a read-only endpoint', path: req.params.path });
    }
    res.json(await req.ais.get(req.params.path, { query: req.query }));
  })
);

// --- Static PWA ------------------------------------------------------------
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

app.listen(PORT, () => {
  const where = store.persistent ? store.file : 'memory only';
  console.log(
    `AIS-PWA listening on :${PORT}  (mock=${MOCK ? 'on' : 'off'}, sessions=${where}, ` +
      `lifetime=${Math.round(SESSION_TTL_MS / 86400000)}d)`
  );
});

// A debounced write may still be pending when systemd stops us.
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    store.flushSync();
    process.exit(0);
  });
}
process.on('exit', () => store.flushSync());
