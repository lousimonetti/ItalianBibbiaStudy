// Pure decision for the local daily reminder. There is no backend/push service
// (hard constraint), so reminders are best-effort: while the app is open we
// nudge once a day if you're past your reminder hour and haven't studied yet.

export const STORAGE_KEY = 'italian-bible-reminders';
export const DEFAULT_HOUR = 19; // 7pm

// Should we fire the reminder right now? Pure so it can be unit-tested.
export function shouldNotify(prefs, { now = new Date(), studiedToday = false, today } = {}) {
  if (!prefs || !prefs.enabled) return false;
  if (prefs.permission !== 'granted') return false;
  if (studiedToday) return false;
  if (prefs.lastNotified && prefs.lastNotified === today) return false;
  const hour = typeof prefs.hour === 'number' ? prefs.hour : DEFAULT_HOUR;
  return now.getHours() >= hour;
}
