// User's chosen TTS voice for spoken audio. Like audioSpeed.js, this is a tiny
// external store (subscribe + snapshot) so every speaker across the app shares
// one preference and can read it synchronously at speak time.
//
// We persist only the voiceURI string ('' = "let the browser pick the default
// for the locale"). The actual SpeechSynthesisVoice objects come from the
// browser at runtime and differ per device, so we resolve the URI against the
// live voice list when speaking (getSelectedVoice) and fall back to the default
// if the stored voice isn't present.
import { storageKey } from './storageKey';
import { TTS_LANG } from './locale';

const KEY = storageKey('tts-voice');

// The locale's base language (e.g. 'it' from 'it-IT'), used to filter voices.
function baseLang(langTag) {
  return String(langTag || '').split('-')[0].toLowerCase();
}

// Voices whose language matches the course locale (exact base or a region of it).
// Tolerant of underscore-form tags ('it_IT') that some engines report.
export function filterVoicesForLang(voices, langTag = TTS_LANG) {
  const base = baseLang(langTag);
  if (!base) return [];
  return (voices || []).filter((v) => {
    const l = String(v && v.lang ? v.lang : '').toLowerCase().replace('_', '-');
    return l === base || l.startsWith(`${base}-`);
  });
}

// Find the voice matching a stored voiceURI, or null when absent/unset.
export function resolveVoice(voices, uri) {
  if (!uri) return null;
  return (voices || []).find((v) => v && v.voiceURI === uri) || null;
}

function load() {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

let current = load();
const listeners = new Set();

export function getVoiceURI() {
  return current;
}

export function setVoiceURI(uri) {
  const next = uri || '';
  if (next === current) return;
  current = next;
  try {
    if (next) localStorage.setItem(KEY, next);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable — degrade silently (still applies for the session).
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Resolve the chosen voice against the browser's live voice list at speak time.
// Returns null when none is chosen or the stored voice isn't available, in which
// case callers leave `utter.voice` unset and the browser uses its locale default.
export function getSelectedVoice() {
  if (!current || typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (typeof window.speechSynthesis.getVoices !== 'function') return null;
  return resolveVoice(window.speechSynthesis.getVoices(), current);
}
