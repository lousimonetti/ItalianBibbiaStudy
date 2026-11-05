import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { VersePractice } from './VersePractice';
import { VerseReview } from './VerseReview';
import { stageParts, stageCount } from '../utils/verseRecall';
import { loadVerseSrs } from '../utils/verseReview';

const TEXT = 'In principio era il Verbo.';
const week = {
  n: 1,
  passage: { ref: 'Giovanni 1,1', verses: [{ n: 1, t: TEXT, en: 'In the beginning was the Word.' }] },
};

const open = () => fireEvent.click(screen.getByRole('button', { name: /Versetti/ }));
const fillStage = (stage, text = TEXT) => {
  const words = stageParts(text, stage).filter((p) => p.blank).map((p) => p.word);
  screen.getAllByRole('textbox').forEach((input, i) => fireEvent.change(input, { target: { value: words[i] } }));
};

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('VersePractice', () => {
  it('renders nothing for a week with no reading', () => {
    const { container } = render(<VersePractice week={{ n: 2, vocab: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('starts collapsed, then shows the verse and its reference', () => {
    render(<VersePractice week={week} />);
    expect(screen.queryByText('Giovanni 1,1')).toBeNull();
    open();
    expect(screen.getByText('Giovanni 1,1')).toBeTruthy();
    expect(screen.getByText(`Stage 1 of ${stageCount(TEXT)}`)).toBeTruthy();
  });

  it('walks through memorization stages to the whole verse', () => {
    render(<VersePractice week={week} />);
    open();
    const count = stageCount(TEXT);
    for (let stage = 0; stage < count; stage++) {
      fillStage(stage);
      fireEvent.click(screen.getByRole('button', { name: 'Check' }));
      if (stage < count - 1) fireEvent.click(screen.getByRole('button', { name: 'Next stage' }));
    }
    expect(screen.getByText(/whole verse from memory/)).toBeTruthy();
  });

  it('holds the stage after a wrong answer and reveals the verse', () => {
    render(<VersePractice week={week} />);
    open();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'sbagliato' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/1 to fix/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText(`Stage 1 of ${stageCount(TEXT)}`)).toBeTruthy();
    expect(screen.getByRole('textbox').value).toBe('');
  });

  it('builds a verse from its chips, undoing a misplaced chip', () => {
    render(<VersePractice week={week} />);
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Build' }));
    const words = TEXT.split(' ');
    // A wrong first pick goes back to the pool when tapped again.
    fireEvent.click(screen.getByRole('button', { name: words[1] }));
    fireEvent.click(screen.getByRole('button', { name: words[1] }));
    for (const word of words) fireEvent.click(screen.getByRole('button', { name: word }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/rebuilt the whole verse/)).toBeTruthy();
  });
});

describe('VerseReview', () => {
  it('keeps the same blanks after a correct answer raises the verse reps', () => {
    localStorage.setItem('italian-bible-verse-srs', JSON.stringify({
      // Due now, reviewed before, so it is first in the queue at its own stage.
      'Giovanni 1,1': { ease: 2.5, interval: 1, reps: 1, lapses: 0, due: 1, last: 1, created: 1 },
    }));
    render(<VerseReview />);
    fireEvent.click(screen.getByRole('button', { name: 'Start review' }));
    expect(screen.getByText('Giovanni 1,1')).toBeTruthy();
    const inputs = screen.getAllByRole('textbox');
    const verse = 'In principio era il Verbo, e il Verbo era presso Dio e il Verbo era Dio.';
    stageParts(verse, 1).filter((p) => p.blank).forEach((p, i) => {
      fireEvent.change(inputs[i], { target: { value: p.word } });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(loadVerseSrs()['Giovanni 1,1'].reps).toBe(2);
    const after = screen.getAllByRole('textbox');
    expect(after.length).toBe(inputs.length);
    expect(after.every((el) => el.className.includes('drill-ok'))).toBe(true);
  });

  it('grades a verse and stores it apart from vocabulary', () => {
    render(<VerseReview />);
    fireEvent.click(screen.getByRole('button', { name: 'Start review' }));
    const first = screen.getAllByRole('textbox');
    expect(first.length).toBe(1);
    fireEvent.change(first[0], { target: { value: 'sbagliato' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(Object.values(loadVerseSrs())[0].lapses).toBe(1);
    expect(localStorage.getItem('italian-bible-srs')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
  });
});
