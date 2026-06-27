import { useSyncExternalStore } from 'react';

import {
  getVoiceURI,
  setVoiceURI,
  subscribe as subscribePref,
  filterVoicesForLang,
} from '../utils/voicePreference';

// Browser TTS voices come from the OS/engine and populate asynchronously. We
// cache the list and expose it as a stable external store (a fresh getVoices()
// array every render would loop useSyncExternalStore).
//
// iOS Safari is the hard case: getVoices() returns [] at first and the
// `voiceschanged` event fires unreliably or never — so we ALSO poll a few times
// after load, and re-read after the first utterance (primeVoices), which is what
// actually nudges iOS to populate the list. See the voice notes in the PR.
const hasTTS = typeof window !== 'undefined'
  && 'speechSynthesis' in window
  && typeof window.speechSynthesis.getVoices === 'function';
const EMPTY = [];

function signature(list) {
  return list.map((v) => v.voiceURI).join('|');
}

let cachedVoices = hasTTS ? window.speechSynthesis.getVoices() : EMPTY;
let cachedSig = signature(cachedVoices);
const voiceListeners = new Set();

// Re-read the browser voice list; only notify subscribers when it actually
// changed (so polling doesn't churn renders).
function refreshVoices() {
  if (!hasTTS) return;
  const next = window.speechSynthesis.getVoices();
  const sig = signature(next);
  if (sig === cachedSig) return;
  cachedVoices = next;
  cachedSig = sig;
  voiceListeners.forEach((l) => l());
}

function subscribeVoices(listener) {
  voiceListeners.add(listener);
  return () => voiceListeners.delete(listener);
}

function getVoicesSnapshot() {
  return cachedVoices;
}

// Call after the first user-initiated speak(): on iOS this is often what makes
// the voice list appear. No-op cost once voices are loaded.
export function primeVoices() {
  if (!hasTTS) return;
  refreshVoices();
  if (cachedVoices.length === 0) {
    setTimeout(refreshVoices, 250);
    setTimeout(refreshVoices, 1000);
  }
}

if (hasTTS) {
  if (typeof window.speechSynthesis.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
  }
  // Poll a handful of times for engines where voiceschanged is flaky (iOS).
  let attempts = 0;
  const poll = () => {
    refreshVoices();
    attempts += 1;
    if (cachedVoices.length === 0 && attempts < 6) {
      setTimeout(poll, attempts < 3 ? 300 : 1000);
    }
  };
  poll();
}

// Returns the locale-matching voices, the selected voiceURI ('' = browser
// default), and a setter. Provider-free, so it works in any component.
export function useVoices() {
  const all = useSyncExternalStore(subscribeVoices, getVoicesSnapshot, () => EMPTY);
  const selectedURI = useSyncExternalStore(subscribePref, getVoiceURI, getVoiceURI);
  return { voices: filterVoicesForLang(all), selectedURI, setVoice: setVoiceURI };
}
