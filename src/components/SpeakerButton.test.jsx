import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

// The component evaluates `'speechSynthesis' in window` at module-load time,
// so the Web Speech API must exist on window BEFORE the component is imported.
// We install a fake here at top level (runs after static imports resolve) and
// load SpeakerButton dynamically once the global is present.
let lastUtterance = null;

class FakeUtterance {
  constructor(text) {
    this.text = text;
    this.lang = '';
    this.rate = 1;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
    lastUtterance = this;
  }
}

globalThis.SpeechSynthesisUtterance = FakeUtterance;
window.speechSynthesis = { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] };

const { SpeakerButton } = await import('./SpeakerButton.jsx');

beforeEach(() => {
  lastUtterance = null;
  window.speechSynthesis = { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] };
});

afterEach(() => {
  cleanup();
});

describe('SpeakerButton — rendering', () => {
  it('renders a button when speechSynthesis is available', () => {
    render(<SpeakerButton word="la luce" />);
    expect(screen.getByRole('button', { name: 'Hear pronunciation' })).toBeTruthy();
  });
});

describe('SpeakerButton — speaking', () => {
  it('speaks the word in Italian at a slowed rate when clicked', () => {
    render(<SpeakerButton word="la luce" />);
    fireEvent.click(screen.getByRole('button'));

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(lastUtterance.text).toBe('la luce');
    expect(lastUtterance.lang).toBe('it-IT');
    expect(lastUtterance.rate).toBe(0.85);
  });

  it('shows the stop affordance while speaking and reverts when audio ends', () => {
    render(<SpeakerButton word="il mondo" />);
    const btn = screen.getByRole('button');

    fireEvent.click(btn);
    act(() => lastUtterance.onstart());
    expect(screen.getByRole('button', { name: 'Stop audio' })).toBeTruthy();

    act(() => lastUtterance.onend());
    expect(screen.getByRole('button', { name: 'Hear pronunciation' })).toBeTruthy();
  });

  it('cancels playback when clicked again while speaking', () => {
    render(<SpeakerButton word="credere" />);
    const btn = screen.getByRole('button');

    fireEvent.click(btn);
    act(() => lastUtterance.onstart());
    fireEvent.click(btn);

    expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Hear pronunciation' })).toBeTruthy();
  });

  it('recovers to idle state if the utterance errors', () => {
    render(<SpeakerButton word="nascere" />);
    const btn = screen.getByRole('button');

    fireEvent.click(btn);
    act(() => lastUtterance.onstart());
    act(() => lastUtterance.onerror());

    expect(screen.getByRole('button', { name: 'Hear pronunciation' })).toBeTruthy();
  });
});
