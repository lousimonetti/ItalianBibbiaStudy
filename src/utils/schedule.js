import { config } from '../../course/config';
import { getSessionStart, getSessionStartOverride } from './sessionStart';

// Program length comes from the course schedule; the program *start* comes
// from the session (the user's 'session-start' override when present, else
// the course's startDate) and is re-read on every call — not cached at module
// load — so a New Session takes effect without re-importing this module.

const PROGRAM_WEEKS = config.schedule.weeks;

function programStart() {
  const [sy, sm, sd] = getSessionStart().split('-').map(Number);
  return new Date(sy, sm - 1, sd);
}

const WEEK_MS = 604800000;
const DAY_MS = 86400000;

// Which program week `nowMs` falls in for a GIVEN start date, or null when it
// is before week 1 or past the final week. Taking the start as an argument is
// what lets the target-end-date planner preview a candidate start that has not
// been committed to storage yet (see targetDate.js) — the committed and the
// previewed answer must come from the same arithmetic, not two copies of it.
export function weekNumberFor(startISO, weeks = PROGRAM_WEEKS, nowMs = Date.now()) {
  const [sy, sm, sd] = String(startISO ?? '').split('-').map(Number);
  if (!sy || !sm || !sd) return null;
  const diff = nowMs - new Date(sy, sm - 1, sd).getTime();
  if (diff < 0) return null;
  const n = Math.floor(diff / WEEK_MS) + 1;
  return n <= weeks ? n : null;
}

export function getCurrentWeekN() {
  return weekNumberFor(getSessionStart(), PROGRAM_WEEKS);
}

// Which day of the program week we are on: 0 = the first day of the week,
// … 6 = the last. This indexes `config.schedule.daily`.
//
// This used to be the wall-clock weekday, `(new Date().getDay() + 6) % 7`,
// which silently assumed the session started on a Monday. It doesn't have to:
// the New Session picker accepts any date. On a Wednesday start the week runs
// Wed–Tue, so week 1's "Mon" and "Tue" rows could never fire. Counting the
// offset from the start instead makes the daily list work for any start day.
//
// For a Monday-aligned start the two formulas agree exactly, so the reference
// course (which starts Mon 2026-04-13) is unaffected — pinned by a test.
export function getTodayDayIndex(nowMs = Date.now()) {
  const s = programStart();
  const diff = nowMs - s.getTime();
  if (diff < 0) return 0; // before the program starts, show its first day
  return Math.floor(diff / DAY_MS) % 7;
}

// The real weekday abbreviations for the current program week, in order —
// so the daily list can label its rows with the days they actually fall on
// rather than the authored Mon–Sun text. Index-aligned with `daily`.
export function weekDayLabels(weekN = getCurrentWeekN() ?? 1) {
  const s = programStart();
  const first = new Date(s.getFullYear(), s.getMonth(), s.getDate() + (weekN - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
    return DAYS[d.getDay()];
  });
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Apr 13-19" / "Apr 28-May 4" for week n of the current session — the web
// port of BibbiaCore's ScheduleLogic.weekRangeLabel.
export function weekRangeLabel(weekN) {
  if (!Number.isInteger(weekN) || weekN < 1) return null;
  const s = programStart();
  const a = new Date(s.getFullYear(), s.getMonth(), s.getDate() + (weekN - 1) * 7);
  const b = new Date(s.getFullYear(), s.getMonth(), s.getDate() + (weekN - 1) * 7 + 6);
  if (a.getMonth() === b.getMonth()) {
    return `${MONTHS[a.getMonth()]} ${a.getDate()}-${b.getDate()}`;
  }
  return `${MONTHS[a.getMonth()]} ${a.getDate()}-${MONTHS[b.getMonth()]} ${b.getDate()}`;
}

// The date range to display for a week: the authored `week.d` string on the
// default calendar (byte-identical to before), a computed range once the user
// has started their own session.
export function weekDateLabel(week) {
  if (!getSessionStartOverride()) return week.d;
  return weekRangeLabel(week.n) || week.d;
}
