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

  // Starts from a saved position near the end rather than clicking all 79
  // steps: each step re-renders a full WordGloss prayer, and the long walk ran
  // past vitest's 5s timeout on CI. The step sequence itself is covered by
  // rosary.test.js; this test is about what finishing does.
  it('counts a finished Rosary and ticks the practiced goal', () => {
    localStorage.setItem('italian-bible-rosary', JSON.stringify({
      resume: { date: '2026-09-24', setId: 'luminosi', step: 76 }, completed: 0, last: null,
    }));
    render(<RosaryTab />);
    fireEvent.click(screen.getByRole('button', { name: /Resume/ }));
    expect(screen.getByText('Preghiera di Fatima')).toBeTruthy();
    for (let i = 0; i < 3; i++) next(); // Fatima → Salve Regina → Sign of the Cross → finish
    expect(screen.getByText('Sia lodato Gesù Cristo.')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('italian-bible-rosary')).completed).toBe(1);
    expect(JSON.parse(localStorage.getItem('italian-bible-streak')).today.practiced).toBe(true);
  });
});
