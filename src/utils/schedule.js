const PROGRAM_START = new Date(2026, 3, 13); // Apr 13, 2026
const PROGRAM_WEEKS = 37;

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
