import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProgressCheck } from './ProgressCheck';
import { PHASES } from '../data/studyData';
import { storageKey } from '../utils/storageKey';
import { loadChecks } from '../utils/progressCheck';
import { canDo } from '../../course/canDo';

const p1 = PHASES[0];
const DAY = 86400000;

function open(currentWeekN = 2) {
  render(<ProgressCheck phase={p1} currentWeekN={currentWeekN} />);
  fireEvent.click(screen.getByRole('button', { name: /Verifica dei progressi/ }));
}

describe('ProgressCheck', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('stays closed until opened', () => {
    render(<ProgressCheck phase={p1} currentWeekN={2} />);
    expect(screen.queryByText('Reading')).toBeNull();
  });

  it('shows the next passage and the whole phase, with words to learn first', () => {
    open(2);
    expect(screen.getByText('Next passage (week 3)')).toBeTruthy();
    expect(screen.getByText("All of this phase's passages")).toBeTruthy();
    expect(screen.getByText('Learn these first:')).toBeTruthy();
    expect(screen.getAllByText('0%').length).toBe(2);
  });

  it('counts a mature word as known', () => {
    const due = Date.now() + 5 * DAY;
    localStorage.setItem(storageKey('srs'), JSON.stringify({
      'la luce': { reps: 5, interval: 30, ease: 2.5, lapses: 0, due, relearn: null },
    }));
    open(null); // inactive program: next passage is week 1
    expect(screen.getByText('Next passage (week 1)')).toBeTruthy();
    expect(screen.getAllByText(/^[1-9]\d*%$/).length).toBe(2); // week 1 and the phase both use la luce
  });

  it('shows the sprint trend once a sprint on these weeks is kept', () => {
    open(2);
    expect(screen.getByText(/No fluency sprints on these weeks yet/)).toBeTruthy();
    cleanup();
    localStorage.setItem(storageKey('sprints'), JSON.stringify([
      { at: 1, weekN: 2, rounds: [{ seconds: 60, words: 42, wpm: 42 }] },
    ]));
    open(2);
    expect(screen.getByText('42 words a minute')).toBeTruthy();
  });

  it('saves a self-check only when every statement is answered', () => {
    open(2);
    fireEvent.click(screen.getByRole('button', { name: 'Take the check' }));
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save.disabled).toBe(true);
    const groups = screen.getAllByRole('radiogroup');
    expect(groups).toHaveLength(canDo.p1.items.length);
    groups.forEach((g, i) => fireEvent.click(g.querySelectorAll('[role="radio"]')[i === 0 ? 1 : 2]));
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    const saved = loadChecks().p1;
    expect(saved).toHaveLength(1);
    expect(saved[0].answers[canDo.p1.items[0].id]).toBe(1);
    expect(screen.getByText(/Last check/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Check again' })).toBeTruthy();
  });

  it('only shows the next passage in the phase that contains it', () => {
    render(<ProgressCheck phase={PHASES[1]} currentWeekN={2} />);
    fireEvent.click(screen.getByRole('button', { name: /Verifica dei progressi/ }));
    expect(screen.queryByText(/Next passage/)).toBeNull();
    expect(screen.getByText("All of this phase's passages")).toBeTruthy();
  });
});
