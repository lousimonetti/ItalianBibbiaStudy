import { describe, it, expect } from 'vitest';
import { filterVoicesForLang, resolveVoice } from './voicePreference';

const VOICES = [
  { name: 'Alice', lang: 'it-IT', voiceURI: 'Alice' },
  { name: 'Google italiano', lang: 'it-IT', voiceURI: 'Google italiano' },
  { name: 'Italiano base', lang: 'it', voiceURI: 'it-base' },
  { name: 'Italiano underscore', lang: 'it_IT', voiceURI: 'it-underscore' },
  { name: 'Samantha', lang: 'en-US', voiceURI: 'Samantha' },
  { name: 'No lang', voiceURI: 'nolang' },
];

describe('filterVoicesForLang', () => {
  it('keeps only voices matching the locale base language', () => {
    const out = filterVoicesForLang(VOICES, 'it-IT');
    expect(out.map((v) => v.voiceURI)).toEqual([
      'Alice',
      'Google italiano',
      'it-base',
      'it-underscore',
    ]);
  });

  it('excludes other languages', () => {
    const out = filterVoicesForLang(VOICES, 'it-IT');
    expect(out.some((v) => v.voiceURI === 'Samantha')).toBe(false);
  });

  it('is case-insensitive on the base language', () => {
    expect(filterVoicesForLang(VOICES, 'IT-it')).toHaveLength(4);
  });

  it('handles empty / missing input gracefully', () => {
    expect(filterVoicesForLang([], 'it-IT')).toEqual([]);
    expect(filterVoicesForLang(undefined, 'it-IT')).toEqual([]);
    expect(filterVoicesForLang(VOICES, '')).toEqual([]);
  });

  it('does not match a different language that shares a prefix region', () => {
    const out = filterVoicesForLang([{ name: 'x', lang: 'ita', voiceURI: 'x' }], 'it-IT');
    expect(out).toEqual([]);
  });
});

describe('resolveVoice', () => {
  it('finds a voice by voiceURI', () => {
    expect(resolveVoice(VOICES, 'Alice').name).toBe('Alice');
  });

  it('returns null for an unknown or empty uri', () => {
    expect(resolveVoice(VOICES, 'missing')).toBeNull();
    expect(resolveVoice(VOICES, '')).toBeNull();
    expect(resolveVoice(VOICES, undefined)).toBeNull();
  });
});
