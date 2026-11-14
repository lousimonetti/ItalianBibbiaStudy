// Short answer sounds for the lesson player: a rising pair for a right answer,
// a low note for a wrong one, a tick for a matched pair, an arpeggio at the end.
// Synthesised with Web Audio, so there are no audio files to ship or precache.
// Sound is an enhancement: every function here is a silent no-op where the API
// is missing, blocked, or switched off by the learner.

import { storageKey } from './storageKey';

export const SOUND_KEY = storageKey('sound');

export function soundOn() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundOn(on) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    // storage unavailable — the choice lasts for this page only
  }
}

// Each sound is a list of notes: [frequency Hz, start s, length s, wave].
export const SOUNDS = {
  correct: [[659.25, 0, 0.09, 'sine'], [987.77, 0.08, 0.14, 'sine']],
  wrong: [[196, 0, 0.12, 'triangle'], [155.56, 0.1, 0.2, 'triangle']],
  match: [[880, 0, 0.07, 'sine']],
  combo: [[659.25, 0, 0.08, 'sine'], [830.61, 0.07, 0.08, 'sine'], [1318.5, 0.14, 0.18, 'sine']],
  done: [[523.25, 0, 0.12, 'sine'], [659.25, 0.11, 0.12, 'sine'], [783.99, 0.22, 0.12, 'sine'], [1046.5, 0.33, 0.3, 'sine']],
};

const VOLUME = 0.09;
let ctx = null;

function context() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // Browsers start a context suspended until a user gesture; every call here
  // comes from a tap or a key press, so resuming is allowed.
  if (ctx.state === 'suspended') ctx.resume?.();
  return ctx;
}

// Returns true when the sound was scheduled, false when it was skipped.
export function playSfx(name) {
  const notes = SOUNDS[name];
  if (!notes || !soundOn()) return false;
  try {
    const ac = context();
    if (!ac) return false;
    const t0 = ac.currentTime;
    for (const [freq, start, length, wave] of notes) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      // A fast attack and an exponential tail, so notes do not click.
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(VOLUME, t0 + start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + length);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + length + 0.02);
    }
    return true;
  } catch {
    return false;
  }
}

// Test hook: forget the cached AudioContext.
export function resetSfx() {
  ctx = null;
}
