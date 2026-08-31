import { describe, it, expect } from 'vitest';
import {
  filterVoicesForLang,
  resolveVoice,
  voiceQualityRank,
  dedupeVoicesByName,
} from './voicePreference';

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

// The exact list macOS/iOS Safari returns for Italian (captured from a real
// device 2026-08-31): one voice, two compression tiers, identical names.
const SAFARI_IT = [
  { name: 'Alice', lang: 'it-IT', voiceURI: 'com.apple.voice.compact.it-IT.Alice' },
  { name: 'Alice', lang: 'it-IT', voiceURI: 'com.apple.voice.super-compact.it-IT.Alice' },
];

describe('voiceQualityRank', () => {
  it('ranks Apple tiers premium > enhanced > compact > super-compact', () => {
    const premium = voiceQualityRank('com.apple.voice.premium.it-IT.Emma');
    const enhanced = voiceQualityRank('com.apple.voice.enhanced.it-IT.Luca');
    const compact = voiceQualityRank('com.apple.voice.compact.it-IT.Alice');
    const superCompact = voiceQualityRank('com.apple.voice.super-compact.it-IT.Alice');
    expect(premium).toBeGreaterThan(enhanced);
    expect(enhanced).toBeGreaterThan(compact);
    expect(compact).toBeGreaterThan(superCompact);
  });

  it('does not read "super-compact" as "compact"', () => {
    expect(voiceQualityRank('com.apple.voice.super-compact.it-IT.Alice'))
      .toBeLessThan(voiceQualityRank('com.apple.voice.compact.it-IT.Alice'));
  });

  it('returns 0 for engines that encode no tier', () => {
    expect(voiceQualityRank('Google italiano')).toBe(0);
    expect(voiceQualityRank(undefined)).toBe(0);
  });
});

describe('dedupeVoicesByName', () => {
  it("collapses Safari's two Alice tiers to the better one", () => {
    const out = dedupeVoicesByName(SAFARI_IT);
    expect(out).toHaveLength(1);
    expect(out[0].voiceURI).toBe('com.apple.voice.compact.it-IT.Alice');
  });

  it('leaves the picker hidden in Safari (fewer than 2 choices)', () => {
    expect(dedupeVoicesByName(filterVoicesForLang(SAFARI_IT, 'it-IT')).length)
      .toBeLessThan(2);
  });

  it('keeps genuinely distinct voices, as Chrome reports them', () => {
    const out = dedupeVoicesByName(filterVoicesForLang(VOICES, 'it-IT'));
    expect(out.map((v) => v.name)).toEqual([
      'Alice',
      'Google italiano',
      'Italiano base',
      'Italiano underscore',
    ]);
  });

  it('prefers the higher tier regardless of list order', () => {
    const reversed = [...SAFARI_IT].reverse();
    expect(dedupeVoicesByName(reversed)[0].voiceURI)
      .toBe('com.apple.voice.compact.it-IT.Alice');
  });

  it('treats the same name in different languages as different voices', () => {
    const out = dedupeVoicesByName([
      { name: 'Alice', lang: 'it-IT', voiceURI: 'a-it' },
      { name: 'Alice', lang: 'en-US', voiceURI: 'a-en' },
    ]);
    expect(out).toHaveLength(2);
  });

  it('preserves order and handles empty / missing input', () => {
    expect(dedupeVoicesByName([])).toEqual([]);
    expect(dedupeVoicesByName(undefined)).toEqual([]);
    expect(dedupeVoicesByName([null])).toEqual([]);
  });

  it('still resolves a stored URI for a tier that was deduped away', () => {
    // getSelectedVoice() resolves against the raw browser list, not the deduped
    // one, so a previously-saved super-compact choice keeps working.
    expect(resolveVoice(SAFARI_IT, 'com.apple.voice.super-compact.it-IT.Alice'))
      .not.toBeNull();
  });
});
