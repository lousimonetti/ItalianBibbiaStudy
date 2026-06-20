import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY, DEFAULT_HOUR, shouldNotify } from '../utils/reminders';
import { loadStreak, todayFlags, todayStr } from '../utils/streak';

const supported = typeof window !== 'undefined' && 'Notification' in window;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function save(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable — degrade silently
  }
}

function studiedToday() {
  const f = todayFlags(loadStreak());
  return f.read || f.practiced || f.journaled;
}

function fireNotification() {
  const title = "È l'ora dell'italiano 🇮🇹";
  const opts = {
    body: 'Mantieni la tua serie! — Keep your streak going.',
    icon: '/icons.svg',
    tag: 'daily-study',
  };
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(title, opts))
        .catch(() => new Notification(title, opts));
    } else {
      new Notification(title, opts);
    }
  } catch {
    // notification couldn't be shown — ignore
  }
}

// Opt-in daily reminder. No backend/push: while the app is open we nudge once a
// day if you're past your reminder hour and haven't studied. Renders nothing
// where the Notification API is unavailable.
export function Reminders() {
  const [prefs, setPrefs] = useState(() => ({
    enabled: false,
    hour: DEFAULT_HOUR,
    lastNotified: null,
    permission: supported ? Notification.permission : 'denied',
    ...load(),
  }));

  const update = useCallback((patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  const toggle = useCallback(async () => {
    if (!supported) return;
    if (prefs.enabled) {
      update({ enabled: false });
      return;
    }
    let permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
    update({ permission, enabled: permission === 'granted' });
  }, [prefs.enabled, update]);

  // Fire (at most once a day) when the conditions are met, and again at the
  // reminder hour if the app stays open.
  useEffect(() => {
    if (!supported || !prefs.enabled || prefs.permission !== 'granted') return undefined;

    const tryFire = () => {
      const today = todayStr();
      if (shouldNotify(prefs, { studiedToday: studiedToday(), today })) {
        fireNotification();
        update({ lastNotified: today });
      }
    };

    tryFire();
    const now = new Date();
    const target = new Date();
    target.setHours(prefs.hour, 0, 0, 0);
    const ms = target.getTime() - now.getTime();
    const timer = ms > 0 ? setTimeout(tryFire, ms) : null;
    return () => { if (timer) clearTimeout(timer); };
  }, [prefs, update]);

  if (!supported) return null;

  const blocked = prefs.permission === 'denied';

  return (
    <button
      className={`today-reminder${prefs.enabled ? ' on' : ''}`}
      onClick={toggle}
      disabled={blocked}
      title={blocked ? 'Notifications are blocked in your browser settings' : 'Daily study reminder'}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2a4 4 0 00-4 4c0 3-1.5 4-1.5 4h11S12 9 12 6a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {blocked ? 'Reminders blocked' : prefs.enabled ? 'Daily reminder on' : 'Remind me daily'}
    </button>
  );
}
