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

export function getCurrentWeekN() {
  const diff = Date.now() - programStart().getTime();
  if (diff < 0) return null;
  const n = Math.floor(diff / 604800000) + 1;
  return n <= PROGRAM_WEEKS ? n : null;
}

// Returns 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
export function getTodayDayIndex() {
  return (new Date().getDay() + 6) % 7;
}

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
