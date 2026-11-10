import { useState, useCallback, useEffect } from 'react';
import { storageKey } from '../utils/storageKey';

const STORAGE_KEY = storageKey('progress');

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable — degrade silently
  }
}

// Fired on window when a week is ticked from outside the hook.
const PROGRESS_EVENT = 'coursekit:progress';

// Tick a week from anywhere (finishing its last lesson does this). Sets, never
// toggles — returns false when the week was already done.
export function markWeekDone(weekNum) {
  const data = loadFromStorage();
  if (data[weekNum]) return false;
  saveToStorage({ ...data, [weekNum]: true });
  try {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // no window — nothing is listening
  }
  return true;
}

export function useProgress(total) {
  const [checked, setChecked] = useState(loadFromStorage);

  useEffect(() => {
    const reload = () => setChecked(loadFromStorage());
    window.addEventListener(PROGRESS_EVENT, reload);
    return () => window.removeEventListener(PROGRESS_EVENT, reload);
  }, []);

  const toggle = useCallback((weekNum) => {
    setChecked((prev) => {
      const next = { ...prev, [weekNum]: !prev[weekNum] };
      saveToStorage(next);
      return next;
    });
  }, []);

  const doneCount = Object.values(checked).filter(Boolean).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return { checked, toggle, doneCount, pct };
}
