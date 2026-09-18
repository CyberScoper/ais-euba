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

const BASE = process.env.AIS_BASE || 'https://ais2.euba.sk';
const LNG = (process.env.AIS_LNG || 'SK').toUpperCase();

// Constant obfuscation header the SPA sends to mint the access token.
const TOKEN_HEADER_NAME = '1lWgbIBjRKNgrgH';
const TOKEN_HEADER_VALUE = '2llVM1Fl3M';

const UA =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36';

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
  }

  get cookieHeader() {
    return this.jsessionid ? `JSESSIONID=${this.jsessionid}` : '';
  }

  async login(login, password) {
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
      throw new AisError(401, 'Login failed (no session established)');
    }
    this.creds = { login, password };
    await this.retrieveToken();
    if (!this.token) throw new AisError(401, 'Login failed (wrong username or password)');
    return true;
  }

  async retrieveToken() {
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
    const res = await fetch(`${BASE}/ais/rest/apps/check-session/check-light`, {
      headers: { AISAuth: this.token || '', Cookie: this.cookieHeader, 'User-Agent': UA },
    });
    if (res.status === 401) {
      // Session died server-side: silently re-login if we still hold credentials.
      if (this.creds) {
        await this.login(this.creds.login, this.creds.password);
      } else {
        throw new AisError(401, 'Session expired');
      }
      return;
    }
    const fresh = res.headers.get('aisAuth') || res.headers.get('AISAuth');
    if (fresh) this.token = fresh;
    this.lastRefresh = Date.now();
  }

  // Raw JSON GET against /ais/rest/<path>. Callers pass the namespace, because AIS
  // splits its API in two: portal/* (studies, fees, messages) and apps/* (rozvrh).
  async get(path, { query } = {}) {
    await this.refreshIfStale();
    const url = new URL(`${BASE}/ais/rest/${path.replace(/^\/+/, '')}`);
    url.searchParams.set('lng', LNG);
    if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

    const res = await fetch(url, {
      headers: {
        AISAuth: this.token || '',
        Cookie: this.cookieHeader,
        Accept: 'application/json',
        'User-Agent': UA,
      },
    });
    if (res.status === 401) {
      if (this.creds) {
        await this.login(this.creds.login, this.creds.password);
        return this.get(path, { query });
      }
      throw new AisError(401, 'Session expired');
    }
    if (!res.ok) throw new AisError(res.status, `AIS ${res.status} for ${path}`);
    const ct = res.headers.get('content-type') || '';
    return ct.includes('json') ? res.json() : res.text();
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
  return asArray(raw).map((s) => ({
    id: pick(s, 'id', 'studiumId', 'idStudium'),
    program: pick(s, 'program', 'studijnyProgram', 'nazovProgramu', 'nazov'),
    year: pick(s, 'rocnik', 'year'),
    status: pick(s, 'stav', 'status'),
    raw: s,
  }));
}

export function normalizeSubjects(raw) {
  return asArray(raw).map((p) => ({
    code: pick(p, 'skratka', 'kod', 'code'),
    name: pick(p, 'nazov', 'nazovPredmetu', 'name'),
    credits: pick(p, 'kredit', 'kredity', 'credits'),
    semester: pick(p, 'semester', 'obdobie'),
    grade: pick(p, 'znamka', 'hodnotenie', 'grade'),
    points: pick(p, 'body', 'points'),
    completed: pick(p, 'ukoncenie', 'stav'),
    raw: p,
  }));
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
  return asArray(raw).map((m) => ({
    id: pick(m, 'id', 'idSprava'),
    subject: pick(m, 'predmet', 'nazov', 'subject', 'titulok'),
    from: pick(m, 'od', 'odosielatel', 'from'),
    date: pick(m, 'datum', 'date'),
    unread: pick(m, 'neprecitane', 'unread'),
    body: pick(m, 'text', 'obsah', 'body'),
    raw: m,
  }));
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
export function normalizeSchedule(raw) {
  // The rozvrh payload may be wrapped; take the first array-ish member we find.
  let list = asArray(raw);
  if (!list.length && raw && typeof raw === 'object') {
    for (const v of Object.values(raw)) if (Array.isArray(v) && v.length) { list = v; break; }
  }
  return list.map((e) => ({
    day: dayToIndex(pick(e, 'den', 'denVTyzdni', 'dayOfWeek', 'day')),
    from: hhmm(pick(e, 'casOd', 'od', 'zaciatok', 'timeFrom', 'from')),
    to: hhmm(pick(e, 'casDo', 'do', 'koniec', 'timeTo', 'to')),
    subject: pick(e, 'nazovPredmetu', 'predmet', 'subject', 'nazov'),
    code: pick(e, 'skratkaPredmetu', 'kodPredmetu', 'skratka', 'kod'),
    type: pick(e, 'typVyucby', 'typ', 'druh', 'type'), // prednáška / cvičenie
    room: pick(e, 'miestnost', 'ucebna', 'miestnosti', 'room'),
    teacher: pick(e, 'ucitel', 'ucitelia', 'vyucujuci', 'teacher'),
    period: pick(e, 'tyzden', 'periodicita', 'opakovanie'), // e.g. TYZ = weekly
    dateFrom: pick(e, 'datumOd', 'platnostOd'),
    dateTo: pick(e, 'datumDo', 'platnostDo'),
    raw: e,
  }));
}
