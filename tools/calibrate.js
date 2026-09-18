#!/usr/bin/env node
// Calibration helper: dump the real JSON shapes of every AIS endpoint we use,
// so the normalize* adapters can be corrected against reality.
//
//   AIS_JSESSIONID=<cookie from a signed-in browser> node tools/calibrate.js
//
// Takes a session cookie rather than a password on purpose: it is far less
// sensitive and expires on its own. Nothing is written outside ./calibration/.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.AIS_BASE || 'https://ais2.euba.sk';
const JSESSIONID = process.env.AIS_JSESSIONID;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'calibration');

const TOKEN_HEADER_NAME = '1lWgbIBjRKNgrgH';
const TOKEN_HEADER_VALUE = '2llVM1Fl3M';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

const ENDPOINTS = [
  'apps/rozvrh/data',
  'apps/rozvrh/studijneSkupinyStudenta',
  'apps/rozvrh/akademickeRoky',
  'apps/rozvrh/aktualnyAkRok',
  'portal/studium/list',
  'portal/portal/osoba/poplatky',
  'portal/messages/list2',
  'portal/users/info',
  'portal/portal/menu/student',
];

if (!JSESSIONID) {
  console.error('Set AIS_JSESSIONID to the JSESSIONID cookie of a signed-in AIS browser session.');
  process.exit(2);
}

const cookie = `JSESSIONID=${JSESSIONID}`;

async function mintToken() {
  const res = await fetch(`${BASE}/ais/rest/apps/get-access-token`, {
    method: 'POST',
    headers: { [TOKEN_HEADER_NAME]: TOKEN_HEADER_VALUE, Cookie: cookie, 'User-Agent': UA },
  });
  const token = res.headers.get('AISAuth') || res.headers.get('aisAuth');
  if (!token) {
    console.error(`No AISAuth token (HTTP ${res.status}). The session cookie is probably expired.`);
    process.exit(1);
  }
  return token;
}

// Describe a payload's structure without dumping personal data into the summary.
function shape(v, depth = 0) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return v.length ? [shape(v[0], depth + 1)] : [];
  if (typeof v === 'object') {
    if (depth > 3) return '{…}';
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x, depth + 1)]));
  }
  return typeof v;
}

const token = await mintToken();
console.log('token acquired\n');
await fs.mkdir(OUT, { recursive: true });

const shapes = {};
for (const ep of ENDPOINTS) {
  const url = `${BASE}/ais/rest/${ep}?lng=SK`;
  try {
    const res = await fetch(url, {
      headers: { AISAuth: token, Cookie: cookie, Accept: 'application/json', 'User-Agent': UA },
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    const file = ep.replace(/\//g, '_') + '.json';
    await fs.writeFile(path.join(OUT, file), json ? JSON.stringify(json, null, 2) : text);
    shapes[ep] = json ? shape(json) : `<non-json ${res.status}>`;
    const n = Array.isArray(json) ? `${json.length} items` : typeof json;
    console.log(`${String(res.status).padEnd(4)} ${ep.padEnd(38)} ${n}  -> calibration/${file}`);
  } catch (e) {
    console.log(`ERR  ${ep.padEnd(38)} ${e.message}`);
  }
}

await fs.writeFile(path.join(OUT, '_shapes.json'), JSON.stringify(shapes, null, 2));
console.log('\nField-name summary: calibration/_shapes.json');
