import { describe, it, expect } from 'vitest';
import { getVocabIndex, lookupWord, tokenize } from './vocabIndex.js';

describe('getVocabIndex', () => {
  it('returns a non-empty Map and is memoized (same instance)', () => {
    const a = getVocabIndex();
    const b = getVocabIndex();
    expect(a).toBeInstanceOf(Map);
    expect(a.size).toBeGreaterThan(0);
    expect(a).toBe(b);
  });
});

describe('lookupWord', () => {
  it('matches a full article+noun term', () => {
    const e = lookupWord('la luce');
    expect(e).toBeTruthy();
    expect(e.en).toBe('the light');
  });

  it('matches the bare noun with the article stripped from the term', () => {
    // "la luce" is indexed; "luce" should resolve to the same entry.
    expect(lookupWord('luce')).toMatchObject({ en: 'the light' });
    // "il Verbo" → "verbo"
    expect(lookupWord('Verbo')).toMatchObject({ en: 'the Word' });
  });

  it('resolves an elided-article term and its stem', () => {
    expect(lookupWord("l'unzione")).toMatchObject({ en: 'the anointing' });
    expect(lookupWord('unzione')).toMatchObject({ en: 'the anointing' });
  });

  it('is case-insensitive', () => {
    expect(lookupWord('LUCE')).toMatchObject({ en: 'the light' });
  });

  it('returns null for unknown words and empty input', () => {
    expect(lookupWord('xyzzy')).toBeNull();
    expect(lookupWord('')).toBeNull();
    expect(lookupWord(undefined)).toBeNull();
  });

  it('every entry carries it/en/ipa fields', () => {
    const e = lookupWord('la vita');
    expect(e).toHaveProperty('it');
    expect(e).toHaveProperty('en');
    expect(e).toHaveProperty('ipa');
  });
});

describe('tokenize', () => {
  it('round-trips: joined tokens equal the original text', () => {
    const text = "In principio era il Verbo, l'unzione a Betania.";
    const toks = tokenize(text);
    expect(toks.map(t => t.text).join('')).toBe(text);
  });

  it('keeps internal apostrophes as one word token', () => {
    const toks = tokenize("l'unzione");
    const words = toks.filter(t => t.isWord).map(t => t.text);
    expect(words).toEqual(["l'unzione"]);
  });

  it('separates words from punctuation and whitespace', () => {
    const toks = tokenize('la luce splende');
    expect(toks.filter(t => t.isWord).map(t => t.text)).toEqual(['la', 'luce', 'splende']);
  });
});
