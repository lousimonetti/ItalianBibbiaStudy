import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { playSfx, soundOn, setSoundOn, resetSfx, SOUNDS, SOUND_KEY } from './sfx';

function fakeAudio() {
  const made = { oscillators: [], resumed: 0 };
  class FakeContext {
    constructor() { this.currentTime = 1; this.state = 'suspended'; this.destination = {}; }
    resume() { made.resumed += 1; this.state = 'running'; }
    createOscillator() {
      const osc = { frequency: {}, connect() {}, start(t) { osc.startedAt = t; }, stop(t) { osc.stoppedAt = t; } };
      made.oscillators.push(osc);
      return osc;
    }
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    }
  }
  window.AudioContext = FakeContext;
  return made;
}

describe('sfx', () => {
  beforeEach(() => { localStorage.clear(); resetSfx(); });
  afterEach(() => { delete window.AudioContext; delete window.webkitAudioContext; });

  it('is on by default and remembers being switched off', () => {
    expect(soundOn()).toBe(true);
    setSoundOn(false);
    expect(localStorage.getItem(SOUND_KEY)).toBe('off');
    expect(soundOn()).toBe(false);
    setSoundOn(true);
    expect(soundOn()).toBe(true);
  });

  it('does nothing, without throwing, where Web Audio is missing', () => {
    expect(playSfx('correct')).toBe(false);
  });

  it('schedules one oscillator per note and resumes a suspended context', () => {
    const made = fakeAudio();
    expect(playSfx('done')).toBe(true);
    expect(made.oscillators).toHaveLength(SOUNDS.done.length);
    expect(made.resumed).toBe(1);
    made.oscillators.forEach((osc, i) => {
      expect(osc.frequency.value).toBe(SOUNDS.done[i][0]);
      expect(osc.stoppedAt).toBeGreaterThan(osc.startedAt);
    });
  });

  it('plays nothing when switched off, or for an unknown name', () => {
    const made = fakeAudio();
    expect(playSfx('nope')).toBe(false);
    setSoundOn(false);
    expect(playSfx('correct')).toBe(false);
    expect(made.oscillators).toHaveLength(0);
  });

  it('survives a context that throws', () => {
    window.AudioContext = class { constructor() { throw new Error('blocked'); } };
    expect(playSfx('wrong')).toBe(false);
  });

  it('keeps every sound short', () => {
    for (const notes of Object.values(SOUNDS)) {
      for (const [freq, start, length] of notes) {
        expect(freq).toBeGreaterThan(100);
        expect(start + length).toBeLessThan(0.8);
      }
    }
  });
});
