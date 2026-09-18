import express from 'express';
import crypto from 'node:crypto';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4173;
const MOCK = process.env.AIS_MOCK === '1';
const USE_FIXTURE = MOCK && process.env.AIS_FIXTURE === '1';
const fx = USE_FIXTURE ? await import('./fixture.js') : null;

const app = express();
app.use(express.json());

// --- Session store: PWA session id (httpOnly cookie) -> AisSession (in memory only).
// Credentials never touch disk. Restarting the server logs everyone out. For a single
// user on a private VPS this is exactly what you want.
const sessions = new Map();

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

function getSession(req) {
  const sid = parseCookies(req).sid;
  return sid ? sessions.get(sid) : null;
}

function requireAuth(req, res, next) {
  if (MOCK) return next();
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: 'not_authenticated' });
  req.ais = s;
  next();
}

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    const status = e instanceof AisError ? e.status : 500;
    res.status(status).json({ error: e.message || 'internal_error' });
  });

// --- Auth ------------------------------------------------------------------
app.post(
  '/api/login',
  wrap(async (req, res) => {
    if (MOCK) {
      res.setHeader('Set-Cookie', `sid=mock; HttpOnly; SameSite=Lax; Path=/`);
      return res.json({ ok: true, user: mock.mockUser });
    }
    const { login, password } = req.body || {};
    if (!login || !password) return res.status(400).json({ error: 'missing_credentials' });
    const s = new AisSession();
    await s.login(login, password);
    const sid = crypto.randomBytes(24).toString('hex');
    sessions.set(sid, s);
    const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.setHeader(
      'Set-Cookie',
      `sid=${sid}; HttpOnly; SameSite=Lax; Path=/${secure ? '; Secure' : ''}`
    );
    res.json({ ok: true, user: { login } });
  })
);

app.post('/api/logout', (req, res) => {
  const sid = parseCookies(req).sid;
  if (sid) sessions.delete(sid);
  res.setHeader('Set-Cookie', `sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

app.get('/api/me', wrap(async (req, res) => {
  if (MOCK) return res.json({ authenticated: true, user: (fx && fx.user) || mock.mockUser });
  const s = getSession(req);
  if (!s) return res.json({ authenticated: false });
  let user = null;
  try { user = await s.get('portal/users/info'); } catch { /* identity is optional */ }
  res.json({ authenticated: true, user });
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
  console.log(`AIS-PWA listening on :${PORT}  (mock=${MOCK ? 'on' : 'off'})`);
});
