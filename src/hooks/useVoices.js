import { useSyncExternalStore } from 'react';

import {
  getVoiceURI,
  setVoiceURI,
  subscribe as subscribePref,
  filterVoicesForLang,
} from '../utils/voicePreference';

// Browser TTS voices come from the OS/engine and, on some browsers (Chrome),
// populate asynchronously — so we cache the list and refresh on `voiceschanged`,
// exposing it as a stable external store (a fresh getVoices() array every render
// would loop useSyncExternalStore).
const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
const EMPTY = [];

let cachedVoices = hasTTS ? window.speechSynthesis.getVoices() : EMPTY;
const voiceListeners = new Set();

function refreshVoices() {
  cachedVoices = hasTTS ? window.speechSynthesis.getVoices() : EMPTY;
  voiceListeners.forEach((l) => l());
}

if (hasTTS && typeof window.speechSynthesis.addEventListener === 'function') {
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}

function subscribeVoices(listener) {
  voiceListeners.add(listener);
  return () => voiceListeners.delete(listener);
}

function getVoicesSnapshot() {
  return cachedVoices;
}

// Returns the locale-matching voices, the selected voiceURI ('' = browser
// default), and a setter. Provider-free, so it works in any component.
export function useVoices() {
  const all = useSyncExternalStore(subscribeVoices, getVoicesSnapshot, () => EMPTY);
  const selectedURI = useSyncExternalStore(subscribePref, getVoiceURI, getVoiceURI);
  return { voices: filterVoicesForLang(all), selectedURI, setVoice: setVoiceURI };
}
