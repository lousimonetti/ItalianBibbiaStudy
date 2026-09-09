import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

// DevotionsTab decides at module-load time whether Shadow mode can listen, so
// the fake SpeechRecognition must be on window BEFORE the component is
// imported (same constraint as PronunciationPractice.test.jsx).
//
// The fake models the Chrome/Safari behaviour the Prayers mic bug depended on:
//   • only ONE recognition may be active per page — start() on a second one
//     throws InvalidStateError;
//   • stop() on an instance that never started is a no-op and fires NO onend;
//   • a normal turn fires onresult and then, possibly later, onend.
let active = null;
let instances = [];

class FakeRecognition {
  constructor() {
    this.lang = '';
    this.interimResults = false;
    this.maxAlternatives = 1;
    this.started = false;
    this.aborted = false;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    instances.push(this);
  }

  start() {
    if (active && active !== this) {
      const err = new Error("Failed to execute 'start' on 'SpeechRecognition': recognition has already started.");
      err.name = 'InvalidStateError';
      throw err;
    }
    this.started = true;
    active = this;
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    if (active === this) active = null;
    this.onend?.();
  }

  abort() {
    this.aborted = true;
    if (!this.started) { if (active === this) active = null; return; }
    this.started = false;
    if (active === this) active = null;
    this.onend?.();
  }

  speak(transcript) {
    const results = [[{ transcript }]];
    results[0].length = 1;
    act(() => this.onresult?.({ results }));
  }

  fail(error) {
    this.started = false;
    if (active === this) active = null;
    act(() => this.onerror?.({ error }));
  }

  finish() {
    this.started = false;
    if (active === this) active = null;
    act(() => this.onend?.());
  }
}

window.SpeechRecognition = FakeRecognition;
// jsdom has no speechSynthesis; the mic handler cancels any playing TTS first.
window.speechSynthesis = { cancel: () => {}, speak: () => {}, getVoices: () => [] };

const { ShadowMode } = await import('./DevotionsTab.jsx');

const micButton = () => screen.getByRole('button', { name: /recording/i });

const PRAYER = {
  id: 'segno-croce',
  lines: [
    { it: 'Nel nome del Padre,', en: 'In the name of the Father,' },
    { it: 'del Figlio', en: 'and of the Son' },
    { it: 'e dello Spirito Santo.', en: 'and of the Holy Spirit.' },
  ],
};

function openShadow() {
  render(<ShadowMode prayer={PRAYER} />);
}

beforeEach(() => {
  active = null;
  instances = [];
  localStorage.clear();
});
afterEach(cleanup);

describe('DevotionsTab Shadow mode — the mic can always be used again', () => {
  it('records, scores, and returns to idle on a clean turn', () => {
    openShadow();

    fireEvent.click(micButton());
    expect(instances.at(-1).started).toBe(true);
    expect(micButton().textContent).toContain('Listening');

    instances.at(-1).speak('nel nome del padre');
    instances.at(-1).finish();

    expect(micButton().textContent).toContain('Listen, then repeat');
    expect(screen.getByText(/Heard:/).textContent).toContain('nel nome del padre');
  });

  // The reported defect: on a phone the previous recognition is still winding
  // down when the learner taps the mic for the next line. start() threw, the
  // state had already been set to 'recording', and the button stuck on
  // "Listening…" — every later tap took the stop() branch on a recognition
  // that never started, which fires no onend, so it never recovered.
  it('listens again on the next line even if the previous turn has not ended', () => {
    openShadow();

    fireEvent.click(micButton());
    instances.at(-1).speak('nel nome del padre');
    // onend has NOT fired: the old recognition is still technically active.

    fireEvent.click(screen.getByRole('button', { name: /Next line/ }));
    fireEvent.click(micButton());

    const rec = instances.at(-1);
    expect(rec.started).toBe(true);
    expect(active).toBe(rec);
    expect(micButton().textContent).toContain('Listening');
  });

  it('listens again right after a result on the same line, before onend', () => {
    openShadow();

    fireEvent.click(micButton());
    instances.at(-1).speak('nel nome');

    fireEvent.click(micButton());
    expect(instances.at(-1).started).toBe(true);
    expect(micButton().textContent).toContain('Listening');
  });

  it('never claims to listen when start() throws, and recovers on the next tap', () => {
    openShadow();

    // Something else on the page holds the microphone.
    const other = new FakeRecognition();
    other.start();

    fireEvent.click(micButton());
    expect(micButton().textContent).not.toContain('Listening');
    expect(screen.getByText(/Microphone not available/)).toBeTruthy();

    other.abort();
    fireEvent.click(micButton());
    expect(instances.at(-1).started).toBe(true);
    expect(micButton().textContent).toContain('Listening');
  });

  it('tap-to-stop returns to idle even when the recognition fires no onend', () => {
    openShadow();

    fireEvent.click(micButton());
    const rec = instances.at(-1);
    rec.onend = null; // model a browser that drops the event
    fireEvent.click(micButton());

    expect(micButton().textContent).toContain('Listen, then repeat');
    expect(rec.started).toBe(false);
  });

  it('shows an actionable message when the browser denies the microphone', () => {
    openShadow();

    fireEvent.click(micButton());
    instances.at(-1).fail('not-allowed');

    expect(micButton().textContent).toContain('Listen, then repeat');
    expect(screen.getByText(/allow microphone access/)).toBeTruthy();
  });

  it('does not score a late transcript against the line the learner moved to', () => {
    openShadow();

    fireEvent.click(micButton());
    const stale = instances.at(-1);

    fireEvent.click(screen.getByRole('button', { name: /Next line/ }));
    // Moving on released it (handlers detached, abort called).
    expect(stale.aborted).toBe(true);
    expect(stale.onresult).toBeNull();
    expect(screen.queryByText(/Heard:/)).toBeNull();
  });

  it('releases the microphone on unmount', () => {
    openShadow();

    fireEvent.click(micButton());
    const rec = instances.at(-1);
    expect(active).toBe(rec);

    cleanup();

    expect(rec.aborted).toBe(true);
    expect(active).toBeNull();
  });
});
