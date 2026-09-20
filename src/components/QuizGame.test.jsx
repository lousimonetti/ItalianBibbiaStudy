import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QuizGame } from './QuizGame';
import { buildQuiz } from '../utils/quizGame';
import { loadGame } from '../utils/gameStore';
import { todayStr, STORAGE_KEY as STREAK_KEY } from '../utils/streak';
import { getCurrentWeekN } from '../utils/schedule';

// vitest runs without `globals`, so cleanup must be explicit.
const weekMax = getCurrentWeekN();

// The component builds exactly this round, so the test can answer it correctly.
const round = () => buildQuiz({ date: todayStr(), weekMax });

function begin() {
  render(<QuizGame />);
  fireEvent.click(screen.getByRole('button', { name: /^(Inizia|Rigioca)/ }));
}

const options = () => [...document.querySelectorAll('.quiz-opt')];

// Answer the question on screen, correctly or not, and move on.
function answerQuestion(index, correctly) {
  const q = round()[index];
  const buttons = options();
  const pick = correctly
    ? buttons.findIndex((b) => b.textContent === q.options[q.answer])
    : buttons.findIndex((b) => b.textContent !== q.options[q.answer]);
  fireEvent.click(buttons[pick]);
  fireEvent.click(screen.getByRole('button', { name: /^(Avanti|Risultato)$/ }));
}

describe('QuizGame', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('opens on a start screen with the day\'s round ready', () => {
    render(<QuizGame />);
    expect(screen.getByText('Sfida del giorno')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Inizia · \d+ domande$/ })).toBeTruthy();
  });

  it('shows the first question with its options and no answer given away', () => {
    begin();
    const q = round()[0];
    expect(document.querySelector('.quiz-prompt').textContent).toBe(q.prompt);
    expect(options()).toHaveLength(q.options.length);
    expect(document.querySelector('.quiz-count').textContent).toBe(`1 / ${round().length}`);
    // Nothing is marked until the player commits.
    expect(document.querySelector('.quiz-opt--right')).toBeNull();
  });

  it('marks the right answer and explains it', () => {
    begin();
    const q = round()[0];
    fireEvent.click(options().find((b) => b.textContent === q.options[q.answer]));
    expect(screen.getByText('Giusto')).toBeTruthy();
    expect(document.querySelector('.quiz-opt--right').textContent).toBe(q.options[q.answer]);
    // Clicking again must not change the verdict.
    fireEvent.click(options()[0]);
    expect(screen.getByText('Giusto')).toBeTruthy();
  });

  it('shows the right answer after a wrong pick', () => {
    begin();
    const q = round()[0];
    fireEvent.click(options().find((b) => b.textContent !== q.options[q.answer]));
    expect(document.querySelector('.quiz-verdict').textContent).toContain(q.options[q.answer]);
    expect(document.querySelector('.quiz-opt--wrong')).toBeTruthy();
  });

  it('scores a full round, records it and ticks the study streak', () => {
    begin();
    const total = round().length;
    for (let i = 0; i < total; i++) answerQuestion(i, true);

    expect(screen.getByText(`${total}/${total}`)).toBeTruthy();
    expect(screen.getByText('Tutto giusto!')).toBeTruthy();

    const store = loadGame();
    expect(store.quiz.days[todayStr()]).toMatchObject({ score: total, total, plays: 1 });
    expect(store.quiz.stats).toMatchObject({ played: 1, won: 1, streak: 1 });
    expect(JSON.parse(localStorage.getItem(STREAK_KEY)).today.practiced).toBe(true);
  });

  it('lists what you missed', () => {
    begin();
    const total = round().length;
    answerQuestion(0, false);
    for (let i = 1; i < total; i++) answerQuestion(i, true);

    expect(screen.getByText(`${total - 1}/${total}`)).toBeTruthy();
    expect(screen.getByText('Da rivedere:')).toBeTruthy();
    expect(document.querySelectorAll('.trap-end-list li')).toHaveLength(1);
    expect(loadGame().quiz.stats.won).toBe(0);
  });

  it('offers a replay that does not count twice', () => {
    begin();
    const total = round().length;
    for (let i = 0; i < total; i++) answerQuestion(i, true);
    fireEvent.click(screen.getByRole('button', { name: "Torna all'inizio" }));

    expect(screen.getByText(/Oggi hai fatto/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rigioca' })).toBeTruthy();
    expect(loadGame().quiz.stats.played).toBe(1);
  });
});
