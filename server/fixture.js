// QA fixture: replay the captured real AIS payloads through the normalizers, so the
// UI can be checked against real content without a live session.
// Enabled with AIS_MOCK=1 AIS_FIXTURE=1 (reads ./calibration, which is gitignored).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeSchedule, normalizeSubjects, normalizeAverages,
  normalizePayments, normalizeMessages,
  normalizeCalendar, calendarStatus, normalizeExams, normalizeProgress, normalizePlan,
} from './aisClient.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'calibration');
const read = (f) => {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch { return null; }
};

export const available = fs.existsSync(DIR);
export const schedule = normalizeSchedule(read('apps_rozvrh_data.json') || {});
export const subjects = normalizeSubjects(read('sp_znamky.json') || {});
export const averages = normalizeAverages(read('sp_studium-priemery.json') || {});
export const payments = normalizePayments(read('portal_portal_osoba_poplatky.json') || []);
export const messages = normalizeMessages(read('portal_messages_list2.json') || []);
export const user = read('portal_users_info.json') || null;
export const calendarEntries = normalizeCalendar(read('probe_upozornenia.json') || []);
export const calendar = { entries: calendarEntries, status: calendarStatus(calendarEntries) };
export const exams = normalizeExams(read('probe_skusky.json') || []);
export const progress = normalizeProgress(read('probe_studium-prehlad.json') || []);
export const plan = normalizePlan(read('probe_studijny-plan.json') || {});
