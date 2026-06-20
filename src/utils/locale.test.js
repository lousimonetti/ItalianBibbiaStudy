import { describe, it, expect } from 'vitest';
import { buildArticleRegex, LEADING_ARTICLE } from './locale.js';

describe('buildArticleRegex', () => {
  it('strips Italian articles, including the elided l\'', () => {
    expect('la luce'.replace(LEADING_ARTICLE, '')).toBe('luce');
    expect("l'unzione".replace(LEADING_ARTICLE, '')).toBe('unzione');
    expect('gli strumenti'.replace(LEADING_ARTICLE, '')).toBe('strumenti');
  });

  it('matches the longest article first ("il " beats "i ")', () => {
    const re = buildArticleRegex(['i', 'il', 'la']);
    expect('il cane'.replace(re, '')).toBe('cane'); // not "l cane"
    expect('i cani'.replace(re, '')).toBe('cani');
  });

  it('is generic — works for Spanish and French', () => {
    const es = buildArticleRegex(['el', 'la', 'los', 'las', 'un', 'una']);
    expect('el mundo'.replace(es, '')).toBe('mundo');
    expect('las casas'.replace(es, '')).toBe('casas');
    const fr = buildArticleRegex(['le', 'la', 'les', 'un', 'une', "l'"]);
    expect("l'eau".replace(fr, '')).toBe('eau');
    expect('les amis'.replace(fr, '')).toBe('amis');
  });

  it('matches nothing for an empty article list', () => {
    const re = buildArticleRegex([]);
    expect('la luce'.replace(re, '')).toBe('la luce');
  });
});
