import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

// PronunciationPractice reads `window.SpeechRecognition` at module-load time to
// decide whether to render at all, so the fake must exist on window BEFORE the
// component is imported (same constraint as SpeakerButton.test.jsx).
//
// The fake models the parts of Chrome's behaviour that this bug depends on:
//   • only ONE recognition may be active per page — start() on a second one
//     throws InvalidStateError, exactly as Chrome does;
//   • stop() on an instance that never started is a no-op and fires NO onend;
//   • a normal turn fires onresult and then onend.
let active = null;          // the currently-running recognition, if any
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
    if (!this.started) return; // no-op, and crucially NO onend
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

  // Test helper: deliver a transcript. Chrome fires onresult, then onend —
  // but not necessarily in the same tick, which is the gap this bug lives in.
  speak(transcript) {
    const results = [[{ transcript }]];
    results[0].length = 1;
    act(() => this.onresult?.({ results }));
  }

  finish() {
    this.started = false;
    if (active === this) active = null;
    act(() => this.onend?.());
  }
}

window.SpeechRecognition = FakeRecognition;

const { PronunciationPractice } = await import('./PronunciationPractice.jsx');

const micButton = () => screen.getByRole('button', { name: /recording/i });
const startSession = () => {
  // Any "start" control begins a session with the full card pool.
  const btn = screen.getAllByRole('button').find((b) => /^Start/.test(b.textContent));
  fireEvent.click(btn);
};

beforeEach(() => {
  active = null;
  instances = [];
  localStorage.clear();
});
afterEach(cleanup);

describe('PronunciationPractice — the mic can always be used again', () => {
  it('records, scores, and returns to idle on a clean turn', () => {
    render(<PronunciationPractice />);
    startSession();

    fireEvent.click(micButton());
    expect(micButton().textContent).toContain('Listening');

    instances.at(-1).speak('la luce');
    instances.at(-1).finish();

    expect(micButton().textContent).toContain('Tap to speak');
  });

  // The reported defect. Chrome fires onresult but the recognition can still be
  // winding down when the learner moves to the next card; the component used to
  // create a second recognition and call start() on it unguarded. Chrome threw
  // InvalidStateError, the throw escaped the click handler AFTER the state was
  // already set to 'recording', and the button stuck on "Listening…" forever —
  // every later tap took the stop() branch on a recognition that never started,
  // which fires no onend, so it never recovered.
  it('starts listening again on the next card even if the previous turn has not ended', () => {
    render(<PronunciationPractice />);
    startSession();

    // Card 1: speak and get a result, but onend has NOT fired yet.
    fireEvent.click(micButton());
    instances.at(-1).speak('la luce');

    // Advance to card 2 while the old recognition is still technically active.
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Card 2: the mic must actually be listening — not merely *claiming* to.
    // Asserting on the label alone cannot tell a live recognition from one
    // stuck after a failed start(), which is the whole bug.
    fireEvent.click(micButton());
    expect(instances.at(-1).started).toBe(true);
    expect(active).toBe(instances.at(-1));
    expect(micButton().textContent).toContain('Listening');

    instances.at(-1).speak('il verbo');
    expect(screen.getByText(/Heard:/)).toBeTruthy();
  });

  it('recovers if the browser refuses to start at all', () => {
    render(<PronunciationPractice />);
    startSession();

    // Simulate a foreign recognition holding the mic (another tab, a stuck
    // instance) so every start() throws.
    active = new FakeRecognition();
    active.started = true;

    fireEvent.click(micButton());
    // It must not be left claiming to listen.
    expect(micButton().textContent).not.toContain('Listening');
    expect(screen.getByText(/Could not hear clearly|microphone/i)).toBeTruthy();
  });

  it('releases the microphone when the session is exited', () => {
    render(<PronunciationPractice />);
    startSession();
    fireEvent.click(micButton());
    const rec = instances.at(-1);

    fireEvent.click(screen.getByRole('button', { name: 'Exit' }));
    expect(rec.started).toBe(false);
    expect(active).toBe(null);
  });

  it('releases the microphone when the component unmounts mid-recording', () => {
    const { unmount } = render(<PronunciationPractice />);
    startSession();
    fireEvent.click(micButton());
    const rec = instances.at(-1);

    unmount();
    expect(rec.started).toBe(false);
    expect(active).toBe(null);
  });

  it('scores a late result against the card that was on screen when it started', () => {
    render(<PronunciationPractice />);
    startSession();

    fireEvent.click(micButton());
    const rec = instances.at(-1);
    // The learner taps Next before the transcript lands.
    rec.speak('la luce');
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    // A stray late result from the old recognition must not score the new card.
    rec.speak('qualcosa di completamente diverso');

    expect(micButton().textContent).toContain('Tap to speak');
  });
});
