import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SessionRow, TargetDateLink } from './NewSession';
import { config } from '../../course/config';
import { getSessionStart, clearSessionStart } from '../utils/sessionStart';
import { storageKey } from '../utils/storageKey';

const WEEKS = config.schedule.weeks;

// vitest runs without `globals`, so testing-library's auto-cleanup is not
// registered. A fixed clock keeps the derived dates deterministic:
// Mon 2026-08-31.
beforeEach(() => {
  localStorage.clear();
  vi.setSystemTime(new Date(2026, 7, 31, 9));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  clearSessionStart();
});

const openTargetModal = () => {
  render(<TargetDateLink />);
  fireEvent.click(screen.getByRole('button', { name: /pick a finish date/i }));
};
const targetInput = () => screen.getByLabelText(/finish by/i);
const primary = () => screen.getByRole('button', { name: /Begin|Start at week/ });

describe('NewSession — mode toggle', () => {
  it('opens in start mode from the session row', () => {
    render(<SessionRow prominent />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Start the ${WEEKS}-week program`) }));
    expect(screen.getByLabelText('Start date')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start on a date' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('offers a direct route into finish-by mode when the program is inactive', () => {
    render(<SessionRow prominent />);
    fireEvent.click(screen.getByRole('button', { name: /finish by a date/i }));
    expect(screen.getByRole('button', { name: 'Finish by a date' }).getAttribute('aria-pressed')).toBe('true');
    expect(targetInput()).toBeTruthy();
  });

  it('switches between modes inside the modal', () => {
    render(<SessionRow prominent />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Start the ${WEEKS}-week program`) }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish by a date' }));
    expect(targetInput()).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start on a date' }));
    expect(screen.getByLabelText('Start date')).toBeTruthy();
  });
});

describe('NewSession — finish-by summary', () => {
  it('prompts before a date is entered, and cannot be submitted', () => {
    openTargetModal();
    expect(screen.getByText(/counted\s+backwards from it/i)).toBeTruthy();
    expect(primary().disabled).toBe(true);
  });

  it('confirms the full program when there is room for it', () => {
    openTargetModal();
    // Sun 2027-05-16 is exactly 37 weeks after Mon 2026-08-31.
    fireEvent.change(targetInput(), { target: { value: '2027-05-16' } });
    expect(screen.getByText('Aug 31, 2026 → May 16, 2027')).toBeTruthy();
    expect(screen.getByText(new RegExp(`All ${WEEKS} weeks`))).toBeTruthy();
    expect(primary().disabled).toBe(false);
  });

  it('warns — but still allows — a date too close to fit the program', () => {
    openTargetModal();
    fireEvent.change(targetInput(), { target: { value: '2026-12-27' } });
    expect(screen.getByText(/starting at week 21/i)).toBeTruthy();
    expect(screen.getByText(/weeks 1–20 would be behind you already/i)).toBeTruthy();
    // Allowed, not blocked — and the button says what it will do.
    const btn = screen.getByRole('button', { name: 'Start at week 21' });
    expect(btn.disabled).toBe(false);
  });

  it('says when the program would begin in the future', () => {
    openTargetModal();
    fireEvent.change(targetInput(), { target: { value: '2028-05-14' } });
    expect(screen.getByText(/would begin in \d+ days/i)).toBeTruthy();
  });

  it('discloses the snap rather than hiding it', () => {
    openTargetModal();
    // Thu 2027-05-20 snaps back to Sun 2027-05-16.
    fireEvent.change(targetInput(), { target: { value: '2027-05-20' } });
    expect(screen.getByText(/finishes on May 16, 2027/i)).toBeTruthy();
  });

  it('refuses a date already in the past', () => {
    openTargetModal();
    fireEvent.change(targetInput(), { target: { value: '2026-01-04' } });
    expect(screen.getByText(/already passed/i)).toBeTruthy();
    expect(primary().disabled).toBe(true);
  });
});

describe('NewSession — committing a finish-by date', () => {
  // resetSession writes through to localStorage; the component then reloads,
  // which jsdom does not implement, so stub it.
  let reload;
  beforeEach(() => {
    reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload }, writable: true, configurable: true,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());

  it('stores the DERIVED start date, not the end date', () => {
    openTargetModal();
    fireEvent.change(targetInput(), { target: { value: '2027-05-16' } });
    fireEvent.click(primary());

    expect(localStorage.getItem(storageKey('session-start'))).toBe('2026-08-31');
    expect(getSessionStart()).toBe('2026-08-31');
    expect(reload).toHaveBeenCalled();
  });

  it('stores a Monday even when the target implies a mid-week start', () => {
    openTargetModal();
    fireEvent.change(targetInput(), { target: { value: '2027-05-20' } });
    fireEvent.click(primary());

    const stored = localStorage.getItem(storageKey('session-start'));
    expect(new Date(...stored.split('-').map((n, i) => (i === 1 ? +n - 1 : +n))).getDay()).toBe(1);
  });

  it('clears the chosen stores, same as the start-date path', () => {
    localStorage.setItem(storageKey('progress'), '{"1":true}');
    localStorage.setItem(storageKey('journal'), '{"1":"ciao"}');
    openTargetModal();
    fireEvent.change(targetInput(), { target: { value: '2027-05-16' } });
    fireEvent.click(primary());

    // progress is checked by default, journal is not.
    expect(localStorage.getItem(storageKey('progress'))).toBe(null);
    expect(localStorage.getItem(storageKey('journal'))).toBe('{"1":"ciao"}');
  });
});
