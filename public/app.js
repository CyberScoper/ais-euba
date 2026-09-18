// AIS-PWA front-end — vanilla ES modules, no build step.

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
};

const DAYS = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];
const DAYS_SHORT = ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'];
const MONTHS = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'];

const TABS = [
  { id: 'dnes', label: 'Dnes', icon: I.today },
  { id: 'rozvrh', label: 'Rozvrh', icon: I.schedule },
  { id: 'predmety', label: 'Predmety', icon: I.subjects },
  { id: 'financie', label: 'Financie', icon: I.finance },
  { id: 'spravy', label: 'Správy', icon: I.messages },
];

// type -> color mapping for lessons
function lessonColors(type = '') {
  const t = type.toLowerCase();
  if (t.includes('cvič') || t.includes('sem')) return { color: 'var(--now)', soft: 'var(--now-soft)' };
  return { color: 'var(--accent)', soft: 'var(--accent-soft)' };
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
    if (r.status === 401) { state.authed = false; render(); throw new Error('unauth'); }
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(`/api/${path}`, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  },
};

// cache so tab switches are instant; refresh in background
const cache = {};
async function load(key, path) {
  if (cache[key]) return cache[key];
  const data = await api.get(path);
  cache[key] = data;
  return data;
}

// ---- state / theme ---------------------------------------------------------
const state = { authed: false, user: null, route: 'dnes', day: (new Date().getDay() || 1) };

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
function fmtDateLong(d = new Date()) {
  return `${DAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

function viewLogin() {
  const box = h(`
    <div class="login">
      <div class="box view">
        <div class="mark">AIS</div>
        <h1>Prihláste sa</h1>
        <p class="sub">Vaše prihlasovacie údaje do AIS EU v Bratislave. Ostávajú len na vašom serveri.</p>
        <form id="lf">
          <div class="field">
            <label for="lg">Používateľ</label>
            <input id="lg" name="login" autocomplete="username" autocapitalize="none" spellcheck="false" required />
          </div>
          <div class="field">
            <label for="pw">Heslo</label>
            <input id="pw" name="password" type="password" autocomplete="current-password" required />
          </div>
          <div class="err" id="le"></div>
          <button class="btn primary full" type="submit" id="lb">Prihlásiť sa</button>
        </form>
        <p class="note">Neoficiálny pohodlný klient nad AIS.<br>Vaše heslo sa neukladá na disk.</p>
      </div>
    </div>`);
  box.querySelector('#lf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = box.querySelector('#lb'); const err = box.querySelector('#le');
    err.textContent = ''; btn.disabled = true; btn.textContent = 'Prihlasujem…';
    try {
      const fd = new FormData(e.target);
      const res = await api.post('login', { login: fd.get('login'), password: fd.get('password') });
      state.authed = true; state.user = res.user || null;
      Object.keys(cache).forEach((k) => delete cache[k]);
      render();
    } catch (ex) {
      err.textContent = ex.message === 'missing_credentials' ? 'Zadajte meno aj heslo.'
        : 'Prihlásenie zlyhalo. Skontrolujte meno a heslo.';
      btn.disabled = false; btn.textContent = 'Prihlásiť sa';
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
    <div class="lesson ${live ? 'now' : ''}" style="--type-color:${c.color}">
      <div class="time">
        <span class="from tnum">${esc(l.from || '')}</span>
        <span class="to tnum">${esc(l.to || '')}</span>
      </div>
      <div class="body">
        <div class="name">${esc(l.subject || 'Predmet')}</div>
        <div class="info">
          ${l.type ? `<span class="badge accent" style="background:${c.soft};color:${c.color}">${esc(l.type)}</span>` : ''}
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

  const [sch, pays, msgs] = await Promise.all([
    load('schedule', 'schedule'), load('payments', 'payments'), load('messages', 'messages'),
  ]);

  const today = new Date().getDay();
  const todays = sch.filter((l) => Number(l.day) === today).sort((a, b) => toMin(a.from) - toMin(b.from));
  const cur = nowMin();
  const nextL = todays.find((l) => toMin(l.from) > cur);
  const liveL = todays.find((l) => toMin(l.from) <= cur && toMin(l.to) > cur);
  const due = pays.filter((p) => !p.paid);
  const oweSum = due.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const unread = msgs.filter((m) => m.unread).length;

  let heroHtml;
  if (liveL) {
    heroHtml = `<div class="hero"><div class="eyebrow" style="color:var(--now);display:flex;align-items:center;gap:7px">
      <span class="livedot"><i></i></span>Práve prebieha</div>
      <div class="big">${esc(liveL.subject)}</div>
      <div class="meta"><span>${I.clock2()} <b class="tnum">${esc(liveL.from)}–${esc(liveL.to)}</b></span>
      ${liveL.room ? `<span>${esc(liveL.room)}</span>` : ''}${liveL.teacher ? `<span>${esc(liveL.teacher)}</span>` : ''}</div></div>`;
  } else if (nextL) {
    heroHtml = `<div class="hero"><div class="eyebrow">Ďalšia hodina</div>
      <div class="big">${esc(nextL.subject)}</div>
      <div class="meta"><span>o <b class="tnum">${esc(nextL.from)}</b></span>
      ${nextL.room ? `<span>${esc(nextL.room)}</span>` : ''}${nextL.type ? `<span>${esc(nextL.type)}</span>` : ''}</div></div>`;
  } else {
    heroHtml = `<div class="hero none"><div class="eyebrow">${esc(fmtDateLong())}</div>
      <div class="big">${todays.length ? 'Dnešné hodiny máte za sebou' : 'Dnes žiadne hodiny'}</div></div>`;
  }
  hero.replaceWith(h(heroHtml));

  const glance = h(`<div class="glance">
    <a class="g" href="#financie"><span class="n tnum">${oweSum ? oweSum.toFixed(0) + ' €' : '0 €'}</span><span class="l">${due.length ? `${due.length} nezaplatené` : 'Nič nedlhujete'}</span></a>
    <a class="g" href="#spravy"><span class="n tnum">${unread}</span><span class="l">${unread ? 'nové správy' : 'žiadne nové správy'}</span></a>
  </div>`);
  wrap.appendChild(glance);

  wrap.appendChild(h(`<div class="section-h"><h2>Dnes</h2><span class="muted">${esc(DAYS[today])}</span><span class="grow"></span></div>`));
  if (!todays.length) {
    wrap.appendChild(empty(I.schedule, 'Voľný deň', 'Na dnes nemáte žiadne hodiny.'));
  } else {
    const ag = h('<div class="agenda"></div>');
    let placedNow = false;
    todays.forEach((l) => {
      if (!placedNow && !liveL && toMin(l.from) > cur && cur > (todays[0] ? toMin(todays[0].from) - 1 : 0)) {
        ag.appendChild(h(`<div class="nowline"><span class="livedot"><i></i></span>teraz ${new Date().toLocaleTimeString('sk', { hour: '2-digit', minute: '2-digit' })}</div>`));
        placedNow = true;
      }
      ag.appendChild(lessonCard(l, liveL === l));
    });
    wrap.appendChild(ag);
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
  // mobile: day switcher + agenda
  const mob = h('<div class="agenda-wrap desktop-hide"></div>');
  const sw = h('<div class="dayswitch"></div>');
  for (let d = 1; d <= 5; d++) {
    const b = h(`<button class="${d === state.day ? 'active' : ''} ${d === today ? 'today' : ''}">${DAYS_SHORT[d]}</button>`);
    b.addEventListener('click', () => { state.day = d; render(); });
    sw.appendChild(b);
  }
  mob.appendChild(sw);
  const dayL = sch.filter((l) => Number(l.day) === state.day).sort((a, b) => toMin(a.from) - toMin(b.from));
  if (!dayL.length) mob.appendChild(empty(I.schedule, 'Voľný deň', `V ${DAYS[state.day].toLowerCase()} nemáte hodiny.`));
  else { const ag = h('<div class="agenda"></div>'); dayL.forEach((l) => ag.appendChild(lessonCard(l, false))); mob.appendChild(ag); }
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
  for (let d = 1; d <= 5; d++) grid.appendChild(h(`<div class="dh ${d === today ? 'today' : ''}">${DAYS_SHORT[d]}</div>`));
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
      const el = h(`<div class="wk-lesson" style="top:${top}px;height:${hgt}px;--type-color:${c.color};--type-soft:${c.soft}">
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
  const subs = await load('subjects', 'subjects');
  wrap.innerHTML = '';

  const graded = subs.filter((s) => s.grade);
  const gp = { A: 1, B: 1.5, C: 2, D: 2.5, E: 3, FX: 4 };
  const totalCr = subs.reduce((a, s) => a + (Number(s.credits) || 0), 0);
  const gpa = graded.length
    ? (graded.reduce((a, s) => a + (gp[String(s.grade).toUpperCase()] ?? 0) * (Number(s.credits) || 1), 0) /
       graded.reduce((a, s) => a + (Number(s.credits) || 1), 0)).toFixed(2)
    : '—';

  wrap.appendChild(h(`<div class="summary">
    <div class="s"><div class="n tnum">${totalCr}</div><div class="l">kreditov spolu</div></div>
    <div class="s"><div class="n tnum">${gpa}</div><div class="l">vážený priemer</div></div>
    <div class="s"><div class="n tnum">${graded.length}/${subs.length}</div><div class="l">ohodnotených</div></div>
  </div>`));

  wrap.appendChild(h('<div class="section-h"><h2>Predmety</h2><span class="muted">tento semester</span></div>'));
  if (!subs.length) { wrap.appendChild(empty(I.subjects, 'Žiadne predmety')); return; }
  const list = h('<div class="rowlist card" style="padding:2px 16px"></div>');
  subs.forEach((s) => {
    const g = s.grade ? String(s.grade).toUpperCase() : null;
    const gradeEl = g
      ? `<div class="grade g-${g}">${esc(g)}</div>`
      : `<div class="grade pending">${s.points != null ? esc(s.points) : '·'}</div>`;
    list.appendChild(h(`<div class="row">
      ${gradeEl}
      <div class="rbody"><div class="t">${esc(s.name || s.code || 'Predmet')}</div>
        <div class="m"><span>${esc(s.code || '')}</span>${s.completed ? `<span>${esc(s.completed)}</span>` : ''}${s.points != null && g ? `<span class="tnum">${esc(s.points)} b.</span>` : ''}</div></div>
      <div class="rmeta"><div class="cr tnum">${esc(s.credits ?? '–')}</div><div class="cl">kr.</div></div>
    </div>`));
  });
  wrap.appendChild(list);
}

// --- Payments
async function viewPayments(root) {
  const wrap = h('<div class="view"></div>'); root.appendChild(wrap);
  wrap.appendChild(h('<div class="owe skel" style="height:90px"></div>'));
  const pays = await load('payments', 'payments');
  wrap.innerHTML = '';

  const due = pays.filter((p) => !p.paid);
  const owe = due.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  wrap.appendChild(h(`<div class="owe"><div class="l">Na úhradu</div>
    <div class="n tnum ${owe ? '' : 'clear'}">${owe ? owe.toFixed(2) + ' €' : 'Všetko uhradené'}</div></div>`));

  if (!pays.length) { wrap.appendChild(empty(I.finance, 'Žiadne poplatky')); return; }
  const list = h('<div class="card" style="padding:2px 16px"></div>');
  pays.forEach((p) => {
    const paid = !!p.paid;
    list.appendChild(h(`<div class="pay ${paid ? 'paid' : 'due'}">
      <div class="pmark">${paid ? I.check : I.alert}</div>
      <div class="pbody"><div class="t">${esc(p.title || 'Poplatok')}</div>
        <div class="m">${paid ? 'Uhradené' : 'Splatnosť ' + esc(p.dueDate || '—')}${p.variableSymbol ? ` · VS ${esc(p.variableSymbol)}` : ''}</div></div>
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
  const unread = msgs.filter((m) => m.unread).length;
  wrap.appendChild(h(`<div class="section-h"><h2>Správy</h2>${unread ? `<span class="badge accent">${unread} nové</span>` : '<span class="muted">všetko prečítané</span>'}</div>`));
  if (!msgs.length) { wrap.appendChild(empty(I.inbox, 'Žiadne správy')); return; }
  const list = h('<div class="card" style="padding:2px 16px"></div>');
  msgs.forEach((m) => {
    const d = m.date ? new Date(m.date) : null;
    const when = d && !isNaN(d) ? `${d.getDate()}. ${MONTHS[d.getMonth()]}` : '';
    list.appendChild(h(`<div class="msg ${m.unread ? 'unread' : ''}">
      <div class="av">${esc(initials(m.from))}</div>
      <div class="mbody"><div class="t">${esc(m.subject || '(bez predmetu)')}</div>
        ${m.body ? `<div class="p">${esc(m.body)}</div>` : ''}
        <div class="f">${esc(m.from || '')}${when ? ' · ' + when : ''}</div></div>
    </div>`));
  });
  wrap.appendChild(list);
}

// ---- shell + router --------------------------------------------------------
const VIEWS = { dnes: viewToday, rozvrh: viewSchedule, predmety: viewSubjects, financie: viewPayments, spravy: viewMessages };
const TITLES = { dnes: 'Dnes', rozvrh: 'Rozvrh', predmety: 'Predmety', financie: 'Financie', spravy: 'Správy' };

function shell() {
  const app = h('<div class="app"></div>');
  // sidebar (desktop)
  const side = h(`<aside class="sidebar">
    <div class="brand"><div class="mark">A</div><div><b>AIS</b><span>pohodlne</span></div></div>
  </aside>`);
  TABS.forEach((t) => {
    const a = h(`<a class="navitem ${state.route === t.id ? 'active' : ''}" href="#${t.id}">${t.icon}<span>${t.label}</span></a>`);
    side.appendChild(a);
  });
  side.appendChild(h('<div class="spacer"></div>'));
  const themeBtn = h(`<a class="navitem" href="#" role="button">${I.theme}<span>Motív</span></a>`);
  themeBtn.addEventListener('click', (e) => { e.preventDefault(); toggleTheme(); });
  side.appendChild(themeBtn);
  const outBtn = h(`<a class="navitem" href="#" role="button">${I.logout}<span>Odhlásiť</span></a>`);
  outBtn.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });
  side.appendChild(outBtn);
  app.appendChild(side);

  // main column
  const col = h('<div style="flex:1;display:flex;flex-direction:column;min-width:0"></div>');
  const top = h(`<header class="topbar"><div><h1>${TITLES[state.route]}</h1><div class="sub">${esc(fmtDateLong())}</div></div><div class="grow"></div></header>`);
  const tb = h(`<button class="iconbtn" title="Motív">${I.theme}</button>`); tb.addEventListener('click', toggleTheme);
  const ob = h(`<button class="iconbtn" title="Odhlásiť">${I.logout}</button>`); ob.addEventListener('click', doLogout);
  top.appendChild(tb); top.appendChild(ob);
  col.appendChild(top);
  const main = h('<main class="main"></main>'); col.appendChild(main);
  app.appendChild(col);

  // bottom tabs (mobile)
  const tab = h('<nav class="tabbar"></nav>');
  TABS.forEach((t) => {
    tab.appendChild(h(`<a class="${state.route === t.id ? 'active' : ''}" href="#${t.id}"><span class="ic">${t.icon}</span>${t.label}</a>`));
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
  } catch (e) {
    if (e.message !== 'unauth') {
      main.innerHTML = '';
      const emp = empty(I.alert, 'Nepodarilo sa načítať', 'Skúste to znova.');
      const btn = h(`<button class="btn" style="margin-top:14px">${I.refresh}<span>Skúsiť znova</span></button>`);
      btn.addEventListener('click', () => { Object.keys(cache).forEach((k) => delete cache[k]); render(); });
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
