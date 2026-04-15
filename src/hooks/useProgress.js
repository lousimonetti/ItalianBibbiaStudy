import { useState, useCallback } from 'react';

const STORAGE_KEY = 'italian-bible-progress';

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

export function useProgress(total) {
  const [checked, setChecked] = useState(loadFromStorage);

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
