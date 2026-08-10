import { describe, it, expect } from 'vitest';
import { makeCloze, isClozeEligible } from './cloze.js';

describe('makeCloze', () => {
  it('blanks the bare content word, keeping the article as a hint', () => {
    const c = makeCloze('il Verbo', 'In principio era il Verbo');
    expect(c).toEqual({ before: 'In principio era il ', answer: 'Verbo', after: '' });
  });

  it('reconstructs the original sentence from before+answer+after', () => {
    const ex = 'le tenebre non la vinsero';
    const c = makeCloze('le tenebre', ex);
    expect(c.before + c.answer + c.after).toBe(ex);
    expect(c.answer).toBe('tenebre');
  });

  it('returns null when the term is not present (conjugated/derived form)', () => {
    // "credere" → example uses "creduto"
    expect(makeCloze('credere', 'ha creduto in lui')).toBeNull();
  });

  it('returns null on empty input', () => {
    expect(makeCloze('', 'x')).toBeNull();
    expect(makeCloze('x', '')).toBeNull();
  });
});

describe('isClozeEligible', () => {
  it('true when the example contains the term, false otherwise', () => {
    expect(isClozeEligible({ it: 'la luce', ex: 'La luce splende' })).toBe(true);
    expect(isClozeEligible({ it: 'credere', ex: 'ha creduto in lui' })).toBe(false);
  });
});

describe('makeCloze — inflected forms', () => {
  it('blanks the inflected form when the headword is not literal', () => {
    // "credere" does not appear in "ha creduto in lui" — before `form` existed
    // this card was silently dropped from cloze practice.
    expect(makeCloze('credere', 'ha creduto in lui')).toBe(null);
    const c = makeCloze('credere', 'ha creduto in lui', 'ha creduto');
    expect(c).toEqual({ before: '', answer: 'ha creduto', after: ' in lui' });
  });

  it('prefers the form over the headword when both would match', () => {
    expect(makeCloze('la pecora', 'conosce le mie pecore', 'pecore').answer).toBe('pecore');
  });

  it('ignores a form that is not in the example', () => {
    expect(makeCloze('la luce', 'La luce splende', 'nonsense').answer).toBe('luce');
  });

  it('isClozeEligible reads the card form', () => {
    expect(isClozeEligible({ it: 'credere', ex: 'ha creduto in lui' })).toBe(false);
    expect(isClozeEligible({ it: 'credere', ex: 'ha creduto in lui', form: 'ha creduto' })).toBe(true);
  });
});
