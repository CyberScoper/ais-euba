// AIS-PWA front-end — vanilla ES modules, no build step.
//
// Every user-facing sentence comes from i18n.js (sk/ru/uk). Nothing here builds a
// sentence out of pieces: a count goes into the string as {n} so each language can
// put the number where its grammar wants it.
import { HANDBOOK, HANDBOOK_CHECKED } from './handbook.js';
import {
  LANGS, getLang, setLang, applyLangToDocument, t, aisTerm,
  dayName, dayShort, dayIn, fmtDate, fmtDateLong, hhmm, greeting, cap,
} from './i18n.js';

// ---- icons (single consistent 1.75 stroke, currentColor) -------------------
const I = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v2M5.2 5.2l1.4 1.4M3 12h2M19 12h2M17.4 6.6l1.4-1.4"/><circle cx="12" cy="13" r="4.2"/></svg>',
  schedule: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 3v3M16 3v3M7.5 13h3M7.5 16.5h6"/></svg>',
  subjects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 3 8.5l9 4.5 9-4.5L12 4Z"/><path d="M6.5 10.5V15c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.5M21 8.5v5"/></svg>',
  finance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16.5 14.5h1.5"/></svg>',
  messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 16V7A1.5 1.5 0 0 1 4 5.5Z"/><path d="m3 7 9 6 9-6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17.2v.1"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M10 12h10M17 9l3 3-3 3"/></svg>',
  theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13.5A8 8 0 0 1 10.5 4a8 8 0 1 0 9.5 9.5Z"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13.5 6 6h12l2 7.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-4.5Z"/><path d="M4 13.5h4l1.5 2.5h5L16 13.5h4"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 8a8 8 0 1 0 1.5 6"/><path d="M20 3v5h-5"/></svg>',
  // The wordmark: an index card with its tab, drawn in the same stroke as the rest.
  mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14.5" rx="2.5"/><path d="M8.5 5v14.5M12 9.5h5M12 13.5h5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 5 6v5.6c0 4.2 2.9 7.6 7 9.2 4.1-1.6 7-5 7-9.2V6l-7-2.8Z"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="12" r="3.6"/><path d="M11.6 12H21M18 12v3M15 12v2.2"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M19 14.5V19a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V7a1.5 1.5 0 0 1 1.5-1.5H10"/></svg>',
  news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 5.5h12a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 0 1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-12Z"/><path d="M18 9.5h1.5A1.5 1.5 0 0 1 21 11v7M7.5 9h6M7.5 12.5h6M7.5 16h3.5"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8L14 3.5Z"/><path d="M13.5 3.8V8.5H18M8.5 13h7M8.5 16.5h5"/></svg>',
  euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 6.8A6.2 6.2 0 0 0 8 9.5m0 5a6.2 6.2 0 0 0 9.5 2.7"/><path d="M4.5 10.5h8M4.5 13.5h8"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5h-14S6.5 14 6.5 10Z"/><path d="M10.2 19a2 2 0 0 0 3.6 0"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 7l5 5-5 5"/></svg>',
  dot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="4.5"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
  campus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20.5h18M5 20.5V9l5-3 5 3v11.5M15 20.5V12l4-2v10.5"/><path d="M8 12.5h2M8 16h2"/></svg>',
  bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="12.5" rx="2.5"/><path d="M4 10.5h16M7.5 20v-3.5M16.5 20v-3.5"/><circle cx="8" cy="13.6" r="0.9" fill="currentColor" stroke="none"/><circle cx="16" cy="13.6" r="0.9" fill="currentColor" stroke="none"/></svg>',
  food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7.5a2 2 0 0 0 4 0V3M8 10.5V21"/><path d="M17 3c-1.6 1.2-2.5 3-2.5 5.2 0 1.6.8 2.6 2.5 2.8V21"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5V5.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5V5.5Z"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><circle cx="8.5" cy="11" r="2"/><path d="M6 15.5c.6-1.2 1.5-1.8 2.5-1.8s1.9.6 2.5 1.8M14 10h4M14 13.5h4"/></svg>',
  bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18.5V7M3 12.5h18v6M21 18.5v-4"/><circle cx="7.5" cy="10" r="2"/><path d="M11 12.5V10a1.5 1.5 0 0 1 1.5-1.5H19A2 2 0 0 1 21 10.5v2"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 10 4 4 4-4"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5.5 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v.5"/></svg>',
};

// Rebuilt on every render: the labels change when the language does.
const tabs = () => [
  { id: 'dnes', label: t('nav.dnes'), icon: I.today },
  { id: 'rozvrh', label: t('nav.rozvrh'), icon: I.schedule },
  { id: 'predmety', label: t('nav.predmety'), icon: I.subjects },
  { id: 'financie', label: t('nav.financie'), icon: I.finance },
  { id: 'spravy', label: t('nav.spravy'), icon: I.messages },
];

/**
 * Lectures indigo, cvičenia and semináre teal. They were briefly painted in the live
 * marker's burnt orange, which made a normal week look like an alarm and made "now"
 * and "seminar" the same colour — so the second kind gets its own quiet accent, and
 * orange stays with "now" alone.
 */
function lessonColors(type = '') {
  const kind = String(type).toLowerCase();
  const practice = kind.includes('cvič') || kind.includes('sem');
  return {
    color: practice ? 'var(--accent-2)' : 'var(--accent)',
    soft: practice ? 'var(--accent-2-soft)' : 'var(--accent-soft)',
    practice,
  };
}

/** Two dots telling the reader what the two colours mean. */
function lessonLegend() {
  return h(`<div class="legend">
    <span style="--legend-color:var(--accent)"><i></i>${esc(cap(aisTerm('prednáška')))}</span>
    <span style="--legend-color:var(--accent-2)"><i></i>${esc(cap(aisTerm('cvičenie')))}</span>
  </div>`);
}

// ---- tiny helpers ----------------------------------------------------------
const $ = (sel, el = document) => el.querySelector(sel);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const toMin = (t) => { if (!t) return 0; const [a, b] = String(t).split(':').map(Number); return a * 60 + (b || 0); };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const initials = (s) => (s || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ---- api -------------------------------------------------------------------
const api = {
  async get(path) {
    const r = await fetch(`/api/${path}`, { credentials: 'same-origin' });
    if (r.status === 401) {
      if (state.authed) {
        state.authed = false;
        state.notice = t('login.expired');
        render();
      }
      throw new Error('unauth');
    }
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(`/api/${path}`, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
    });
    const data = await r.json().catch(() => ({}));
    // The status carries meaning the message does not: 429 is the login circuit
    // breaker protecting the AIS account, and it needs its own wording.
    if (!r.ok) { const e = new Error(data.error || `HTTP ${r.status}`); e.status = r.status; throw e; }
    return data;
  },
};

// cache so tab switches are instant; refresh in background
const cache = {};
/** When each key was last fetched, so the screen can say how old what you see is. */
let fetchedAt = null;
async function load(key, path) {
  if (cache[key]) return cache[key];
  const data = await api.get(path);
  cache[key] = data;
  fetchedAt = new Date();
  return data;
}

/**
 * Optional data: an endpoint the server may not have, or that may legitimately
 * answer nothing. Never let it break the screen it decorates.
 */
async function loadSoft(key, path, fallback = null) {
  try { return await load(key, path); } catch { return fallback; }
}

function dropCache() { Object.keys(cache).forEach((k) => delete cache[k]); }

let refreshing = false;
async function refreshAll() {
  if (refreshing) return;
  refreshing = true;
  document.documentElement.classList.add('syncing');
  dropCache();
  try {
    await render();
    toast(t('app.updatedAt', { t: hhmm(new Date()) }));
  } finally {
    refreshing = false;
    document.documentElement.classList.remove('syncing');
  }
}

// ---- state / theme ---------------------------------------------------------
/** The switcher only carries Po-Pi, so a weekend opens on Monday rather than on nothing. */
function weekdayToday() {
  const d = new Date().getDay();
  return d >= 1 && d <= 5 ? d : 1;
}

const state = { authed: false, user: null, route: 'dnes', day: weekdayToday(), subTab: 'sem', notice: '' };

function applyTheme() {
  // ?theme=dark|light forces a theme (handy for QA and for sharing a link).
  const forced = new URLSearchParams(location.search).get('theme');
  if (forced === 'dark' || forced === 'light') {
    document.documentElement.dataset.theme = forced;
    return;
  }
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch {}
  if (saved) document.documentElement.dataset.theme = saved;
}
let themingTimer;
function toggleTheme() {
  const root = document.documentElement;
  const cur = root.dataset.theme
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  // Scoped to the flip itself so nothing else pays for the transition.
  root.classList.add('theming');
  clearTimeout(themingTimer);
  themingTimer = setTimeout(() => root.classList.remove('theming'), 220);
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch {}
}

// ---- views -----------------------------------------------------------------
/** Midnight-to-midnight distance, so "tomorrow" does not depend on the clock. */
function daysUntil(date, from = new Date()) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b - a) / 86400000);
}

/** "dnes", "zajtra", "v pondelok", or the plain date once the week runs out. */
function whenWord(date) {
  const d = daysUntil(date);
  if (d === 0) return t('common.today');
  if (d === 1) return t('common.tomorrow');
  if (d > 1 && d < 7) return dayIn(date.getDay());
  return fmtDate(date);
}

/** "o 09:15" / "в 09:15" — bold tabular figures inside each language's phrase. */
function atTime(time) {
  return t('today.atTime', { t: `<b class="tnum">${esc(time)}</b>` });
}

function firstName(full) {
  return String(full || '').trim().split(/\s+/)[0] || '';
}

/**
 * The next lesson anywhere in the week, as a date: the weekly grid repeats, so
 * "next" means the nearest weekday that carries one, starting from today.
 */
function nextLesson(sch, from = new Date()) {
  const cur = nowMin();
  for (let ahead = 0; ahead <= 7; ahead++) {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + ahead);
    const day = date.getDay();
    const items = sch
      .filter((l) => Number(l.day) === day && (ahead > 0 || toMin(l.from) > cur))
      .sort((a, b) => toMin(a.from) - toMin(b.from));
    if (items.length) return { lesson: items[0], date, count: sch.filter((l) => Number(l.day) === day).length };
  }
  return null;
}

/** Which days of the week carry lessons — the day switcher marks them. */
function daysWithLessons(sch) {
  const set = new Set(sch.map((l) => Number(l.day)));
  return set;
}

/**
 * Turns a failed sign-in into a sentence that says what to do next. The 429 case
 * matters most: the server stopped trying on purpose, and hammering the form is
 * exactly what would lock the AIS account.
 */
function loginError(ex) {
  if (ex.status === 429) return t('login.err.blocked');
  if (ex.message === 'missing_credentials') return t('login.err.missing');
  if (ex.status === 401) return t('login.err.wrong');
  if (ex.status >= 500 || ex.message === 'Failed to fetch') return t('login.err.ais');
  return t('login.err.generic');
}

/**
 * SK · RU · UA. The whole screen is re-rendered on a switch rather than patched,
 * because the language changes headings, counts and dates at once.
 */
function langSwitch() {
  const el = h(`<div class="langsw" role="group" aria-label="${esc(t('app.language'))}"></div>`);
  LANGS.forEach((l) => {
    const on = l.id === getLang();
    const b = h(`<button type="button" class="${on ? 'active' : ''}" lang="${l.id}"
      title="${esc(l.native)}" aria-pressed="${on}">${esc(l.short)}</button>`);
    b.addEventListener('click', () => { if (!on) { setLang(l.id); render(); } });
    el.appendChild(b);
  });
  return el;
}

function viewLogin() {
  const box = h(`
    <div class="login">
      <div class="login__art" aria-hidden="true"></div>
      <div class="login__pane">
        <div class="box view">
          <div class="brandline">
            <div class="mark">${I.mark}</div>
            <div><b>Index</b><span>${esc(t('app.tagline'))}</span></div>
            <div class="bgrow"></div>
          </div>
          <h1>${esc(t('login.title'))}</h1>
          <p class="sub">${esc(t('login.sub'))}</p>
          <form id="lf">
            <div class="field">
              <label for="lg">${esc(t('login.user'))}</label>
              <input id="lg" name="login" autocomplete="username" autocapitalize="none" spellcheck="false" enterkeyhint="next" required />
            </div>
            <div class="field">
              <label for="pw">${esc(t('login.password'))}</label>
              <input id="pw" name="password" type="password" autocomplete="current-password" enterkeyhint="go" required />
            </div>
            <label class="check"><input type="checkbox" id="rm" name="remember" checked /><span>${esc(t('login.remember'))}</span></label>
            <div class="err" id="le" role="alert">${esc(state.notice || '')}</div>
            <button class="btn primary full" type="submit" id="lb">${esc(t('login.submit'))}</button>
          </form>
          <ul class="trust">
            <li>${I.shield}<span>${t('login.trust.notUni')}</span></li>
            <li>${I.key}<span id="pwnote"></span></li>
            <li>${I.ext}<span>${t('login.trust.direct')} <a href="https://ais2.euba.sk" target="_blank" rel="noopener noreferrer">${esc(t('login.trust.openAis'))}</a></span></li>
          </ul>
        </div>
      </div>
    </div>`);
  box.querySelector('.brandline').appendChild(langSwitch());
  state.notice = '';
  // What happens to the password depends on the checkbox, so the sentence under the
  // form follows it instead of stating one convenient half of the truth.
  const rm = box.querySelector('#rm');
  const pwnote = box.querySelector('#pwnote');
  const syncNote = () => { pwnote.innerHTML = rm.checked ? t('login.pw.on') : t('login.pw.off'); };
  syncNote();
  rm.addEventListener('change', syncNote);
  box.querySelector('#lf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = box.querySelector('#lb'); const err = box.querySelector('#le');
    err.textContent = ''; btn.disabled = true; btn.textContent = t('login.submitting');
    try {
      const fd = new FormData(e.target);
      const res = await api.post('login', {
        login: fd.get('login'),
        password: fd.get('password'),
        remember: box.querySelector('#rm').checked,
      });
      state.authed = true; state.user = res.user || null;
      dropCache();
      render();
    } catch (ex) {
      err.textContent = loginError(ex);
      btn.disabled = false; btn.textContent = t('login.submit');
    }
  });
  return box;
}

function skeletonList(n = 4) {
  const w = h('<div class="rowlist"></div>');
  for (let i = 0; i < n; i++) {
    const r = h('<div class="row" style="border:none;padding:12px 4px"></div>');
    r.appendChild(h('<div class="skel" style="width:42px;height:42px;border-radius:12px;flex-shrink:0"></div>'));
    const b = h('<div style="flex:1"></div>');
    b.appendChild(h('<div class="skel" style="height:14px;width:60%"></div>'));
    b.appendChild(h('<div class="skel" style="height:11px;width:35%;margin-top:8px"></div>'));
    r.appendChild(b); w.appendChild(r);
  }
  return w;
}

function empty(icon, title, sub = '') {
  return h(`<div class="empty">${icon}<div class="t">${esc(title)}</div>${sub ? `<div>${esc(sub)}</div>` : ''}</div>`);
}

// --- lesson card
function lessonCard(l, live = false) {
  const c = lessonColors(l.type);
  const el = h(`
    <div class="lesson ${live ? 'now' : ''} ${c.practice ? 'practice' : ''}" style="--type-color:${c.color}">
      <div class="time">
        <span class="from tnum">${esc(l.from || '')}</span>
        <span class="to tnum">${esc(l.to || '')}</span>
      </div>
      <div class="body">
        <div class="name">${esc(l.subject || t('common.subject'))}</div>
        <div class="info">
          ${l.type ? `<span class="badge accent" style="background:${c.soft};color:${c.color}">${esc(aisTerm(l.type))}</span>` : ''}
          ${l.room ? `<span class="i">${I.pin}${esc(l.room)}</span>` : ''}
          ${l.teacher ? `<span class="i">${I.user}${esc(l.teacher)}</span>` : ''}
        </div>
      </div>
    </div>`);
  return el;
}

// --- Today
async function viewToday(root) {
  const wrap = h('<div class="view"></div>');
  root.appendChild(wrap);
  const hero = h('<div class="hero skel" style="height:150px"></div>');
  wrap.appendChild(hero);

  // The schedule is the screen; payments and messages only decorate two small cards,
  // so their failure must not blank the day.
  const [sch, pays, msgs] = await Promise.all([
    load('schedule', 'schedule'),
    loadSoft('payments', 'payments', []),
    loadSoft('messages', 'messages', []),
  ]);

  const today = new Date().getDay();
  const todays = sch.filter((l) => Number(l.day) === today).sort((a, b) => toMin(a.from) - toMin(b.from));
  const cur = nowMin();
  const nextL = todays.find((l) => toMin(l.from) > cur);
  const liveL = todays.find((l) => toMin(l.from) <= cur && toMin(l.to) > cur);
  const due = pays.filter((p) => !p.paid);
  const oweSum = due.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const msgCount = msgs.length;

  const cal = await loadSoft('calendar', 'calendar', null);
  const st = (cal && cal.status) || {};
  const upcoming = nextLesson(sch);

  let heroHtml;
  if (liveL) {
    heroHtml = `<div class="hero"><div class="eyebrow" style="color:var(--now);display:flex;align-items:center;gap:7px">
      <span class="livedot"><i></i></span>${esc(t('today.live'))}</div>
      <div class="big">${esc(liveL.subject)}</div>
      <div class="meta"><span>${I.clock2()} <b class="tnum">${esc(liveL.from)}–${esc(liveL.to)}</b></span>
      ${liveL.room ? `<span>${esc(liveL.room)}</span>` : ''}${liveL.teacher ? `<span>${esc(liveL.teacher)}</span>` : ''}</div></div>`;
  } else if (nextL) {
    heroHtml = `<div class="hero"><div class="eyebrow">${esc(t('today.next'))}</div>
      <div class="big">${esc(nextL.subject)}</div>
      <div class="meta"><span>${atTime(nextL.from)}</span>
      ${nextL.room ? `<span>${esc(nextL.room)}</span>` : ''}${nextL.type ? `<span>${esc(aisTerm(nextL.type))}</span>` : ''}</div></div>`;
  } else if (!st.current && st.next && st.daysToNext >= 0) {
    // Nothing today because the semester has not started. Say so, and say when it does:
    // an empty screen with no explanation is what makes the app look broken.
    const start = new Date(st.next.from);
    const d = st.daysToNext;
    heroHtml = `<div class="hero quiet"><div class="eyebrow">${esc(fmtDateLong())}</div>
      <div class="big">${esc(t('today.semStarts', { title: aisTerm(st.next.title), when: whenWord(start) }))}</div>
      <div class="meta"><span>${esc(d === 0 ? t('common.today') : t('today.inDays', { n: d }))}<b class="tnum"> · ${esc(fmtDate(start))}</b></span>
      ${upcoming ? `<span>${t('today.firstLesson', { dayIn: esc(dayIn(upcoming.date.getDay())), t: `<b class="tnum">${esc(upcoming.lesson.from)}</b>` })}</span>` : ''}</div></div>`;
  } else {
    heroHtml = `<div class="hero quiet"><div class="eyebrow">${esc(fmtDateLong())}</div>
      <div class="big">${esc(todays.length ? t('today.done') : t('today.none'))}</div>
      ${upcoming ? `<div class="meta"><span>${t('today.nearest', { when: esc(whenWord(upcoming.date)), t: `<b class="tnum">${esc(upcoming.lesson.from)}</b>` })}</span><span>${esc(upcoming.lesson.subject)}</span></div>` : ''}</div>`;
  }
  hero.replaceWith(h(heroHtml));

  // Academic period: which part of the year we are in, at a glance. Skipped when the
  // hero above already says the same sentence.
  let periodHtml = '';
  if (st.current) {
    periodHtml = `<span class="pname">${esc(aisTerm(st.current.title))}</span>
      ${st.week ? `<span class="pdot"></span><span>${esc(t('period.week', { n: st.week }))}</span>` : ''}
      <span class="pdot"></span><span>${esc(t('period.left', { n: st.daysLeft }))}</span>`;
  }
  if (periodHtml) wrap.appendChild(h(`<div class="period">${periodHtml}</div>`));

  const glance = h(`<div class="glance">
    <a class="g" href="#financie"><span class="n tnum">${oweSum ? oweSum.toFixed(0) + ' €' : '0 €'}</span><span class="l">${esc(due.length ? t('today.unpaid', { n: due.length }) : t('today.oweNothing'))}</span></a>
    <a class="g" href="#spravy"><span class="n tnum">${msgCount}</span><span class="l">${esc(msgCount ? t('today.inbox', { n: msgCount }) : t('today.inboxEmpty'))}</span></a>
  </div>`);
  wrap.appendChild(glance);

  const showsNext = !todays.length && !!upcoming;
  wrap.appendChild(h(`<div class="section-h"><h2>${esc(showsNext ? t('today.headingNext') : t('today.headingToday'))}</h2>
    <span class="muted">${esc(showsNext ? fmtDate(upcoming.date) : dayName(today))}</span><span class="grow"></span></div>`));
  if (showsNext) {
    // An empty day is a fact, not an error. Show the next real lesson instead of a shrug.
    const l = upcoming.lesson;
    const card = h(`<a class="nextcard" href="#rozvrh">
      <div class="when"><span class="d">${esc(cap(whenWord(upcoming.date)))}</span><span class="t tnum">${esc(l.from)}–${esc(l.to)}</span></div>
      <div class="body"><div class="name">${esc(l.subject || t('common.subject'))}</div>
        <div class="info">${l.room ? `<span class="i">${I.pin}${esc(l.room)}</span>` : ''}${l.teacher ? `<span class="i">${I.user}${esc(l.teacher)}</span>` : ''}
        ${upcoming.count > 1 ? `<span class="i">${esc(t('today.moreThatDay', { n: upcoming.count - 1 }))}</span>` : ''}</div></div>
      <span class="go">${I.arrow}</span></a>`);
    wrap.appendChild(card);
  } else if (!todays.length) {
    wrap.appendChild(empty(I.schedule, t('today.freeDay'), t('today.freeDaySub')));
  } else {
    const ag = h('<div class="agenda"></div>');
    let placedNow = false;
    todays.forEach((l) => {
      if (!placedNow && !liveL && toMin(l.from) > cur && cur > (todays[0] ? toMin(todays[0].from) - 1 : 0)) {
        ag.appendChild(h(`<div class="nowline"><span class="livedot"><i></i></span>${esc(t('common.now', { t: hhmm(new Date()) }))}</div>`));
        placedNow = true;
      }
      ag.appendChild(lessonCard(l, liveL === l));
    });
    wrap.appendChild(ag);
  }

  // University news: the one thing that has content before the semester starts.
  // Absent endpoint or empty feed renders nothing at all.
  const news = await loadSoft('news', 'news', []);
  if (Array.isArray(news) && news.length) {
    wrap.appendChild(h(`<div class="section-h"><h2>${esc(t('today.news'))}</h2><span class="muted">euba.sk</span></div>`));
    const list = h('<div class="newslist"></div>');
    news.slice(0, 4).forEach((n) => {
      const d = n.date ? new Date(n.date) : null;
      const when = d && !isNaN(d) ? fmtDate(d) : '';
      list.appendChild(h(`<a class="newsitem" href="${esc(n.link || '#')}" target="_blank" rel="noopener noreferrer">
        ${n.image ? `<img class="thumb" src="${esc(n.image)}" alt="" loading="lazy" decoding="async" />` : `<span class="thumb ph">${I.news}</span>`}
        <span class="nbody"><span class="t">${esc(n.title || '')}</span>
        ${n.summary ? `<span class="s">${esc(n.summary)}</span>` : ''}
        <span class="f">${esc(when)}</span></span></a>`));
    });
    wrap.appendChild(list);
  }
}
// small inline clock for hero meta
I.clock2 = () => `<span style="display:inline-flex;vertical-align:-3px;width:15px;height:15px">${I.clock}</span>`;

// --- Schedule (week)
async function viewSchedule(root) {
  const wrap = h('<div class="view"></div>'); root.appendChild(wrap);
  wrap.appendChild(skeletonList(3));
  const sch = await load('schedule', 'schedule');
  wrap.innerHTML = '';

  const today = new Date().getDay();
  const has = daysWithLessons(sch);

  // Before the first teaching week the grid is real but not in force yet; say from when.
  const validFrom = sch.map((l) => l.dateFrom).filter(Boolean).sort()[0];
  if (validFrom) {
    const vf = new Date(`${validFrom}T00:00:00`);
    if (!isNaN(vf) && daysUntil(vf) > 0) {
      wrap.appendChild(h(`<div class="period"><span class="pname">${esc(t('sched.validFrom', { d: fmtDate(vf) }))}</span>
        <span class="pdot"></span><span>${esc(whenWord(vf))}</span></div>`));
    }
  }

  wrap.appendChild(lessonLegend());

  // mobile: day switcher + agenda
  const mob = h('<div class="agenda-wrap desktop-hide"></div>');
  const sw = h('<div class="dayswitch"></div>');
  for (let d = 1; d <= 5; d++) {
    const b = h(`<button class="${d === state.day ? 'active' : ''} ${d === today ? 'today' : ''} ${has.has(d) ? 'has' : ''}"
      aria-pressed="${d === state.day}">${dayShort(d)}</button>`);
    b.addEventListener('click', () => { state.day = d; render(); });
    sw.appendChild(b);
  }
  mob.appendChild(sw);
  const dayL = sch.filter((l) => Number(l.day) === state.day).sort((a, b) => toMin(a.from) - toMin(b.from));
  if (!dayL.length) {
    // A free day used to end the screen with a button and 500px of nothing. The
    // nearest day that does carry lessons is what the question "and when, then?"
    // actually wants, so it is shown in full right here.
    const near = [1, 2, 3, 4, 5].filter((d) => has.has(d)).sort((a, b) => ((a - state.day + 7) % 7) - ((b - state.day + 7) % 7))[0];
    const emp = empty(I.schedule, t('today.freeDay'), t('sched.freeDayFor', { dayIn: cap(dayIn(state.day)) }));
    emp.classList.add('tight');
    mob.appendChild(emp);
    if (near) {
      const head = h(`<div class="section-h"><h2>${esc(cap(dayName(near)))}</h2>
        <span class="muted">${esc(t('sched.nextWithLessons'))}</span></div>`);
      mob.appendChild(head);
      const ag = h('<div class="agenda"></div>');
      sch.filter((l) => Number(l.day) === near)
        .sort((a, b) => toMin(a.from) - toMin(b.from))
        .forEach((l) => ag.appendChild(lessonCard(l, false)));
      mob.appendChild(ag);
    }
  } else { const ag = h('<div class="agenda"></div>'); dayL.forEach((l) => ag.appendChild(lessonCard(l, false))); mob.appendChild(ag); }
  wrap.appendChild(mob);

  // desktop: week grid
  wrap.appendChild(buildWeekGrid(sch, today));
}

function buildWeekGrid(sch, today) {
  // Fit the rail to the real teaching window instead of a fixed 8–20 band,
  // so an empty afternoon never eats half the screen.
  const week = sch.filter((l) => Number(l.day) >= 1 && Number(l.day) <= 5);
  const mins = week.map((l) => toMin(l.from)).filter(Boolean);
  const maxs = week.map((l) => toMin(l.to)).filter(Boolean);
  const start = mins.length ? Math.floor(Math.min(...mins) / 60) * 60 : 8 * 60;
  const end = maxs.length ? Math.ceil(Math.max(...maxs) / 60) * 60 : 20 * 60;
  const pxPerMin = 0.9;
  const grid = h('<div class="weekgrid"></div>');
  grid.appendChild(h('<div class="dh"></div>'));
  for (let d = 1; d <= 5; d++) grid.appendChild(h(`<div class="dh ${d === today ? 'today' : ''}">${dayShort(d)}</div>`));
  // rows per hour
  const totalH = (end - start) / 60;
  const colH = totalH * 60 * pxPerMin;
  // time column
  const tcol = h(`<div class="cell" style="padding:0;position:relative;height:${colH}px;background:var(--surface-2)"></div>`);
  for (let hh = start / 60; hh <= end / 60; hh++) {
    tcol.appendChild(h(`<div class="hh" style="position:absolute;top:${(hh * 60 - start) * pxPerMin - 8}px;right:0;left:0">${hh}:00</div>`));
  }
  grid.appendChild(tcol);
  for (let d = 1; d <= 5; d++) {
    const col = h(`<div class="cell" style="position:relative;height:${colH}px;padding:0"></div>`);
    sch.filter((l) => Number(l.day) === d).forEach((l) => {
      const c = lessonColors(l.type);
      const top = (toMin(l.from) - start) * pxPerMin;
      const hgt = Math.max(30, (toMin(l.to) - toMin(l.from)) * pxPerMin - 3);
      const el = h(`<div class="wk-lesson ${c.practice ? 'practice' : ''}" style="top:${top}px;height:${hgt}px;--type-color:${c.color};--type-soft:${c.soft}">
        <div class="n">${esc(l.subject)}</div><div class="m tnum">${esc(l.from)} · ${esc(l.room || '')}</div></div>`);
      col.appendChild(el);
    });
    grid.appendChild(col);
  }
  return grid;
}

// --- Subjects / grades
async function viewSubjects(root) {
  const wrap = h('<div class="view"></div>'); root.appendChild(wrap);
  wrap.appendChild(skeletonList(5));
  const [resp, progress, exams] = await Promise.all([
    load('subjects', 'subjects'),
    load('progress', 'progress').catch(() => null),
    load('exams', 'exams').catch(() => []),
  ]);
  const subs = Array.isArray(resp) ? resp : (resp.subjects || []);
  const avg = (resp && resp.averages) || {};
  wrap.innerHTML = '';

  const graded = subs.filter((sx) => sx.grade);
  const totalCr = subs.reduce((a, sx) => a + (Number(sx.credits) || 0), 0);
  const gpa = (avg.graded != null && Number(avg.graded) > 0)
    ? Number(avg.graded).toFixed(2)
    : (graded.length ? weightedGpa(graded) : '—');

  const tot = (progress && progress.total) || {};
  const crPassed = tot.creditsPassed ?? 0;
  const crEnrolled = tot.creditsEnrolled ?? totalCr;

  if (!graded.length && !crPassed) {
    // Three zeros and a dash read as a broken screen. Before the first exam period
    // there is nothing to average, so say what there is instead: what is enrolled,
    // and when marks appear.
    const cal = await loadSoft('calendar', 'calendar', null);
    const exam = ((cal && cal.entries) || []).find((e) => /skúškové/i.test(e.title || '') && new Date(e.from) > new Date());
    wrap.appendChild(h(`<div class="statecard">
      <div class="t">${esc(t('subj.noGrades'))}</div>
      <div class="s">${esc(t('subj.noGradesSub', {
        subjects: t('subj.subjects', { n: subs.length }),
        credits: t('subj.credits', { n: crEnrolled }),
      }))}</div>
      ${exam ? `<div class="m">${esc(t('subj.examFrom', { title: aisTerm(exam.title), d: fmtDate(new Date(exam.from)) }))}</div>` : ''}
    </div>`));
  } else {
    wrap.appendChild(h(`<div class="summary">
      <div class="s"><div class="n tnum">${crPassed}<span class="of">/${crEnrolled}</span></div><div class="l">${esc(t('subj.creditsEarned'))}</div></div>
      <div class="s"><div class="n tnum">${gpa}</div><div class="l">${esc(t('subj.gpa'))}</div></div>
      <div class="s"><div class="n tnum">${graded.length}/${subs.length}</div><div class="l">${esc(t('subj.graded'))}</div></div>
    </div>`));
  }

  // Exam terms only earn space once they exist.
  if (exams && exams.length) {
    wrap.appendChild(h(`<div class="section-h"><h2>${esc(t('subj.exams'))}</h2><span class="muted">${esc(t('subj.terms', { n: exams.length }))}</span></div>`));
    const ex = h('<div class="card" style="padding:2px 16px"></div>');
    exams.forEach((e) => {
      ex.appendChild(h(`<div class="row">
        <div class="grade ${e.registered ? 'g-A' : 'pending'}">${e.registered ? I.check : I.clock}</div>
        <div class="rbody"><div class="t">${esc(e.subject || e.code || t('subj.exam'))}</div>
          <div class="m"><span>${esc(e.date || '')}${e.time ? ' · ' + esc(e.time) : ''}</span>${e.room ? `<span>${esc(e.room)}</span>` : ''}</div></div>
        ${e.capacity ? `<div class="rmeta"><div class="cr tnum">${esc(e.taken ?? 0)}/${esc(e.capacity)}</div><div class="cl">${esc(t('subj.seats'))}</div></div>` : ''}
      </div>`));
    });
    wrap.appendChild(ex);
  }

  const seg = h(`<div class="seg">
    <button class="${state.subTab === 'plan' ? '' : 'active'}" data-t="sem">${esc(t('subj.semester'))}</button>
    <button class="${state.subTab === 'plan' ? 'active' : ''}" data-t="plan">${esc(t('subj.plan'))}</button>
  </div>`);
  seg.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    state.subTab = b.dataset.t === 'plan' ? 'plan' : 'sem';
    render();
  }));
  wrap.appendChild(seg);

  if (state.subTab === 'plan') { await renderPlan(wrap); return; }
  if (!subs.length) { wrap.appendChild(empty(I.subjects, t('subj.none'))); return; }
  const list = h('<div class="rowlist card" style="padding:2px 16px"></div>');
  subs.forEach((sx) => {
    const g = sx.grade ? String(sx.grade).toUpperCase() : null;
    const gradeEl = g
      ? `<div class="grade g-${g}">${esc(g)}</div>`
      : `<div class="grade pending" title="${esc(t('subj.pending'))}">${I.clock}</div>`;
    const sem = sx.semester ? (String(sx.semester).toUpperCase() === 'Z' ? 'ZS' : 'LS') : '';
    list.appendChild(h(`<div class="row">
      ${gradeEl}
      <div class="rbody"><div class="t">${esc(sx.name || sx.code || t('common.subject'))}</div>
        <div class="m"><span>${esc(sx.code || '')}</span>${sx.completed ? `<span>${esc(aisTerm(sx.completed))}</span>` : ''}${sem ? `<span>${esc(sem)}</span>` : ''}</div></div>
      <div class="rmeta"><div class="cr tnum">${esc(sx.credits ?? '–')}</div><div class="cl">${esc(t('subj.cr'))}</div></div>
    </div>`));
  });
  wrap.appendChild(list);
}

async function renderPlan(wrap) {
  const plan = await load('plan', 'plan');
  const subs = (plan && plan.subjects) || [];
  if (!subs.length) { wrap.appendChild(empty(I.subjects, t('subj.planUnavailable'))); return; }
  // Group by year, then winter/summer semester — the shape students think in.
  const byYear = new Map();
  subs.forEach((p) => {
    const y = p.year || '?';
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(p);
  });
  [...byYear.keys()].sort().forEach((y) => {
    const items = byYear.get(y);
    const cr = items.reduce((a, p) => a + (Number(p.credits) || 0), 0);
    wrap.appendChild(h(`<div class="section-h"><h2>${esc(t('subj.year', { n: y }))}</h2><span class="muted">${esc(t('subj.subjects', { n: items.length }))} · ${cr} ${esc(t('subj.cr'))}</span></div>`));
    const list = h('<div class="rowlist card" style="padding:2px 16px"></div>');
    items.sort((a, b) => String(a.semester).localeCompare(String(b.semester)));
    items.forEach((p) => {
      const sem = String(p.semester).toUpperCase() === 'Z' ? 'ZS' : 'LS';
      list.appendChild(h(`<div class="row">
        <div class="grade ${p.done ? 'g-A' : 'pending'}">${p.done ? I.check : I.dot}</div>
        <div class="rbody"><div class="t">${esc(p.name || p.code)}</div>
          <div class="m"><span>${esc(sem)}</span>${p.kind ? `<span>${esc(aisTerm(p.kind))}</span>` : ''}</div></div>
        <div class="rmeta"><div class="cr tnum">${esc(p.credits ?? '–')}</div><div class="cl">${esc(t('subj.cr'))}</div></div>
      </div>`));
    });
    wrap.appendChild(list);
  });
}

function weightedGpa(graded) {
  const gp = { A: 1, B: 1.5, C: 2, D: 2.5, E: 3, FX: 4 };
  const num = graded.reduce((a, sx) => a + (gp[String(sx.grade).toUpperCase()] ?? 0) * (Number(sx.credits) || 1), 0);
  const den = graded.reduce((a, sx) => a + (Number(sx.credits) || 1), 0);
  return den ? (num / den).toFixed(2) : '—';
}

// --- Payments
async function viewPayments(root) {
  const wrap = h('<div class="view"></div>'); root.appendChild(wrap);
  wrap.appendChild(h('<div class="owe skel" style="height:90px"></div>'));
  const pays = await load('payments', 'payments');
  wrap.innerHTML = '';

  const due = pays.filter((p) => !p.paid);
  const owe = due.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  if (!pays.length) {
    // No fee records at all: one clear statement beats a zero card plus an empty state
    // saying the same thing twice.
    wrap.appendChild(h(`<div class="statecard ok">
      <div class="t">${esc(t('pay.none'))}</div>
      <div class="s">${esc(t('pay.noneSub'))}</div>
    </div>`));
    return;
  }

  wrap.appendChild(h(`<div class="owe"><div class="l">${esc(t('pay.due'))}</div>
    <div class="n tnum ${owe ? '' : 'clear'}">${owe ? owe.toFixed(2) + ' €' : esc(t('pay.allPaid'))}</div>
    ${owe ? `<div class="m">${esc(t('today.unpaid', { n: due.length }))}</div>`
      : `<div class="m">${esc(t('pay.historySettled', { items: t('pay.items', { n: pays.length }) }))}</div>`}</div>`));
  const list = h('<div class="card" style="padding:2px 16px"></div>');
  pays.forEach((p) => {
    const paid = !!p.paid;
    list.appendChild(h(`<div class="pay ${paid ? 'paid' : 'due'}">
      <div class="pmark">${paid ? I.check : I.alert}</div>
      <div class="pbody"><div class="t">${esc(p.title || t('pay.item'))}</div>
        <div class="m">${esc(paid ? t('pay.paid') : t('pay.dueDate', { d: p.dueDate || '—' }))}${p.variableSymbol ? ` · VS ${esc(p.variableSymbol)}` : ''}</div></div>
      <div class="amt tnum">${Number(p.amount || 0).toFixed(2)} ${esc(p.currency || 'EUR')}</div>
    </div>`));
  });
  wrap.appendChild(list);
}

// --- Messages
async function viewMessages(root) {
  const wrap = h('<div class="view"></div>'); root.appendChild(wrap);
  wrap.appendChild(skeletonList(4));
  const msgs = await load('messages', 'messages');
  wrap.innerHTML = '';
  wrap.appendChild(h(`<div class="section-h"><h2>${esc(t('msg.title'))}</h2><span class="muted">${esc(msgs.length ? t('msg.count', { n: msgs.length }) : t('msg.none'))}</span></div>`));
  if (!msgs.length) {
    wrap.appendChild(h(`<div class="statecard">
      <div class="t">${esc(t('msg.emptyTitle'))}</div>
      <div class="s">${esc(t('msg.emptySub'))}</div>
    </div>`));
    return;
  }
  const list = h('<div class="card" style="padding:2px 16px"></div>');
  msgs.forEach((m) => {
    const d = m.date ? new Date(m.date) : null;
    const when = d && !isNaN(d) ? fmtDate(d) : '';
    const cat = m.category || t('msg.notice');
    const href = m.url ? `https://ais2.euba.sk${m.url}` : null;
    const el = h(`<${href ? 'a' : 'div'} class="msg"${href ? ` href="${esc(href)}" target="_blank" rel="noopener noreferrer"` : ''}>
      <div class="av ${msgTone(cat)}">${msgIcon(cat)}</div>
      <div class="mbody"><div class="t">${esc(msgTitle(m.body))}</div>
        <div class="f"><span class="badge">${esc(aisTerm(cat))}</span>${when ? `<span class="when">${esc(when)}</span>` : ''}</div></div>
      ${href ? `<span class="go">${I.ext}</span>` : ''}
    </${href ? 'a' : 'div'}>`);
    list.appendChild(el);
  });
  wrap.appendChild(list);
  wrap.appendChild(h(`<p class="footnote">${esc(t('msg.footnote'))}</p>`));
}

/** AIS repeats the subject inside the body: "Mailová správa - Mailová správa". */
function msgTitle(body) {
  const body2 = String(body || '').trim();
  if (!body2) return t('msg.noText');
  const m = body2.match(/^(.+?)\s+-\s+(.+)$/);
  if (m && m[1].trim() === m[2].trim()) return m[1].trim();
  return body2;
}

function msgTone(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('platb') || c.includes('predpis')) return 'money';
  if (c.includes('dokument')) return 'doc';
  return '';
}

function msgIcon(cat = '') {
  const tone = msgTone(cat);
  if (tone === 'money') return I.euro;
  if (tone === 'doc') return I.doc;
  return I.bell;
}


// --- University handbook
// The things AIS never tells you: which bus leaves from which dorm, where the canteen
// and the library are, what ISIC prolongation costs. A curated snapshot of the student
// union's pages, so it opens instantly and works offline; see scripts/handbook.
const UNI_ICON = {
  campus: I.campus, bus: I.bus, food: I.food, book: I.book, card: I.card,
  mail: I.messages, bed: I.bed, globe: I.ext, doc: I.doc,
  schedule: I.schedule, user: I.user,
};

function pick(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[getLang()] || value.sk || '';
}

/** One fact: a label, its value, optionally a link or a value worth copying. */
function uniFact(item) {
  const label = esc(pick(item.label));
  const value = pick(item.value);
  const row = h(`<div class="unifact"><dt>${label}</dt><dd></dd></div>`);
  const dd = row.querySelector('dd');
  if (item.copy) {
    const btn = h(`<button class="copyval" title="${esc(t('uni.copy'))}"><span class="tnum">${esc(value)}</span>${I.copy}</button>`);
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(value);
        toast(t('uni.copied'));
      } catch { toast(t('uni.copyFailed')); }
    });
    dd.appendChild(btn);
  } else if (item.url) {
    dd.appendChild(h(`<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(value || item.url)}${I.ext}</a>`));
  } else {
    dd.textContent = value;
  }
  return row;
}

function uniCard(card, open) {
  const el = h(`<section class="unicard"></section>`);
  const head = h(`<button class="unicard__head" aria-expanded="${open ? 'true' : 'false'}">
    ${card.photo
      ? `<img class="ic ph" src="${esc(card.photo)}" alt="" loading="lazy" decoding="async" width="44" height="44" />`
      : `<span class="ic">${UNI_ICON[card.icon] || I.doc}</span>`}
    <span class="tx"><span class="t">${esc(pick(card.title))}</span><span class="s">${esc(pick(card.summary))}</span></span>
    <span class="chev">${I.chev}</span></button>`);
  const body = h(`<div class="unicard__body"${open ? '' : ' hidden'}><div class="unicard__inner"></div></div>`);
  const inner = body.querySelector('.unicard__inner');
  const facts = h('<dl class="unifacts"></dl>');
  (card.items || []).forEach((item) => facts.appendChild(uniFact(item)));
  inner.appendChild(facts);
  if (card.source) {
    inner.appendChild(h(`<a class="unisrc" href="${esc(card.source)}" target="_blank" rel="noopener noreferrer">${esc(t('uni.source'))}${I.ext}</a>`));
  }
  head.addEventListener('click', () => {
    const isOpen = head.getAttribute('aria-expanded') === 'true';
    head.setAttribute('aria-expanded', String(!isOpen));
    body.hidden = isOpen;
  });
  el.appendChild(head); el.appendChild(body);
  return el;
}

async function viewUniversity(root) {
  const wrap = h('<div class="view"></div>'); root.appendChild(wrap);
  wrap.appendChild(h(`<p class="uni-intro">${esc(t('uni.intro'))}</p>`));
  const list = h('<div class="unilist"></div>');
  HANDBOOK.forEach((card, i) => list.appendChild(uniCard(card, i === 0)));
  wrap.appendChild(list);
  wrap.appendChild(h(`<p class="footnote">${esc(t('uni.footnote', { date: fmtDate(new Date(`${HANDBOOK_CHECKED}T00:00:00`)) }))}</p>`));
}

// ---- shell + router --------------------------------------------------------
const VIEWS = { dnes: viewToday, rozvrh: viewSchedule, predmety: viewSubjects, financie: viewPayments, spravy: viewMessages, univerzita: viewUniversity };
const routeTitle = (route) => t(`nav.${route}`);

/** The title of the current screen, and the line under it. On Dnes it greets by name. */
function headings() {
  const name = firstName(state.user && state.user.fullName);
  const meniny = state.user && state.user.meniny;
  if (state.route === 'dnes') {
    return {
      title: name ? `${greeting()}, ${name}` : greeting(),
      // The name day is a nicety; the narrowest phones drop it rather than wrap twice.
      sub: `${esc(fmtDateLong())}${meniny ? `<span class="meniny"> · ${esc(t('app.nameday', { name: meniny }))}</span>` : ''}`,
    };
  }
  return { title: routeTitle(state.route), sub: esc(fmtDateLong()) };
}

/** "Aktualizované o 22:58" — how old the numbers on the screen are. */
function syncLabel() {
  // A screen that fetches nothing (the handbook) has no freshness to report, and
  // "loading…" that never resolves is worse than nothing.
  if (fetchedAt) return t('app.updatedAt', { t: hhmm(fetchedAt) });
  return state.route === 'univerzita' ? '' : t('app.loading');
}

function refreshButton(cls = 'iconbtn') {
  const b = h(`<button class="${cls} refreshbtn" title="${esc(t('app.refresh'))}" aria-label="${esc(t('app.refresh'))}">${I.refresh}</button>`);
  b.addEventListener('click', () => { refreshAll(); });
  return b;
}

/**
 * Everything that is not navigation, behind one button: language, theme, sign out.
 * A phone header has room for a title and two buttons, and language has to live
 * somewhere a phone can reach — there is no sidebar down there.
 */
function settingsMenu() {
  const wrap = h('<div class="menu"></div>');
  const btn = h(`<button class="iconbtn" aria-haspopup="true" aria-expanded="false"
    title="${esc(t('app.menu'))}" aria-label="${esc(t('app.menu'))}">${I.more}</button>`);
  const panel = h(`<div class="menu__panel" hidden>
    <div class="menu__label">${esc(t('app.language'))}</div>
  </div>`);
  panel.appendChild(langSwitch());
  panel.appendChild(h(`<p class="menu__note">${esc(t('app.langNote'))}</p>`));
  const uni = h(`<a class="menu__item" href="#univerzita">${I.campus}<span>${esc(t('nav.univerzita'))}</span></a>`);
  uni.addEventListener('click', () => close());
  panel.appendChild(uni);
  const theme = h(`<button class="menu__item">${I.theme}<span>${esc(t('app.theme'))}</span></button>`);
  const out = h(`<button class="menu__item">${I.logout}<span>${esc(t('app.logout'))}</span></button>`);
  panel.appendChild(theme);
  panel.appendChild(out);

  const close = () => {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDoc, true);
    document.removeEventListener('keydown', onKey);
  };
  function onDoc(e) { if (!wrap.contains(e.target)) close(); }
  function onKey(e) { if (e.key === 'Escape') { close(); btn.focus(); } }
  btn.addEventListener('click', () => {
    if (!panel.hidden) return close();
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onDoc, true);
    document.addEventListener('keydown', onKey);
  });
  theme.addEventListener('click', () => { toggleTheme(); close(); });
  out.addEventListener('click', () => { close(); doLogout(); });
  wrap.appendChild(btn);
  wrap.appendChild(panel);
  return wrap;
}

function shell() {
  const app = h('<div class="app"></div>');
  const head = headings();
  // sidebar (desktop)
  const side = h(`<aside class="sidebar">
    <div class="brand"><div class="mark">${I.mark}</div><div><b>Index</b><span>${esc(t('app.tagline'))}</span></div></div>
  </aside>`);
  tabs().forEach((tab) => {
    const a = h(`<a class="navitem ${state.route === tab.id ? 'active' : ''}" href="#${tab.id}">${tab.icon}<span>${esc(tab.label)}</span></a>`);
    side.appendChild(a);
  });
  const uniItem = h(`<a class="navitem ${state.route === 'univerzita' ? 'active' : ''}" href="#univerzita">${I.campus}<span>${esc(t('nav.univerzita'))}</span></a>`);
  side.appendChild(uniItem);
  side.appendChild(h('<div class="spacer"></div>'));
  // Who you are signed in as: an app that holds university credentials should never
  // leave that question open.
  if (state.user && state.user.fullName) {
    side.appendChild(h(`<div class="whoami"><span class="av">${esc(initials(state.user.fullName))}</span>
      <span class="wb"><span class="n">${esc(state.user.fullName)}</span>
      ${state.user.lastLoginTime ? `<span class="m">${esc(t('app.lastLogin', { t: state.user.lastLoginTime }))}</span>` : ''}</span></div>`));
  }
  const langRow = h(`<div class="navlang"><span class="l">${esc(t('app.language'))}</span></div>`);
  langRow.appendChild(langSwitch());
  side.appendChild(langRow);
  const themeBtn = h(`<a class="navitem" href="#" role="button">${I.theme}<span>${esc(t('app.theme'))}</span></a>`);
  themeBtn.addEventListener('click', (e) => { e.preventDefault(); toggleTheme(); });
  side.appendChild(themeBtn);
  const outBtn = h(`<a class="navitem" href="#" role="button">${I.logout}<span>${esc(t('app.logout'))}</span></a>`);
  outBtn.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });
  side.appendChild(outBtn);
  app.appendChild(side);

  // main column
  const col = h('<div style="flex:1;display:flex;flex-direction:column;min-width:0"></div>');
  const top = h(`<header class="topbar"><div class="tb-txt"><h1>${esc(head.title)}</h1><div class="sub">${head.sub}</div></div><div class="grow"></div></header>`);
  top.appendChild(refreshButton());
  top.appendChild(settingsMenu());
  col.appendChild(top);
  const main = h('<main class="main"></main>'); col.appendChild(main);
  // desktop keeps the title inside the column, where the sidebar cannot carry it
  const pagehead = h(`<header class="pagehead"><div><h1>${esc(head.title)}</h1><div class="sub">${head.sub}</div></div>
    <div class="grow"></div><span class="synced">${esc(syncLabel())}</span></header>`);
  pagehead.appendChild(refreshButton('iconbtn'));
  main.appendChild(pagehead);
  app.appendChild(col);

  // bottom tabs (mobile)
  const tab = h('<nav class="tabbar"></nav>');
  tabs().forEach((item) => {
    tab.appendChild(h(`<a class="${state.route === item.id ? 'active' : ''}" href="#${item.id}"><span class="ic">${item.icon}</span>${esc(item.label)}</a>`));
  });
  app.appendChild(tab);
  return { app, main };
}

async function doLogout() {
  try { await api.post('logout'); } catch {}
  state.authed = false; state.user = null;
  Object.keys(cache).forEach((k) => delete cache[k]);
  render();
}

let rendering = false;
async function render() {
  const app = $('#app');
  if (!state.authed) { app.innerHTML = ''; app.appendChild(viewLogin()); return; }
  const { app: shellEl, main } = shell();
  app.innerHTML = ''; app.appendChild(shellEl);
  const view = VIEWS[state.route] || viewToday;
  try {
    await view(main);
    const synced = main.querySelector('.pagehead .synced');
    if (synced) synced.textContent = syncLabel();
  } catch (e) {
    if (e.message !== 'unauth') {
      // Keep the page header; only the view failed.
      [...main.children].forEach((c) => { if (!c.classList.contains('pagehead')) c.remove(); });
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const emp = offline
        ? empty(I.alert, t('err.offline'), t('err.offlineSub'))
        : empty(I.alert, t('err.ais'), t('err.aisSub'));
      const btn = h(`<button class="btn" style="margin-top:14px">${I.refresh}<span>${esc(t('err.retry'))}</span></button>`);
      btn.addEventListener('click', () => { refreshAll(); });
      emp.appendChild(btn); main.appendChild(emp);
    }
  }
}

function onRoute() {
  const r = (location.hash.replace('#', '') || 'dnes');
  if (VIEWS[r]) { state.route = r; if (state.authed) render(); }
}
window.addEventListener('hashchange', onRoute);

// ---- boot ------------------------------------------------------------------
async function boot() {
  applyTheme();
  applyLangToDocument();
  onRoute();
  try {
    const me = await api.get('me');
    state.authed = !!me.authenticated; state.user = me.user || null;
  } catch { state.authed = false; }
  render();
}

// service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

boot();
