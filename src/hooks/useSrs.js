import { useRef, useState, useCallback } from 'react';
import { review, buildQueue, stats, newAllowanceToday } from '../utils/srs';
import { storageKey } from '../utils/storageKey';

const STORAGE_KEY = storageKey('srs');

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function save(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage unavailable — degrade silently
  }
}

// React glue over src/utils/srs. Keeps the per-word SRS store in a ref (read at
// session-build time) plus a version counter so stat displays re-render after a
// review. Persists to localStorage under `italian-bible-srs`.
export function useSrs() {
  const storeRef = useRef(load());
  const [version, setVersion] = useState(0);

  const recordReview = useCallback((term, grade) => {
    const next = review(storeRef.current[term], grade);
    storeRef.current = { ...storeRef.current, [term]: next };
    save(storeRef.current);
    setVersion((v) => v + 1);
  }, []);

  const buildSession = useCallback((cards, opts = {}) => {
    // Honor the daily new-card cap across sessions: never introduce more new
    // cards today than the cap allows.
    const remaining = newAllowanceToday(storeRef.current);
    const newCap = Math.min(opts.newCap ?? 12, remaining);
    return buildQueue(cards, storeRef.current, { ...opts, newCap });
  }, []);

  const getStats = useCallback((cards) => stats(cards, storeRef.current), []);

  const getStore = useCallback(() => storeRef.current, []);

  return { recordReview, buildSession, getStats, getStore, version };
}
