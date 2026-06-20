import { useState, useCallback } from 'react';
import { loadStreak, recordActivity, currentStreak, todayFlags, todayStr } from '../utils/streak';

// Dashboard-facing streak state. Reads the store on mount (TodayCard remounts on
// tab switch, so practice/journal activity recorded on other tabs is picked up
// on return). `tickRead` marks today's reading box done.
export function useStreak() {
  const [store, setStore] = useState(loadStreak);
  const today = todayStr();

  const tickRead = useCallback(() => setStore(recordActivity('read')), []);

  return {
    current: currentStreak(store, today),
    best: store.best || 0,
    flags: todayFlags(store, today),
    tickRead,
  };
}
