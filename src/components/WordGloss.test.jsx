import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { WordGloss } from './WordGloss';
import { loadMined } from '../utils/mined';

// Saving a tapped word to "Mie parole" (REVIEW-fluency.md B2). jsdom has no
// speechSynthesis, but the course has IPA, so every word still gets a popover.
beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('WordGloss save to My words', () => {
  it('saves a word with the sentence it is in and the source', () => {
    render(<WordGloss text="Prima frase. Una pietra rotolata via." source="Week 37" />);
    fireEvent.click(screen.getByRole('button', { name: 'rotolata' }));
    fireEvent.click(screen.getByRole('button', { name: /save to my words/i }));
    expect(loadMined()).toMatchObject([{ it: 'rotolata', ex: 'Una pietra rotolata via.', src: 'Week 37' }]);
    expect(screen.getByText(/saved to my words/i)).toBeTruthy();
  });

  it('lowercases a word that only starts its sentence', () => {
    render(<WordGloss text="Rotolata via la pietra." />);
    fireEvent.click(screen.getByRole('button', { name: 'Rotolata' }));
    fireEvent.click(screen.getByRole('button', { name: /save to my words/i }));
    expect(loadMined()[0].it).toBe('rotolata');
  });

  it('offers no save for a course word, and names the core deck for a core word', () => {
    render(<WordGloss text="la luce e la finestra" />);
    fireEvent.click(screen.getByRole('button', { name: 'luce' }));
    expect(screen.queryByRole('button', { name: /save to my words/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'finestra' }));
    expect(screen.getByText('In Parole di base')).toBeTruthy();
  });
});
