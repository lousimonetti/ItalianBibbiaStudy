import { config } from '../../course/config';

// Program start + length come from the course schedule. `startDate` is a local
// 'YYYY-MM-DD' string.
const [sy, sm, sd] = config.schedule.startDate.split('-').map(Number);
const PROGRAM_START = new Date(sy, sm - 1, sd);
const PROGRAM_WEEKS = config.schedule.weeks;

export function getCurrentWeekN() {
  const diff = Date.now() - PROGRAM_START.getTime();
  if (diff < 0) return null;
  const n = Math.floor(diff / 604800000) + 1;
  return n <= PROGRAM_WEEKS ? n : null;
}

// Returns 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
export function getTodayDayIndex() {
  return (new Date().getDay() + 6) % 7;
}
