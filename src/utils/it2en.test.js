import { describe, it, expect } from 'vitest';
import { lookupCommon } from './it2en.js';

describe('lookupCommon', () => {
  it('returns null for empty / falsy input', () => {
    expect(lookupCommon('')).toBeNull();
    expect(lookupCommon(null)).toBeNull();
    expect(lookupCommon(undefined)).toBeNull();
  });

  it('translates articles', () => {
    expect(lookupCommon('il')).toBe('the');
    expect(lookupCommon('la')).toBe('the');
    expect(lookupCommon('i')).toBe('the');
  });

  it('translates contracted prepositions', () => {
    expect(lookupCommon('del')).toBe('of the');
    expect(lookupCommon('nella')).toBe('in the');
    expect(lookupCommon('alla')).toBe('at the');
    expect(lookupCommon('dal')).toBe('from the');
  });

  it('translates common conjunctions', () => {
    expect(lookupCommon('e')).toBe('and');
    expect(lookupCommon('ma')).toBe('but');
    expect(lookupCommon('che')).toBe('that');
    expect(lookupCommon('quando')).toBe('when');
  });

  it('translates personal pronouns', () => {
    expect(lookupCommon('io')).toBe('I');
    expect(lookupCommon('lui')).toBe('he');
    expect(lookupCommon('noi')).toBe('we');
  });

  it('translates essere forms', () => {
    expect(lookupCommon('è')).toBe('is');
    expect(lookupCommon('era')).toBe('was');
    expect(lookupCommon('fu')).toBe('was');
    expect(lookupCommon('sono')).toBe('am/are');
  });

  it('translates avere forms', () => {
    expect(lookupCommon('ho')).toBe('I have');
    expect(lookupCommon('ha')).toBe('has');
    expect(lookupCommon('aveva')).toBe('had');
  });

  it('translates common verbs', () => {
    expect(lookupCommon('disse')).toBe('said');
    expect(lookupCommon('venne')).toBe('came');
    expect(lookupCommon('vide')).toBe('saw');
    expect(lookupCommon('andò')).toBe('went');
  });

  it('is case-insensitive', () => {
    expect(lookupCommon('IL')).toBe('the');
    expect(lookupCommon('Disse')).toBe('said');
    expect(lookupCommon('ERA')).toBe('was');
  });

  it('translates biblical nouns', () => {
    expect(lookupCommon('peccato')).toBe('sin');
    expect(lookupCommon('grazia')).toBe('grace');
    expect(lookupCommon('pace')).toBe('peace');
    expect(lookupCommon('salvezza')).toBe('salvation');
    expect(lookupCommon('discepoli')).toBe('disciples');
  });

  it('translates proper biblical names', () => {
    expect(lookupCommon('gesù')).toBe('Jesus');
    expect(lookupCommon('Gesù')).toBe('Jesus');
    expect(lookupCommon('giovanni')).toBe('John');
    expect(lookupCommon('Pietro')).toBe('Peter');
  });

  it('returns null for unknown words', () => {
    expect(lookupCommon('xyzzy')).toBeNull();
    expect(lookupCommon('magnificare')).toBeNull();
  });
});
