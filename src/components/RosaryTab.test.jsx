import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RosaryTab } from './RosaryTab';

// Thursday → Luminous mysteries by the weekly cycle.
const THURSDAY = new Date(2026, 8, 24, 9, 0, 0);

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(THURSDAY);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const next = () => fireEvent.click(screen.getByRole('button', { name: /Avanti|finish/ }));

describe('RosaryTab', () => {
  it("preselects today's mysteries", () => {
    render(<RosaryTab />);
    expect(screen.getByRole('radio', { name: /luminosi/ }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Il battesimo di Gesù nel Giordano')).toBeTruthy();
  });

  it('walks from the crucifix into the first decade and announces the mystery', () => {
    render(<RosaryTab />);
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }));
    expect(screen.getByText('Segno della Croce')).toBeTruthy();
    for (let i = 0; i < 7; i++) next(); // sign, creed, our father, 3 aves, glory
    expect(screen.getByText('Primo mistero luminoso')).toBeTruthy();
    expect(screen.getByText('Decina 1 di 5')).toBeTruthy();
  });

  it('keeps the place for today and offers to resume it', () => {
    const { unmount } = render(<RosaryTab />);
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }));
    next(); next(); next();
    unmount();
    render(<RosaryTab />);
    expect(screen.getByText(/stopped at step 4/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Resume/ }));
    expect(screen.getByText('Ave Maria')).toBeTruthy();
  });

  it('counts a finished Rosary and ticks the practiced goal', () => {
    render(<RosaryTab />);
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }));
    for (let i = 0; i < 79; i++) next();
    expect(screen.getByText('Sia lodato Gesù Cristo.')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('italian-bible-rosary')).completed).toBe(1);
    expect(JSON.parse(localStorage.getItem('italian-bible-streak')).today.practiced).toBe(true);
  });
});
