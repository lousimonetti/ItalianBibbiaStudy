import { useRef, useState, useCallback } from 'react';
import { review, buildQueue, stats } from '../utils/srs';

const STORAGE_KEY = 'italian-bible-srs';

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

  const buildSession = useCallback((cards, opts) => buildQueue(cards, storeRef.current, opts), []);

  const getStats = useCallback((cards) => stats(cards, storeRef.current), []);

  const getStore = useCallback(() => storeRef.current, []);

  return { recordReview, buildSession, getStats, getStore, version };
}
