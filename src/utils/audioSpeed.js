// Global audio-speed preference for all spoken audio (SpeakerButton, tap-to-hear).
// A tiny external store (subscribe + snapshot) so every speaker button across the
// app stays in sync without prop-drilling or a context provider — and so the value
// is readable synchronously at speak time by non-React callers (e.g. WordGloss).
//
// The preference is the *default* rate; callers that pass an explicit `rate`
// (Practice → Listening mode) keep their own per-mode control and are unaffected.
import { storageKey } from './storageKey';

const KEY = storageKey('audio-speed');

// `rate` is a SpeechSynthesisUtterance rate (1.0 = normal). Slower = clearer for beginners.
export const SPEEDS = [
  { id: 'slow', label: 'Slow', rate: 0.6 },
  { id: 'normal', label: 'Normal', rate: 0.85 },
  { id: 'fast', label: 'Fast', rate: 1 },
];

export const DEFAULT_SPEED_ID = 'normal';

function isValidId(id) {
  return SPEEDS.some((s) => s.id === id);
}

export function rateForId(id) {
  return (SPEEDS.find((s) => s.id === id) || SPEEDS[1]).rate;
}

function load() {
  try {
    const v = localStorage.getItem(KEY);
    return isValidId(v) ? v : DEFAULT_SPEED_ID;
  } catch {
    return DEFAULT_SPEED_ID;
  }
}

let current = load();
const listeners = new Set();

export function getSpeedId() {
  return current;
}

export function getRate() {
  return rateForId(current);
}

export function setSpeedId(id) {
  if (!isValidId(id) || id === current) return;
  current = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // Storage unavailable — degrade silently (still applies for the session).
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
