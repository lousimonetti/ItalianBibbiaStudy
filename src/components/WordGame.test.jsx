import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { WordGame } from './WordGame';
import { getDailyWord, getWordPool, MAX_GUESSES } from '../utils/wordGame';
import { STORAGE_KEY, loadGame } from '../utils/gameStore';
import { todayStr, STORAGE_KEY as STREAK_KEY } from '../utils/streak';

// vitest runs without `globals`, so cleanup must be explicit.
const today = () => todayStr();
const answer = () => getDailyWord(today()).word;

// Type a word on the on-screen keyboard and submit it.
function play(word) {
  for (const ch of word) fireEvent.click(screen.getByRole('button', { name: ch }));
  fireEvent.click(screen.getByRole('button', { name: 'Invio' }));
}

const tiles = () => [...document.querySelectorAll('.game-tile')];
const filled = () => tiles().filter((t) => t.textContent).map((t) => t.textContent).join('');

describe('WordGame', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('lays out one row per try and one column per letter', () => {
    render(<WordGame />);
    expect(document.querySelectorAll('.game-row')).toHaveLength(MAX_GUESSES);
    expect(tiles()).toHaveLength(MAX_GUESSES * answer().length);
  });

  it('refuses a guess of the wrong length', () => {
    render(<WordGame />);
    play('ab');
    expect(screen.getByRole('status').textContent).toContain('-letter');
    expect(document.querySelectorAll('.game-tile--correct')).toHaveLength(0);
  });

  it('warns about an unknown word but plays it on a second Enter', () => {
    render(<WordGame />);
    const junk = 'zkqx'.repeat(2).slice(0, answer().length);
    play(junk);
    expect(screen.getByRole('status').textContent).toContain('course vocabulary');
    // Still on row one — the guess was not committed.
    expect(document.querySelectorAll('.game-tile--absent')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Invio' }));
    expect(document.querySelectorAll('.game-tile--absent').length).toBeGreaterThan(0);
  });

  it('shows the how-to once, then remembers it was dismissed', () => {
    const { unmount } = render(<WordGame />);
    expect(screen.getByText('How to play', { selector: '.game-howto-title' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(document.querySelector('.game-howto')).toBeNull();
    unmount();
    render(<WordGame />);
    expect(document.querySelector('.game-howto')).toBeNull();
  });

  it('offers a hint only after three guesses', () => {
    const word = getDailyWord(today());
    const wrong = getWordPool().find((p) => p.word.length === word.word.length && p.word !== word.word).word;
    render(<WordGame />);
    expect(screen.queryByText('Hint: show meaning')).toBeNull();
    for (let i = 0; i < 3; i++) play(wrong);
    fireEvent.click(screen.getByText('Hint: show meaning'));
    expect(screen.getByText(word.en)).toBeTruthy();
  });

  it('reveals the word, its gloss and its week when you solve it', () => {
    render(<WordGame />);
    const word = getDailyWord(today());
    play(word.word);

    expect(document.querySelectorAll('.game-tile--correct')).toHaveLength(word.word.length);
    expect(screen.getByText(word.term)).toBeTruthy();
    expect(screen.getByText(word.en)).toBeTruthy();
    expect(screen.getByText(`Settimana ${word.weekN} · ${word.reading}`)).toBeTruthy();
    // The keyboard is gone once the round is over.
    expect(document.querySelector('.game-keyboard')).toBeNull();
  });

  it('records the win and ticks the study streak', () => {
    render(<WordGame />);
    play(answer());

    const store = loadGame();
    expect(store.word.days[today()]).toEqual({ guesses: [answer()], status: 'won' });
    expect(store.word.stats).toMatchObject({ played: 1, won: 1, streak: 1 });
    expect(JSON.parse(localStorage.getItem(STREAK_KEY)).today.practiced).toBe(true);
  });

  it('comes back to a half-played grid after a reload', () => {
    // A wrong guess of the right length, so the restored round is still live.
    const wrong = getWordPool().find((p) => p.word.length === answer().length && p.word !== answer()).word;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      word: { days: { [today()]: { guesses: [wrong], status: 'playing' } }, stats: {} },
    }));
    render(<WordGame />);

    expect(filled()).toBe(wrong);
    // Row two is live: the keyboard is still there and the reveal is not.
    expect(document.querySelector('.game-keyboard')).toBeTruthy();
    expect(document.querySelector('.game-reveal')).toBeNull();

    play(answer());
    expect(loadGame().word.days[today()]).toEqual({ guesses: [wrong, answer()], status: 'won' });
  });

  it('ends after the last row and shows the answer', () => {
    render(<WordGame />);
    const word = getDailyWord(today());
    const wrong = 'aaaaaaaa'.slice(0, word.word.length);
    for (let i = 0; i < MAX_GUESSES; i++) {
      play(wrong);
      // The junk guess needs its override Enter each row.
      fireEvent.click(screen.getByRole('button', { name: 'Invio' }));
    }
    expect(screen.getByText(word.term)).toBeTruthy();
    expect(loadGame().word.stats).toMatchObject({ played: 1, won: 0 });
  });

  it('a practice word after the daily leaves the stats alone', () => {
    render(<WordGame />);
    play(answer());
    expect(loadGame().word.stats.played).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Another word' }));
    expect(screen.getByText('Practice word')).toBeTruthy();
    expect(document.querySelector('.game-stats')).toBeNull();
    expect(document.querySelector('.game-keyboard')).toBeTruthy();
    expect(loadGame().word.stats.played).toBe(1);
  });
});
