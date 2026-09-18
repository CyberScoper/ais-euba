// Persistent PWA sessions.
//
// The PWA session id (httpOnly cookie `sid`) used to live in a Map, so every deploy or
// systemd restart signed the owner out. This store keeps the same Map, but writes the
// sessions the user explicitly asked to remember to a file outside the repo
// (/var/lib/ais-pwa/sessions.json, 0600 in a 0700 directory) and loads them at boot.
//
// Two rules shape everything here:
//
//   * opt-in only — a session created without `remember` is never written to disk, and
//     its AIS password stays where it always was: in the process, and nowhere else;
//   * honest crypto — a remembered password is sealed with AES-256-GCM, but the key
//     sits on the same machine (env AIS_SECRET or /var/lib/ais-pwa/key). That defends
//     a stolen backup or a careless `cat`, not anyone who already has root here.
//
// Writes are debounced and atomic (tmp file + rename); nothing fsyncs per request.

import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const FILE_VERSION = 1;
const SAVE_DEBOUNCE_MS = 500;
// A sliding expiry moves on every request; only write it out when it has drifted an
// hour, otherwise a busy morning would rewrite the file hundreds of times.
const TOUCH_WRITE_MS = 60 * 60 * 1000;
const PRUNE_EVERY_MS = 60 * 60 * 1000;

export const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// systemd's StateDirectory=ais-pwa hands us $STATE_DIRECTORY (possibly a list).
export function defaultStateDir() {
  const fromUnit = String(process.env.STATE_DIRECTORY || '').split(':')[0];
  return process.env.AIS_STATE_DIR || fromUnit || '/var/lib/ais-pwa';
}

function deriveKey(secret) {
  if (/^[0-9a-f]{64}$/i.test(secret)) return Buffer.from(secret, 'hex');
  // A passphrase rather than a raw key: stretch it so a short one is still expensive.
  return crypto.scryptSync(secret, 'ais-pwa/session-key/v1', 32);
}

export class SessionStore {
  constructor({ dir = defaultStateDir(), ttlMs = DEFAULT_TTL_MS, log = console } = {}) {
    this.dir = dir;
    this.file = path.join(dir, 'sessions.json');
    this.keyFile = path.join(dir, 'key');
    this.ttlMs = ttlMs;
    this.log = log;
    this.map = new Map();
    this.key = null;
    this.persistent = false;
    this.reason = null; // why persistence is off, if it is
    this.dirty = false;
    this.saveTimer = null;
    this.saving = Promise.resolve();
  }

  // Never throws: if the state directory is unusable we degrade to memory-only
  // sessions (today's behaviour) and say so loudly, rather than refusing to boot.
  init() {
    try {
      fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
      fs.chmodSync(this.dir, 0o700);
      this.key = this.#loadKey();
      this.persistent = true;
      this.#load();
    } catch (e) {
      this.persistent = false;
      this.reason = e.message;
      this.log.warn(`[sessions] memory-only (${e.message}) — a restart will sign the user out`);
    }
    this.pruneTimer = setInterval(() => this.prune(), PRUNE_EVERY_MS);
    if (this.pruneTimer.unref) this.pruneTimer.unref();
    return this;
  }

  #loadKey() {
    const secret = String(process.env.AIS_SECRET || '').trim();
    if (secret) return deriveKey(secret);
    try {
      const hex = fs.readFileSync(this.keyFile, 'utf8').trim();
      if (!/^[0-9a-f]{64}$/i.test(hex)) {
        throw new Error(`${this.keyFile} is not 64 hex characters; refusing to replace it`);
      }
      fs.chmodSync(this.keyFile, 0o600);
      return Buffer.from(hex, 'hex');
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    const key = crypto.randomBytes(32);
    fs.writeFileSync(this.keyFile, `${key.toString('hex')}\n`, { mode: 0o600 });
    fs.chmodSync(this.keyFile, 0o600);
    this.log.log(`[sessions] generated ${this.keyFile}`);
    return key;
  }

  // The session id is the additional authenticated data, so a credential blob cannot
  // be lifted from one entry into another.
  #seal(sid, plaintext) {
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    c.setAAD(Buffer.from(sid, 'utf8'));
    const ct = Buffer.concat([c.update(plaintext, 'utf8'), c.final()]);
    return {
      v: 1,
      iv: iv.toString('base64'),
      ct: ct.toString('base64'),
      tag: c.getAuthTag().toString('base64'),
    };
  }

  #open(sid, blob) {
    const d = crypto.createDecipheriv('aes-256-gcm', this.key, Buffer.from(blob.iv, 'base64'));
    d.setAAD(Buffer.from(sid, 'utf8'));
    d.setAuthTag(Buffer.from(blob.tag, 'base64'));
    return Buffer.concat([d.update(Buffer.from(blob.ct, 'base64')), d.final()]).toString('utf8');
  }

  #load() {
    let raw;
    try {
      raw = fs.readFileSync(this.file, 'utf8');
    } catch (e) {
      if (e.code === 'ENOENT') return;
      throw e;
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      this.log.warn(`[sessions] ${this.file} is not readable JSON; starting empty`);
      return;
    }
    const stored = data && typeof data.sessions === 'object' ? data.sessions : null;
    if (!stored) return;
    const now = Date.now();
    let kept = 0;
    let dropped = 0;
    for (const [sid, rec] of Object.entries(stored)) {
      if (!rec || typeof rec !== 'object' || !(Number(rec.expiresAt) > now)) {
        dropped += 1;
        continue;
      }
      this.map.set(sid, {
        login: rec.login ?? null,
        createdAt: Number(rec.createdAt) || now,
        expiresAt: Number(rec.expiresAt),
        savedExpiresAt: Number(rec.expiresAt),
        remembered: true,
        mock: !!rec.mock,
        restored: true,
        cred: rec.cred || null,
      });
      kept += 1;
    }
    this.log.log(`[sessions] restored ${kept} session(s) from ${this.file}${dropped ? `, dropped ${dropped} expired` : ''}`);
    if (dropped) this.#scheduleSave();
  }

  create({ login = null, password = null, remember = false, mock = false } = {}) {
    const sid = crypto.randomBytes(24).toString('hex');
    const now = Date.now();
    const rec = {
      login,
      createdAt: now,
      expiresAt: now + this.ttlMs,
      savedExpiresAt: 0,
      remembered: !!remember,
      mock: !!mock,
      restored: false,
      cred: null,
    };
    if (rec.remembered && this.persistent && password) {
      try {
        rec.cred = this.#seal(sid, JSON.stringify({ login, password }));
      } catch (e) {
        this.log.warn(`[sessions] could not seal the credential: ${e.message}`);
      }
    }
    this.map.set(sid, rec);
    if (rec.remembered) this.#scheduleSave();
    return sid;
  }

  // Expired entries are removed, never served.
  get(sid) {
    if (!sid) return null;
    const rec = this.map.get(sid);
    if (!rec) return null;
    if (Date.now() > rec.expiresAt) {
      this.map.delete(sid);
      if (rec.remembered) this.#scheduleSave();
      return null;
    }
    return rec;
  }

  // 30 days sliding: every use pushes the expiry out again.
  touch(sid) {
    const rec = this.map.get(sid);
    if (!rec) return;
    rec.expiresAt = Date.now() + this.ttlMs;
    if (rec.remembered && rec.expiresAt - rec.savedExpiresAt > TOUCH_WRITE_MS) this.#scheduleSave();
  }

  // { login, password } or null. A blob that will not open (rotated key, tampered
  // file) is treated exactly like no stored credential at all.
  credential(sid) {
    const rec = this.map.get(sid);
    if (!rec || !rec.cred || !this.key) return null;
    try {
      const parsed = JSON.parse(this.#open(sid, rec.cred));
      if (!parsed || !parsed.login || !parsed.password) return null;
      return { login: parsed.login, password: parsed.password };
    } catch (e) {
      this.log.warn(`[sessions] stored credential could not be opened: ${e.message}`);
      this.dropCredential(sid);
      return null;
    }
  }

  dropCredential(sid) {
    const rec = this.map.get(sid);
    if (!rec || !rec.cred) return;
    rec.cred = null;
    if (rec.remembered) this.#scheduleSave();
  }

  // Wipes the entry and whatever credential it carried.
  destroy(sid) {
    const rec = this.map.get(sid);
    if (!rec) return false;
    rec.cred = null;
    this.map.delete(sid);
    if (rec.remembered) this.#scheduleSave();
    return true;
  }

  prune() {
    const now = Date.now();
    let gone = 0;
    for (const [sid, rec] of this.map) {
      if (now > rec.expiresAt) {
        this.map.delete(sid);
        gone += 1;
      }
    }
    if (gone) this.#scheduleSave();
    return gone;
  }

  #serialize() {
    const sessions = {};
    for (const [sid, rec] of this.map) {
      if (!rec.remembered) continue; // opt-in only: nothing else ever reaches the disk
      rec.savedExpiresAt = rec.expiresAt;
      sessions[sid] = {
        login: rec.login,
        createdAt: rec.createdAt,
        expiresAt: rec.expiresAt,
        mock: rec.mock || undefined,
        cred: rec.cred || undefined,
      };
    }
    return { v: FILE_VERSION, savedAt: Date.now(), sessions };
  }

  #scheduleSave() {
    if (!this.persistent) return;
    this.dirty = true;
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.flush().catch(() => {});
    }, SAVE_DEBOUNCE_MS);
    if (this.saveTimer.unref) this.saveTimer.unref();
  }

  // Writes are serialised so two flushes cannot race over the same tmp file.
  flush() {
    if (!this.persistent) return Promise.resolve();
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.saving = this.saving.then(() => this.#write()).catch((e) => {
      this.log.warn(`[sessions] could not write ${this.file}: ${e.message}`);
    });
    return this.saving;
  }

  async #write() {
    if (!this.dirty) return;
    this.dirty = false;
    const tmp = `${this.file}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(this.#serialize()), { mode: 0o600 });
    await fsp.chmod(tmp, 0o600);
    await fsp.rename(tmp, this.file);
  }

  // For shutdown, where the event loop will not run another tick.
  flushSync() {
    if (!this.persistent || !this.dirty) return;
    this.dirty = false;
    try {
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.#serialize()), { mode: 0o600 });
      fs.chmodSync(tmp, 0o600);
      fs.renameSync(tmp, this.file);
    } catch (e) {
      this.log.warn(`[sessions] could not write ${this.file}: ${e.message}`);
    }
  }
}
