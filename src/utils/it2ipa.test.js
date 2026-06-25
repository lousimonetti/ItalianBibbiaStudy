import { describe, it, expect } from 'vitest';
import { toIPA } from './it2ipa';

describe('toIPA', () => {
  it('returns empty for empty input', () => {
    expect(toIPA('')).toBe('');
    expect(toIPA('   ')).toBe('');
    expect(toIPA(null)).toBe('');
  });

  it('transcribes simple penultimate-stress words', () => {
    expect(toIPA('cane')).toBe('/ˈkane/');
    expect(toIPA('mano')).toBe('/ˈmano/');
    expect(toIPA('vino')).toBe('/ˈvino/');
    expect(toIPA('pane')).toBe('/ˈpane/');
    expect(toIPA('amore')).toBe('/aˈmore/');
    expect(toIPA('lavoro')).toBe('/laˈvoro/');
  });

  it('voices intervocalic s', () => {
    expect(toIPA('casa')).toBe('/ˈkaza/');
    // word-initial s stays voiceless
    expect(toIPA('sole')).toBe('/ˈsole/');
  });

  it('honors accent marks for stress and vowel quality', () => {
    expect(toIPA('perché')).toBe('/perˈke/');
    expect(toIPA('città')).toBe('/tʃiˈtːa/');
  });

  it('handles soft c/g before front vowels', () => {
    expect(toIPA('cena')).toBe('/ˈtʃena/');
    expect(toIPA('gente')).toBe('/ˈdʒente/');
    expect(toIPA('ciao')).toBe('/ˈtʃao/');
    expect(toIPA('gioco')).toBe('/ˈdʒoko/');
  });

  it('handles gn / gli / cch digraphs and geminates', () => {
    expect(toIPA('gnocchi')).toBe('/ˈɲokːi/');
    expect(toIPA('figli')).toBe('/ˈfiʎi/');
  });

  it('treats ch / gh as hard k / g', () => {
    expect(toIPA('chiave')).toBe('/kiˈave/');
    expect(toIPA('ghiro')).toBe('/ˈgiro/');
  });

  it('is silent on h', () => {
    expect(toIPA('ho')).toBe('/ˈo/');
  });
});
