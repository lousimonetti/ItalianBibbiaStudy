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

// Apple ships a single voice at several compression tiers, and reports each
// tier as a separate SpeechSynthesisVoice with the SAME display name. Safari
// (macOS and iOS alike) returns exactly two entries for Italian — "Alice"
// (compact) and "Alice" (super-compact) — which renders as two identical,
// indistinguishable <option>s where the second is the worse of the pair.
//
// Verified on macOS Safari 2026-08-31: `say -v '?'` lists nine installed
// Italian voices, but speechSynthesis.getVoices() returns only those two Alice
// tiers. Safari exposes the default system voice per language and nothing else,
// so downloaded voices (named, Enhanced, or Premium) never reach a web page.
// Chrome does expose the full system list, which is why the picker still earns
// its place there.
//
// Collapsing same-name voices to their best tier fixes both browsers at once:
// Chrome keeps a list of genuinely distinct voices, and Safari drops to one
// entry — which makes VoicePicker's `voices.length >= 2` test hide a control
// that could never have done anything.
const QUALITY_TIERS = [
  ['premium', 4],
  ['enhanced', 3],
  // 'super-compact' must be tested before 'compact' — it contains it.
  ['super-compact', 1],
  ['compact', 2],
];

// Rough tier of a voice from its URI. 0 for engines that don't encode one
// (Google's, e.g.), which is fine: ranks are only ever compared within a group
// of identically-named voices.
export function voiceQualityRank(uri) {
  const s = String(uri || '').toLowerCase();
  for (const [tier, rank] of QUALITY_TIERS) {
    if (s.includes(tier)) return rank;
  }
  return 0;
}

// One entry per (name, lang), keeping the highest-quality tier. Insertion order
// is preserved, so an engine that encodes no tier keeps its original list order.
export function dedupeVoicesByName(voices) {
  const best = new Map();
  for (const v of voices || []) {
    if (!v) continue;
    const key = `${v.name || ''}|${String(v.lang || '').toLowerCase().replace('_', '-')}`;
    const prev = best.get(key);
    if (!prev || voiceQualityRank(v.voiceURI) > voiceQualityRank(prev.voiceURI)) {
      best.set(key, v);
    }
  }
  return [...best.values()];
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
