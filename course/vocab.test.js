import { describe, it, expect } from 'vitest';
import { parseVocab, surfaceForm, buildCards } from './vocab.js';

describe('parseVocab', () => {
  it('reads the legacy 4-element tuple', () => {
    expect(parseVocab(['il Verbo', 'the Word', 'In principio era il Verbo', '/il ˈvɛrbo/']))
      .toEqual({ it: 'il Verbo', en: 'the Word', ex: 'In principio era il Verbo', ipa: '/il ˈvɛrbo/', exEn: '', form: '' });
  });

  it('reads the optional 5th element', () => {
    const parsed = parseVocab(['credere', 'to believe', 'ha creduto in lui', '/x/', { exEn: 'he believed in him', form: 'ha creduto' }]);
    expect(parsed.exEn).toBe('he believed in him');
    expect(parsed.form).toBe('ha creduto');
  });

  it('never returns undefined fields', () => {
    const parsed = parseVocab(['a', 'b', 'c']);
    expect(parsed.ipa).toBe('');
    expect(parsed.exEn).toBe('');
    expect(parsed.form).toBe('');
  });

  it('ignores a non-object 5th element rather than throwing', () => {
    expect(parseVocab(['a', 'b', 'c', 'd', 'oops']).exEn).toBe('');
    expect(parseVocab(['a', 'b', 'c', 'd', ['x']]).form).toBe('');
  });

  it('tolerates a missing or malformed tuple', () => {
    expect(parseVocab(undefined).it).toBe('');
    expect(parseVocab(null).en).toBe('');
  });
});

describe('surfaceForm', () => {
  it('prefers the inflected form when present', () => {
    expect(surfaceForm({ it: 'credere', form: 'ha creduto' })).toBe('ha creduto');
  });
  it('falls back to the headword', () => {
    expect(surfaceForm({ it: 'la luce', form: '' })).toBe('la luce');
  });
});

describe('buildCards', () => {
  const phases = [{
    id: 'p1',
    weeks: [{ n: 1, r: 'John 1', vocab: [['a', 'b', 'c', '/d/', { exEn: 'e', form: 'f' }]] }],
  }];

  it('flattens phases into cards carrying week context', () => {
    const cards = buildCards(phases);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ it: 'a', en: 'b', ex: 'c', ipa: '/d/', exEn: 'e', form: 'f', weekN: 1, reading: 'John 1', phaseId: 'p1' });
  });
});
