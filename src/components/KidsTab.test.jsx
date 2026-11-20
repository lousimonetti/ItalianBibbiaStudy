import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { KidsTab } from './KidsTab';
import { loadKids, saveKids, setLocked, emptyKids, memoryBoard, HOLD_MS } from '../utils/kids';
import { kids } from '../../courses/it-bible-cei/kids.js';

// jsdom has no speechSynthesis, so the listening game shows the word as text
// (the fallback for devices that cannot speak). That is what lets these tests
// know the answer.

const options = () => screen.getAllByRole('button').filter((b) => b.classList.contains('kids-option'));
const open = (name) => fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }));

describe('KidsTab', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('lists every theme and the prayers', () => {
    render(<KidsTab />);
    for (const t of kids.themes) expect(screen.getByRole('button', { name: new RegExp(t.it) })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Preghiamo insieme/ })).toBeTruthy();
  });

  it('plays a whole listening round, collecting stickers and stars', () => {
    vi.useFakeTimers();
    render(<KidsTab />);
    open('La creazione');
    open('Ascolta e trova');
    for (let q = 0; q < 6; q++) {
      const word = screen.getByTestId('kids-prompt').textContent;
      // A wrong pick first: it fades, the round does not move on.
      const wrong = options().find((b) => b.getAttribute('aria-label') !== word);
      fireEvent.click(wrong);
      expect(wrong.className).toContain('nope');
      expect(screen.getByTestId('kids-prompt').textContent).toBe(word);
      fireEvent.click(options().find((b) => b.getAttribute('aria-label') === word));
      act(() => { vi.advanceTimersByTime(2000); });
    }
    expect(screen.getByText('Evviva! Hai finito!')).toBeTruthy();
    const store = loadKids();
    expect(Object.keys(store.found)).toHaveLength(6);
    expect(store.stars).toBe(6);
  });

  it('memory: a miss turns back over, a match stays up', () => {
    vi.useFakeTimers();
    // Pin the shuffle so the test knows where each picture lies.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const theme = kids.themes.find((t) => t.id === 'noe');
    const board = memoryBoard(theme.words, () => 0, 4);
    render(<KidsTab />);
    open("L'arca di Noè");
    open('Trova le coppie');
    const cards = () => screen.getAllByRole('button').filter((b) => b.classList.contains('kids-mem-card'));
    expect(cards()).toHaveLength(8);
    const word0 = board.cards[0].word.it;
    const miss = board.cards.findIndex((c) => c.word.it !== word0);
    const pair = board.cards.findIndex((c, i) => i > 0 && c.word.it === word0);

    fireEvent.click(cards()[0]);
    fireEvent.click(cards()[miss]);
    expect(cards()[0].getAttribute('aria-label')).toBe(word0);
    act(() => { vi.advanceTimersByTime(1500); });
    expect(cards().filter((c) => c.getAttribute('aria-pressed') === 'true')).toHaveLength(0);

    fireEvent.click(cards()[0]);
    fireEvent.click(cards()[pair]);
    expect(cards()[0].className).toContain('matched');
    expect(cards()[pair].className).toContain('matched');
    expect(loadKids().found[word0]).toBe(true);
    vi.restoreAllMocks();
  });

  it('full screen stays on until a grown-up holds the exit button', () => {
    vi.useFakeTimers();
    render(<KidsTab />);
    open('Full screen for little ones');
    expect(loadKids().locked).toBe(true);
    const exit = screen.getByRole('button', { name: /hold to exit/ });
    // A quick tap does nothing.
    fireEvent.pointerDown(exit);
    act(() => { vi.advanceTimersByTime(300); });
    fireEvent.pointerUp(exit);
    act(() => { vi.advanceTimersByTime(HOLD_MS); });
    expect(loadKids().locked).toBe(true);
    // Holding does.
    fireEvent.pointerDown(exit);
    act(() => { vi.advanceTimersByTime(HOLD_MS + 10); });
    expect(loadKids().locked).toBe(false);
    expect(screen.queryByRole('button', { name: /hold to exit/ })).toBeNull();
  });

  it('opens locked when the lock was left on', () => {
    saveKids(setLocked(emptyKids(), true));
    const { container } = render(<KidsTab />);
    expect(container.querySelector('.kids-root--locked')).toBeTruthy();
    expect(screen.queryByText(/Full screen for little ones/)).toBeNull();
  });

  it('shows a prayer line by line from the course devotions', () => {
    render(<KidsTab />);
    open('Preghiamo insieme');
    open('Segno della Croce');
    expect(screen.getByText('Nel nome del Padre,')).toBeTruthy();
    expect(screen.getByText('e dello Spirito Santo.')).toBeTruthy();
  });
});
