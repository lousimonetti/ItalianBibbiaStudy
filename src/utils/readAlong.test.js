import { describe, it, expect } from 'vitest';
import { tokenizeReadAlong, wordIndexAtChar } from './readAlong';

describe('tokenizeReadAlong', () => {
  it('covers the whole string exactly when re-joined', () => {
    const text = 'Padre nostro, che sei nei cieli.';
    const tokens = tokenizeReadAlong(text);
    expect(tokens.map(t => t.text).join('')).toBe(text);
  });

  it('records correct start offsets', () => {
    const tokens = tokenizeReadAlong('Ave Maria');
    expect(tokens.map(t => [t.text, t.start, t.isWord])).toEqual([
      ['Ave', 0, true],
      [' ', 3, false],
      ['Maria', 4, true],
    ]);
  });

  it('keeps punctuation attached to its word and marks whitespace runs', () => {
    const tokens = tokenizeReadAlong('Amen.  Gloria');
    expect(tokens.map(t => t.text)).toEqual(['Amen.', '  ', 'Gloria']);
    expect(tokens.map(t => t.isWord)).toEqual([true, false, true]);
  });

  it('returns an empty list for an empty string', () => {
    expect(tokenizeReadAlong('')).toEqual([]);
  });
});

describe('wordIndexAtChar', () => {
  const tokens = tokenizeReadAlong('Ave o Maria');
  // tokens: [Ave@0] [ @3] [o@4] [ @5] [Maria@6]

  it('matches a word at its exact start offset', () => {
    expect(wordIndexAtChar(tokens, 0)).toBe(0); // Ave
    expect(wordIndexAtChar(tokens, 4)).toBe(2); // o
    expect(wordIndexAtChar(tokens, 6)).toBe(4); // Maria
  });

  it('matches a word for an offset inside it', () => {
    expect(wordIndexAtChar(tokens, 2)).toBe(0); // inside "Ave"
    expect(wordIndexAtChar(tokens, 9)).toBe(4); // inside "Maria"
  });

  it('snaps an offset landing in whitespace to the preceding word', () => {
    expect(wordIndexAtChar(tokens, 3)).toBe(0); // space after Ave
  });

  it('returns -1 before any word', () => {
    expect(wordIndexAtChar([], 0)).toBe(-1);
  });
});
