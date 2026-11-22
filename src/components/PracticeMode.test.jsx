import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PracticeMode } from './PracticeMode';
import { CORE_CARDS } from '../utils/decks';
import { mineWord } from '../utils/mined';

// The deck chooser (REVIEW-fluency.md B1/B2): course, core and saved words
// share one scheduler, each with its own card pool and filters.
beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('PracticeMode decks', () => {
  it('switches to the core deck and filters it by topic', () => {
    render(<PracticeMode />);
    fireEvent.click(screen.getByRole('button', { name: /parole di base/i }));
    expect(screen.getByRole('button', { name: /all topics/i }).textContent).toContain(`${CORE_CARDS.length} cards`);
    fireEvent.click(screen.getByRole('button', { name: /parish life/i }));
    const parish = CORE_CARDS.filter((c) => c.domain === 'church').length;
    expect(screen.getByRole('button', { name: /^start/i }).textContent).toContain(`${Math.min(parish, 12)} card`);
  });

  it('explains how to save words when My words is empty, and lists them once saved', () => {
    const { unmount } = render(<PracticeMode />);
    fireEvent.click(screen.getByRole('button', { name: /mie parole/i }));
    expect(screen.getByText(/no saved words yet/i)).toBeTruthy();
    unmount();
    mineWord({ it: 'rotolata', en: 'rolled', ex: 'Una pietra rotolata via.' });
    render(<PracticeMode />);
    fireEvent.click(screen.getByRole('button', { name: /mie parole/i }));
    expect(screen.getByText(/1 saved word/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /^start/i }).textContent).toContain('1 card');
  });
});
