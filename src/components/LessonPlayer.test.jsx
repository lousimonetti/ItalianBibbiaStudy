import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { PHASES } from '../data/studyData';
import { weekLessons, solutionFor, isGraded } from '../utils/lessonPlan';
import { loadLessons } from '../utils/lessonStore';
import { loadStreak, todayFlags } from '../utils/streak';
import { storageKey } from '../utils/storageKey';
import { LessonPlayer } from './LessonPlayer';
import { ContinueCard, WeekLessons } from './LessonHub';

const WEEK1 = PHASES[0].weeks[0];
const LESSON = weekLessons(WEEK1)[0];
const srs = () => JSON.parse(localStorage.getItem(storageKey('srs')) || '{}');

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const footer = () => document.querySelector('.lesson-footer');
const primary = () => within(footer()).getByRole('button', { name: /check|continue/i });

// Answer the step on screen. `wrong` gives a typed step a bad answer.
function answer(step, { wrong = false } = {}) {
  const body = document.querySelector('.lesson-body');
  switch (step.kind) {
    case 'intro':
    case 'tip':
      break;
    case 'match':
      step.pairs.forEach((p) => {
        fireEvent.click(within(body).getByRole('button', { name: p.it }));
        fireEvent.click(within(body).getByRole('button', { name: p.en }));
      });
      break;
    case 'choice':
      fireEvent.click(within(body).getByRole('button', { name: step.options[step.answer] }));
      break;
    case 'build':
      solutionFor(step).forEach((ci) => {
        const chips = [...body.querySelectorAll('.lesson-build-pool .prac-chip')];
        fireEvent.click(chips.find((c) => c.textContent === step.chips[ci]));
      });
      fireEvent.click(primary());
      break;
    default:
      fireEvent.change(within(body).getByLabelText('Your answer'), {
        target: { value: wrong ? 'zzzzzz' : solutionFor(step) },
      });
      fireEvent.click(primary());
  }
  fireEvent.click(primary()); // Continue
}

function playThrough(lesson, missId = null) {
  for (const step of lesson.steps) answer(step, { wrong: step.id === missId });
  if (missId !== null) answer(lesson.steps.find((s) => s.id === missId));
}

describe('LessonPlayer', () => {
  it('opens on the first new word and cannot check an empty answer', () => {
    render(<LessonPlayer lesson={LESSON} onClose={() => {}} />);
    expect(screen.getByText('New word')).toBeTruthy();
    expect(document.querySelector('.lesson-word').textContent).toContain(LESSON.steps[0].card.it);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('a clean run reaches the summary, records the lesson, the streak and the SRS', () => {
    const onClose = vi.fn();
    render(<LessonPlayer lesson={LESSON} onClose={onClose} />);
    playThrough(LESSON);
    expect(screen.getByText(/Lesson complete/)).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(loadLessons().done[LESSON.key]).toMatchObject({ pct: 100, times: 1 });
    expect(todayFlags(loadStreak()).practiced).toBe(true);
    const store = srs();
    expect(Object.keys(store).sort()).toEqual([...LESSON.words].sort());
    expect(Object.values(store).every((c) => c.reps === 1)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('a missed recall shows the answer, comes back at the end, and lapses the card', () => {
    render(<LessonPlayer lesson={LESSON} onClose={() => {}} />);
    const miss = LESSON.steps.find((s) => s.kind === 'recall');
    for (const step of LESSON.steps) {
      if (step.id !== miss.id) { answer(step); continue; }
      const body = document.querySelector('.lesson-body');
      fireEvent.change(within(body).getByLabelText('Your answer'), { target: { value: 'zzzzzz' } });
      fireEvent.click(primary());
      expect(screen.getByText('Non proprio')).toBeTruthy();
      expect(document.querySelector('.lesson-verdict-answer').textContent).toContain(miss.card.it);
      fireEvent.click(primary());
    }
    expect(screen.getByText('One more try at this one')).toBeTruthy();
    answer(miss);
    expect(screen.getByText(/Lesson complete/)).toBeTruthy();
    expect(screen.queryByText('100%')).toBeNull();
    expect(srs()[miss.term]).toMatchObject({ reps: 0, lapses: 1 });
  });

  it('a wrong tap is shown but leaves the SRS untouched', () => {
    render(<LessonPlayer lesson={LESSON} onClose={() => {}} />);
    const idx = LESSON.steps.findIndex((s) => s.kind === 'choice');
    LESSON.steps.slice(0, idx).forEach((s) => answer(s));
    const step = LESSON.steps[idx];
    const body = document.querySelector('.lesson-body');
    fireEvent.click(within(body).getByRole('button', { name: step.options[(step.answer + 1) % step.options.length] }));
    expect(screen.getByText('Non proprio')).toBeTruthy();
    expect(srs()).toEqual({});
  });

  it('Enter checks and continues', () => {
    render(<LessonPlayer lesson={LESSON} onClose={() => {}} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(document.querySelector('.lesson-word').textContent).toContain(LESSON.steps[1].card.it);
  });

  it('closing mid-lesson records nothing', () => {
    const onClose = vi.fn();
    render(<LessonPlayer lesson={LESSON} onClose={onClose} />);
    answer(LESSON.steps[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Close lesson' }));
    expect(onClose).toHaveBeenCalled();
    expect(loadLessons().done).toEqual({});
  });

  it('plays a passage lesson to the end', () => {
    const passage = weekLessons(WEEK1).at(-1);
    render(<LessonPlayer lesson={passage} onClose={() => {}} />);
    for (const step of passage.steps) {
      if (step.kind === 'tf') {
        fireEvent.click(screen.getByRole('button', { name: step.answer ? 'Vero' : 'Falso' }));
        fireEvent.click(primary());
      } else if (step.kind === 'mc') {
        fireEvent.click(screen.getByRole('button', { name: step.options[step.answer] }));
        fireEvent.click(primary());
      } else answer(step);
    }
    expect(screen.getByText('100%')).toBeTruthy();
    expect(passage.steps.some(isGraded)).toBe(true);
    expect(srs()).toEqual({});
  });
});

describe('ContinueCard', () => {
  it('offers the first lesson of the current week, then the next one after it is done', () => {
    render(<ContinueCard currentWeekN={1} onOpenReview={() => {}} />);
    expect(screen.getByText(/Week 1 · Lesson 1 of 3/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    playThrough(LESSON);
    fireEvent.click(within(document.querySelector('.lesson-summary')).getByRole('button', { name: 'Continue' }));
    expect(document.querySelector('.lesson-overlay')).toBeNull();
    expect(screen.getByText(/Week 1 · Lesson 2 of 3/)).toBeTruthy();
  });

  it('turns into Review when the week is done and cards are due', () => {
    const done = Object.fromEntries(weekLessons(WEEK1).map((l) => [l.key, { date: '2026-01-01', pct: 100, times: 1 }]));
    localStorage.setItem(storageKey('lessons'), JSON.stringify({ done }));
    localStorage.setItem(storageKey('srs'), JSON.stringify({ [LESSON.words[0]]: { reps: 1, interval: 1, due: 1 } }));
    const onOpenReview = vi.fn();
    render(<ContinueCard currentWeekN={1} onOpenReview={onOpenReview} />);
    expect(screen.getByText('1 card due')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Review/ }));
    expect(onOpenReview).toHaveBeenCalled();
  });
});

describe('WeekLessons', () => {
  it('lists the week and marks finished lessons repeatable', () => {
    localStorage.setItem(storageKey('lessons'), JSON.stringify({ done: { '1.1': { date: '2026-01-01', pct: 90, times: 1 } } }));
    render(<WeekLessons week={WEEK1} />);
    expect(screen.getByText('1 / 3 done')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Repeat lesson 1/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Start lesson 2/ }));
    expect(document.querySelector('.lesson-overlay')).toBeTruthy();
  });
});
