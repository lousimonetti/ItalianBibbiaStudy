import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { storageKey } from '../utils/storageKey';
import { todayISO } from '../utils/sessionStart';
import { WelcomeCard } from './WelcomeCard';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const start = () => localStorage.getItem(storageKey('session-start'));

describe('WelcomeCard', () => {
  it('starts a newcomer at week 1 today and hands over to the first lesson', () => {
    const onBegin = vi.fn();
    render(<WelcomeCard currentWeekN={31} onBegin={onBegin} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start lesson 1' }));
    expect(start()).toBe(todayISO());
    expect(localStorage.getItem(storageKey('welcome-seen'))).toBe('1');
    expect(onBegin).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Benvenuto!')).toBeNull();
  });

  it('leaves the calendar alone for someone who joins the shared one', () => {
    const onBegin = vi.fn();
    render(<WelcomeCard currentWeekN={31} onBegin={onBegin} />);
    fireEvent.click(screen.getByRole('button', { name: /shared calendar \(now in week 31\)/ }));
    expect(start()).toBeNull();
    expect(onBegin).not.toHaveBeenCalled();
    expect(screen.queryByText('Benvenuto!')).toBeNull();
  });

  it('never moves a calendar the learner already chose', () => {
    localStorage.setItem(storageKey('session-start'), '2026-09-07');
    render(<WelcomeCard currentWeekN={10} onBegin={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue my lessons' }));
    expect(start()).toBe('2026-09-07');
  });

  it('never moves the calendar once a lesson is finished', () => {
    localStorage.setItem(storageKey('lessons'), JSON.stringify({ done: { 'w31:1': { times: 1, best: 90 } } }));
    render(<WelcomeCard currentWeekN={31} onBegin={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue my lessons' }));
    expect(start()).toBeNull();
  });

  it('stays away once dismissed', () => {
    localStorage.setItem(storageKey('welcome-seen'), '1');
    const { container } = render(<WelcomeCard currentWeekN={31} />);
    expect(container.innerHTML).toBe('');
  });
});
