// University news (public RSS on www.euba.sk).
//
// Deliberately kept apart from the AIS client: different host, no session, no AISAuth,
// and *not* routed through the AIS pacer — a slow euba.sk must never spend one of the
// per-minute slots that keep our AIS traffic looking like a normal browser.
//
// Contract of getNews(): it never rejects and never returns anything but an array.
// A dead feed makes the news strip empty, it does not break the screen.
//
//   * cached 45 min   — the feed changes a few times a week; a page view never refetches
//   * single flight   — concurrent callers share one upstream request
//   * 5 s timeout     — the request is abandoned long before a user notices
//   * stale-if-error  — a failed refresh serves the last good copy, if we have one

import { SingleFlight, TtlCache } from './guard.js';

const FEED_URL =
  process.env.EUBA_NEWS_FEED ||
  'https://www.euba.sk/aktivity-a-media/aktuality?format=feed&type=rss';

// The site sits behind a WAF that answers "403: Malware detected" to unknown clients
// (a default curl or undici User-Agent is enough to trip it), so we introduce
// ourselves as a browser. Nothing else about the request is special.
const UA =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36';

const TTL_MS = 45 * 60_000;
// After a failure we still hold off for a while: a broken feed must not turn into a
// request per page view either.
const FAIL_TTL_MS = 60_000;
const TIMEOUT_MS = 5_000;
const MAX_ITEMS = 12;
const SUMMARY_CHARS = 180;

const KEY = 'euba-news';
const cache = new TtlCache();
const flight = new SingleFlight();
let lastGood = null; // stale-if-error copy, in memory only

// --- tiny XML/HTML helpers -------------------------------------------------
// A full XML parser would be a dependency; this project has exactly one (express).
// An RSS 2.0 channel is flat enough to read with string scanning.

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', hellip: '…', bull: '•',
  middot: '·', laquo: '«', raquo: '»', bdquo: '„',
  ldquo: '“', rdquo: '”', sbquo: '‚', lsquo: '‘',
  rsquo: '’', deg: '°', euro: '€', shy: '',
};

// Accented letters. The CMS normally emits them as UTF-8, but one editor pasting from
// Word is enough to put a literal "&aacute;" in a Slovak headline, and half a word is
// worse than none. Both cases: &scaron; -> š, &Scaron; -> Š.
for (const [name, ch] of Object.entries({
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã',
  auml: 'ä', aring: 'å', ccedil: 'ç', ccaron: 'č',
  dcaron: 'ď', egrave: 'è', eacute: 'é', ecirc: 'ê',
  euml: 'ë', ecaron: 'ě', igrave: 'ì', iacute: 'í',
  icirc: 'î', iuml: 'ï', lacute: 'ĺ', lcaron: 'ľ',
  nacute: 'ń', ncaron: 'ň', ntilde: 'ñ', ograve: 'ò',
  oacute: 'ó', ocirc: 'ô', otilde: 'õ', ouml: 'ö',
  racute: 'ŕ', rcaron: 'ř', sacute: 'ś', scaron: 'š',
  tcaron: 'ť', ugrave: 'ù', uacute: 'ú', ucirc: 'û',
  uring: 'ů', uuml: 'ü', yacute: 'ý', yuml: 'ÿ',
  zacute: 'ź', zcaron: 'ž', zdot: 'ż', szlig: 'ß',
})) {
  NAMED_ENTITIES[name] = ch;
  NAMED_ENTITIES[name[0].toUpperCase() + name.slice(1)] = ch.toUpperCase();
}

function decodeEntities(s) {
  return String(s).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,9});/g, (whole, body) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return whole;
      try { return String.fromCodePoint(code); } catch { return whole; }
    }
    // Case matters for letters (&Scaron; is not &scaron;), so try the exact name
    // first and only then fall back for the case-insensitive classics (&AMP;).
    const hit = NAMED_ENTITIES[body] ?? NAMED_ENTITIES[body.toLowerCase()];
    return hit === undefined ? whole : hit;
  });
}

// Collapses every run of whitespace — including the NBSP the CMS sprinkles into
// sentences — into one plain space.
const collapse = (s) => String(s).replace(/[\s ​]+/g, ' ').trim();

const stripTags = (html) =>
  String(html)
    // Block-level ends are sentence boundaries; without this "…hod.</p><p>Tešíme…"
    // would glue two sentences together.
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)\s*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '');

// Text of the first <tag>…</tag> inside a block, CDATA unwrapped. Attributes on the
// opening tag are tolerated (<guid isPermaLink="true">).
function tagText(block, tag) {
  const open = new RegExp(`<${tag}(\\s[^>]*)?>`, 'i').exec(block);
  if (!open) return '';
  const start = open.index + open[0].length;
  // Lowercase both sides: the feed writes <pubDate>, XML tags are case-sensitive.
  const end = block.toLowerCase().indexOf(`</${tag.toLowerCase()}`, start);
  if (end < 0) return '';
  const raw = block.slice(start, end);
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(raw);
  return cdata ? cdata[1] : raw;
}

function itemBlocks(xml) {
  const out = [];
  const re = /<item(\s[^>]*)?>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const start = m.index + m[0].length;
    const end = xml.toLowerCase().indexOf('</item', start);
    if (end < 0) break;
    out.push(xml.slice(start, end));
    re.lastIndex = end;
  }
  return out;
}

function absolute(url, base) {
  try {
    const u = new URL(String(url).trim(), base);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

// First <img> of the description. src may be quoted either way, or bare.
function firstImage(html, base) {
  const m = /<img\b[^>]*?\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(html);
  if (!m) return null;
  const src = m[2] ?? m[3] ?? m[4] ?? '';
  return src ? absolute(decodeEntities(src), base) : null;
}

// Cut on a word boundary, then shave the punctuation the cut left dangling, so the
// result never reads "… ,…" or "slovo -…".
function clip(text, max = SUMMARY_CHARS) {
  if (text.length <= max) return text;
  const head = text.slice(0, max + 1);
  const space = head.lastIndexOf(' ');
  const cut = space > max * 0.6 ? head.slice(0, space) : head.slice(0, max);
  return cut.replace(/[\s.,;:!?)(–—-]+$/u, '') + '…';
}

function toIso(pubDate) {
  const t = Date.parse(String(pubDate).trim());
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

// --- parsing ---------------------------------------------------------------
export function parseFeed(xml, base = FEED_URL) {
  const blocks = itemBlocks(xml);
  const items = [];
  for (const block of blocks) {
    const title = collapse(decodeEntities(stripTags(tagText(block, 'title'))));
    const rawLink = tagText(block, 'link') || tagText(block, 'guid');
    const link = absolute(decodeEntities(rawLink), base);
    if (!title && !link) continue;
    const description = tagText(block, 'description');
    items.push({
      title,
      link,
      date: toIso(tagText(block, 'pubDate')),
      summary: clip(collapse(decodeEntities(stripTags(description)))),
      image: firstImage(description, base),
    });
  }
  // Newest first. The feed already arrives in that order, but nothing promises it;
  // undated items keep their original order and sink to the bottom.
  return items
    .map((item, i) => ({ item, i, ts: item.date ? Date.parse(item.date) : 0 }))
    .sort((a, b) => b.ts - a.ts || a.i - b.i)
    .slice(0, MAX_ITEMS)
    .map((x) => x.item);
}

// --- fetching --------------------------------------------------------------
async function fetchFeed() {
  const res = await fetch(FEED_URL, {
    headers: {
      Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.1',
      'User-Agent': UA,
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function getNews() {
  const fresh = cache.get(KEY);
  if (fresh !== undefined) return fresh;
  return flight.run(KEY, async () => {
    // A caller that queued behind the in-flight refresh must not start another one.
    const again = cache.get(KEY);
    if (again !== undefined) return again;
    try {
      const items = parseFeed(await fetchFeed());
      if (!items.length) throw new Error('no items in feed');
      cache.set(KEY, items, TTL_MS);
      lastGood = items;
      console.log(`[news] refreshed: ${items.length} items`);
      return items;
    } catch (e) {
      const fallback = lastGood || [];
      console.warn(
        `[news] refresh failed (${e.message || e}); serving ${
          fallback.length ? `last good copy of ${fallback.length} items` : 'an empty list'
        }`
      );
      cache.set(KEY, fallback, FAIL_TTL_MS);
      return fallback;
    }
  });
}
