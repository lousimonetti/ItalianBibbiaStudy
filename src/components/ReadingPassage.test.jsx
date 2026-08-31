import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ReadingPassage } from './ReadingPassage';

// Acts 4,11 — a relative pronoun, a participial aside wedged between it and its
// verb, and a compound verb. Everything the skeleton view exists to show.
const WEEK = {
  n: 20,
  r: 'Acts 4-6',
  passage: {
    ref: 'Atti 4,11',
    translation: 'CEI 2008',
    verses: [
      { n: 11, t: 'È lui la pietra che, scartata da voi costruttori, è diventata la pietra d\'angolo.' },
    ],
  },
};

// The class ends up on the token wrapper; the word itself is the button inside.
// `nth` picks between repeated words ("pietra" occurs twice in this verse).
const wrapperFor = (word, nth = 0) =>
  screen.getAllByRole('button', { name: word })[nth].closest('.gloss-word-wrap');

describe('ReadingPassage', () => {
  // vitest runs without `globals`, so testing-library's auto-cleanup is not
  // registered — unmount explicitly or renders stack up across tests.
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('renders the passage with its reference', () => {
    render(<ReadingPassage week={WEEK} />);
    expect(screen.getByText(/Atti 4,11 · CEI 2008/)).toBeTruthy();
  });

  it('renders nothing when the week has no reading', () => {
    const { container } = render(<ReadingPassage week={{ n: 1, vocab: [] }} />);
    expect(container.firstChild).toBe(null);
  });

  it('adds no skeleton classes until the toggle is on', () => {
    const { container } = render(<ReadingPassage week={WEEK} />);
    expect(container.querySelector('.wordgloss-skeleton')).toBe(null);
    expect(container.querySelector('.sk-finite')).toBe(null);
  });

  describe('with Struttura on', () => {
    beforeEach(() => {
      render(<ReadingPassage week={WEEK} />);
      fireEvent.click(screen.getByRole('button', { name: 'Struttura' }));
    });

    it('marks the finite verbs', () => {
      expect(wrapperFor('È').className).toContain('sk-finite');
      expect(wrapperFor('è').className).toContain('sk-finite');
    });

    it('marks a participle leaning on an auxiliary as one compound verb', () => {
      expect(wrapperFor('diventata').className).toContain('sk-compound');
    });

    it('marks a bare participle as a reduced relative', () => {
      expect(wrapperFor('scartata').className).toContain('sk-participle');
    });

    it('dims the comma-delimited aside, and only the aside', () => {
      expect(wrapperFor('scartata').className).toContain('sk-dim');
      expect(wrapperFor('costruttori').className).toContain('sk-dim');
      expect(wrapperFor('diventata').className).not.toContain('sk-dim');
      expect(wrapperFor('pietra', 0).className).not.toContain('sk-dim');
      expect(wrapperFor('pietra', 1).className).not.toContain('sk-dim');
    });

    it('keeps every word tappable while the view is on', () => {
      const btn = screen.getAllByRole('button', { name: 'scartata' })[0];
      fireEvent.click(btn);
      expect(btn.getAttribute('aria-expanded')).toBe('true');
    });

    it('shows the clause count for the line', () => {
      // "È lui la pietra che … è diventata …" — two finite verbs, two clauses.
      expect(screen.getByTitle(/2 finite verbs — so 2 clauses/)).toBeTruthy();
    });

    it('shows the legend', () => {
      expect(screen.getByText(/finite verb — one per clause/)).toBeTruthy();
    });

    it('toggles back off', () => {
      fireEvent.click(screen.getByRole('button', { name: '✓ Struttura' }));
      expect(document.querySelector('.sk-finite')).toBe(null);
    });
  });

  it('falls back to vocab example sentences when no passage is authored', () => {
    const week = { n: 1, r: 'John 1-2', vocab: [['il Verbo', 'the Word', 'In principio era il Verbo']] };
    render(<ReadingPassage week={week} />);
    expect(screen.getByText(/Key verses/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'principio' })).toBeTruthy();
  });
});
