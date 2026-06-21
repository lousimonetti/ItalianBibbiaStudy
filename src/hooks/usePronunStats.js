import { useRef, useState, useCallback } from 'react';

import { storageKey } from '../utils/storageKey';

const STORAGE_KEY = storageKey('pronun');

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

// Persists pronunciation attempts per word in localStorage (`italian-bible-pronun`).
// Per word: { attempts, last, best, sum, avg, at }. Used to surface a
// "words you struggle with" view and feed the SRS-backed practice queue.
export function usePronunStats() {
  const storeRef = useRef(load());
  const [version, setVersion] = useState(0);

  const record = useCallback((term, score) => {
    const prev = storeRef.current[term] || { attempts: 0, best: 0, sum: 0 };
    const attempts = prev.attempts + 1;
    const sum = (prev.sum || 0) + score;
    const next = {
      attempts,
      last: score,
      best: Math.max(prev.best || 0, score),
      sum,
      avg: Math.round(sum / attempts),
      at: Date.now(),
    };
    storeRef.current = { ...storeRef.current, [term]: next };
    save(storeRef.current);
    setVersion((v) => v + 1);
  }, []);

  const getStore = useCallback(() => storeRef.current, []);

  return { record, getStore, version };
}
