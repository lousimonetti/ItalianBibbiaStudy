import { describe, it, expect } from 'vitest';
import { cleanReply, flushBuffer, pushDelta } from './sentenceStream';
import { splitSentences } from './keyVerses';

function feed(deltas) {
  let buffer = '';
  const out = [];
  for (const d of deltas) {
    const r = pushDelta(buffer, d);
    out.push(...r.sentences);
    buffer = r.buffer;
  }
  return [...out, ...flushBuffer(buffer)];
}

describe('pushDelta', () => {
  it('releases a sentence as soon as it is complete', () => {
    const first = pushDelta('', 'Sì, è vero. Che cosa ');
    expect(first.sentences).toEqual(['Sì, è vero.']);
    expect(first.buffer).toBe('Che cosa ');
  });

  it('holds a sentence until whitespace confirms it has ended', () => {
    expect(pushDelta('', 'Bene.').sentences).toEqual([]);
    expect(pushDelta('Bene.', ' Ora').sentences).toEqual(['Bene.']);
  });

  it('gives the same sentences however the text is chopped up', () => {
    const text = 'La luce splende! Che cosa pensi? Dimmi; ti ascolto.';
    const whole = feed([text]);
    expect(whole).toEqual(splitSentences(text));
    expect(feed(Array.from(text))).toEqual(whole);
    expect(feed(text.match(/.{1,5}/gs))).toEqual(whole);
  });

  it('does not split on a mark without a following space', () => {
    expect(feed(['Giovanni 1,1.5 e poi.'])).toEqual(['Giovanni 1,1.5 e poi.']);
  });

  it('collapses repeated whitespace and newlines between sentences', () => {
    expect(feed(['Primo.\n\n  Secondo.'])).toEqual(['Primo.', 'Secondo.']);
  });

  it('keeps accents and multi-byte characters whole', () => {
    expect(feed(['Sì, è così. Perché?'])).toEqual(['Sì, è così.', 'Perché?']);
  });
});

describe('flushBuffer', () => {
  it('returns an unterminated reply', () => {
    expect(flushBuffer('Che cosa pensi')).toEqual(['Che cosa pensi']);
  });

  it('returns nothing for an empty or letterless tail', () => {
    expect(flushBuffer('')).toEqual([]);
    expect(flushBuffer('  ... ')).toEqual([]);
  });
});

describe('cleanReply', () => {
  it('strips markdown a voice would read out', () => {
    expect(cleanReply('**Bene!** Questa è la `parola`.')).toBe('Bene! Questa è la parola.');
    expect(cleanReply('# Titolo')).toBe('Titolo');
    expect(cleanReply('- primo\n- secondo')).toBe('primo secondo');
    expect(cleanReply('1. primo')).toBe('primo');
  });

  it('leaves ordinary text and apostrophes alone', () => {
    expect(cleanReply("Va' e anche tu fa' così.")).toBe("Va' e anche tu fa' così.");
  });

  it('handles nothing at all', () => {
    expect(cleanReply(null)).toBe('');
  });
});
