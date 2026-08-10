import { describe, it, expect } from 'vitest';
import { canonical, checkAnswer, checkDrill } from './answer.js';

describe('canonical', () => {
  it('lowercases, folds accents, strips a leading article and punctuation', () => {
    expect(canonical('La Luce!')).toBe('luce');
    expect(canonical('verità')).toBe('verita');
    expect(canonical("l'unzione")).toBe('unzione');
  });
});

describe('checkAnswer', () => {
  it('accepts an exact match ignoring case/article/accents', () => {
    expect(checkAnswer('la luce', 'Luce')).toBe(true);
    expect(checkAnswer('la verità', 'verita')).toBe(true);
    expect(checkAnswer('il Verbo', 'verbo')).toBe(true);
  });

  it('tolerates a small typo', () => {
    expect(checkAnswer('miracolo', 'miraclo')).toBe(true); // 1 deletion
  });

  it('rejects an empty or clearly wrong answer', () => {
    expect(checkAnswer('luce', '')).toBe(false);
    expect(checkAnswer('luce', 'mondo')).toBe(false);
  });
});

describe('checkDrill — strict grading for grammar drills', () => {
  it('accepts an exact match', () => {
    expect(checkDrill('è', 'è')).toBe(true);
    expect(checkDrill('abbiamo', 'abbiamo')).toBe(true);
  });

  it('is accent-sensitive — the whole point of many drills', () => {
    // checkAnswer folds accents and allows an edit, so it would accept these.
    expect(checkDrill('è', 'e')).toBe(false);
    expect(checkDrill('è', 'a')).toBe(false);
    expect(checkDrill('perché', 'perche')).toBe(false);
  });

  it('gives short answers no typo tolerance at all', () => {
    expect(checkDrill('sia', 'sai')).toBe(false);
    expect(checkDrill('del', 'dal')).toBe(false);
  });

  it('allows one typo on longer answers', () => {
    expect(checkDrill('abbiamo', 'abbiami')).toBe(true);
    expect(checkDrill('parlerei', 'parlereix')).toBe(true);
    expect(checkDrill('abbiamo', 'abxxamo')).toBe(false);
  });

  it('ignores case, surrounding punctuation and extra whitespace', () => {
    expect(checkDrill('ci sono', '  Ci   sono!  ')).toBe(true);
    expect(checkDrill("c'è", 'C’è')).toBe(true);
  });

  it('rejects an empty answer', () => {
    expect(checkDrill('sia', '')).toBe(false);
  });
});
