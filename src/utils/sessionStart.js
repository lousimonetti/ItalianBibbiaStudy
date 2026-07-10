import { config } from '../../course/config';
import { storageKey } from './storageKey';

// New Session / calendar reset (plan-new-session.md). The program start is the
// course's authored `schedule.startDate` unless the user has stamped a
// 'session-start' override — a plain 'YYYY-MM-DD' string under the same
// per-course key the iOS app writes (AppModel.startNewSession), so sync
// backups carry the override in both directions.

const KEY = storageKey('session-start');
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function getSessionStartOverride() {
  try {
    const v = localStorage.getItem(KEY);
    return v && ISO_DATE.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function getSessionStart() {
  return getSessionStartOverride() || config.schedule.startDate;
}

export function setSessionStart(isoDate) {
  if (!ISO_DATE.test(isoDate || '')) throw new Error(`setSessionStart: expected YYYY-MM-DD, got "${isoDate}"`);
  try {
    localStorage.setItem(KEY, isoDate);
  } catch {
    // storage unavailable — the config default stays in effect
  }
}

export function clearSessionStart() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}

// 'YYYY-MM-DD' → local-midnight Date (avoids the UTC shift of new Date(iso)).
export function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Last day of the final week (start + weeks*7 − 1 days) — matches
// BibbiaCore's ScheduleLogic.endDate.
export function getEndDate() {
  const start = parseLocalDate(getSessionStart());
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + config.schedule.weeks * 7 - 1);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Apr 13, 2026" — fixed English abbreviations so output doesn't vary with the
// device locale (mirrors ScheduleLogic.monthAbbrev on iOS).
export function formatDateLabel(date) {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function getSessionStartLabel() {
  return formatDateLabel(parseLocalDate(getSessionStart()));
}

export function getEndDateLabel() {
  return formatDateLabel(getEndDate());
}
