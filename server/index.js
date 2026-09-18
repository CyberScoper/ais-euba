import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AisSession,
  AisError,
  ROZVRH_PATH,
  normalizeStudies,
  normalizeSubjects,
  normalizePayments,
  normalizeMessages,
  normalizeSchedule,
} from './aisClient.js';
import * as mock from './mock.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4173;
const MOCK = process.env.AIS_MOCK === '1';

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

app.get('/api/me', (req, res) => {
  if (MOCK) return res.json({ authenticated: true, user: mock.mockUser });
  const s = getSession(req);
  res.json({ authenticated: !!s });
});

// --- Data ------------------------------------------------------------------
app.get(
  '/api/schedule',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(mock.mockSchedule);
    res.json(normalizeSchedule(await req.ais.get(ROZVRH_PATH)));
  })
);

app.get(
  '/api/subjects',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(mock.mockSubjects);
    res.json(normalizeSubjects(await req.ais.get('studium/list')));
  })
);

app.get(
  '/api/payments',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(mock.mockPayments);
    res.json(normalizePayments(await req.ais.get('portal/osoba/poplatky')));
  })
);

app.get(
  '/api/messages',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(mock.mockMessages);
    res.json(normalizeMessages(await req.ais.get('messages/list2')));
  })
);

app.get(
  '/api/studies',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.json(mock.mockStudies);
    res.json(normalizeStudies(await req.ais.get('studium/list')));
  })
);

// Escape hatch: proxy any portal endpoint raw (for calibrating adapters).
app.get(
  '/api/raw/:path(*)',
  requireAuth,
  wrap(async (req, res) => {
    if (MOCK) return res.status(400).json({ error: 'raw disabled in mock mode' });
    res.json(await req.ais.get(req.params.path, { query: req.query }));
  })
);

// --- Static PWA ------------------------------------------------------------
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`AIS-PWA listening on :${PORT}  (mock=${MOCK ? 'on' : 'off'})`);
});
