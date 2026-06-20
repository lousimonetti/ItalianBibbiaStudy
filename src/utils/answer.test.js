import { describe, it, expect } from 'vitest';
import { canonical, checkAnswer } from './answer.js';

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
