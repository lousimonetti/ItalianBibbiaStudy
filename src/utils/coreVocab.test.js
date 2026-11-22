import { describe, it, expect } from 'vitest';
import { CORE_VOCAB, CORE_DOMAINS } from '../../course/core';
import { PHASES } from '../data/studyData';
import { CORE_CARDS, COURSE_CARDS, deckOf } from './decks';
import { makeCloze } from './cloze';
import { LEADING_ARTICLE } from './locale';

// Guards the everyday core deck (courses/it-bible-cei/coreVocab.js).
const LETTER = /[a-zà-ÿ]/i;
const bare = (t) => t.toLowerCase().replace(LEADING_ARTICLE, '').trim();

describe('core vocabulary data', () => {
  it('ships a deck of several hundred words', () => {
    expect(CORE_VOCAB.length).toBeGreaterThanOrEqual(400);
  });

  it('gives every row a meaning, an example, its translation and a known domain', () => {
    const bad = CORE_CARDS.filter((c) => !c.it || !c.en || !c.ex || !c.exEn || !CORE_DOMAINS[c.domain]);
    expect(bad.map((c) => c.it)).toEqual([]);
  });

  it('never repeats a term inside the deck', () => {
    const seen = new Set();
    const dupes = [];
    for (const c of CORE_CARDS) {
      const k = c.it.toLowerCase();
      if (seen.has(k)) dupes.push(c.it);
      seen.add(k);
    }
    expect(dupes).toEqual([]);
  });

  // Both decks share one SRS store keyed by term, so a shared term would make
  // one card's reviews schedule the other.
  it('never repeats a course vocab term, in any case or without its article', () => {
    const course = new Set(PHASES.flatMap((p) => p.weeks.flatMap((w) => w.vocab.map(([t]) => t.toLowerCase()))));
    const courseBare = new Set(COURSE_CARDS.map((c) => bare(c.it)));
    const clash = CORE_CARDS.filter((c) => course.has(c.it.toLowerCase()) || courseBare.has(bare(c.it)));
    expect(clash.map((c) => c.it)).toEqual([]);
  });

  it('puts the form it names inside its own example', () => {
    const bad = CORE_CARDS.filter((c) => c.form && !c.ex.toLowerCase().includes(c.form.toLowerCase()));
    expect(bad.map((c) => c.it)).toEqual([]);
  });

  // makeCloze blanks the first substring match. For short function words that
  // could land inside another word ("in" inside "macchina"), so every example
  // is written so the first match is the whole word.
  it('blanks a whole word in every cloze', () => {
    const bad = [];
    for (const c of CORE_CARDS) {
      const cl = makeCloze(c.it, c.ex, c.form);
      if (!cl) {
        if (bare(c.form || c.it).length >= 2) bad.push(`${c.it}: not cloze-eligible`);
        continue;
      }
      const before = cl.before.slice(-1);
      const after = cl.after.slice(0, 1);
      if (LETTER.test(before) || LETTER.test(after)) bad.push(`${c.it}: ${cl.before}[${cl.answer}]${cl.after}`);
    }
    expect(bad).toEqual([]);
  });

  it('labels its computed IPA as approximate', () => {
    expect(CORE_CARDS.every((c) => !c.ipa || c.ipaApprox)).toBe(true);
  });
});

describe('deckOf', () => {
  it('knows course words, core words and their example forms', () => {
    expect(deckOf('luce')).toBe('course');
    expect(deckOf('finestra')).toBe('core');
    expect(deckOf('vado')).toBe('core');
    expect(deckOf('ombrellone')).toBeNull();
  });
});
