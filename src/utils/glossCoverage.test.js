import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import { tokenize, lookupWord } from './vocabIndex';
import { lookupCommon } from './it2en';
import { devotionSections } from '../../course/devotions';
import { rosary } from '../../course/rosary';
import { announcement } from './rosary';

// Guards tap-to-translate coverage: every word a learner can tap in the
// course's connected text (writing prompts, vocab example sentences, reading
// passages, devotional texts) must resolve to an English gloss — either a vocab entry
// (lookupWord) or the common-words dictionary (lookupCommon). This is what
// makes WordGloss show a translation instead of only approximate IPA.
// If this fails after authoring new course text, add the missing words to
// src/utils/it2en.js.

function unglossed(text) {
  const missing = [];
  for (const tok of tokenize(text || '')) {
    if (!tok.isWord) continue;
    if (!lookupWord(tok.text) && !lookupCommon(tok.text)) missing.push(tok.text);
  }
  return missing;
}

describe('gloss coverage of course text', () => {
  const weeks = PHASES.flatMap((p) => p.weeks);

  it('covers every word in the writing prompts', () => {
    const missing = weeks.flatMap((w) => unglossed(w.prompt?.it).map((word) => `w${w.n}: ${word}`));
    expect(missing).toEqual([]);
  });

  it('covers every word in the vocab example sentences', () => {
    const missing = weeks.flatMap((w) =>
      w.vocab.flatMap(([, , ex]) => unglossed(ex).map((word) => `w${w.n}: ${word}`)));
    expect(missing).toEqual([]);
  });

  it('covers every word in the reading passages', () => {
    const missing = weeks.flatMap((w) =>
      (w.passage?.verses || []).flatMap((v) => unglossed(v.t).map((word) => `w${w.n}: ${word}`)));
    expect(missing).toEqual([]);
  });

  // The Prayers tab renders both the whole text (fallback view) and the
  // line-aligned version through WordGloss, so both must be covered.
  it('covers every word in the devotional texts', () => {
    const prayers = devotionSections.flatMap((s) => s.prayers);
    const missing = prayers.flatMap((p) =>
      [p.it, ...(p.lines || []).map((l) => l.it)]
        .flatMap((t) => unglossed(t).map((word) => `${p.id}: ${word}`)));
    expect(missing).toEqual([]);
  });

  // The Rosario tab announces each mystery through WordGloss.
  it('covers every word in the Rosary announcements', () => {
    const missing = (rosary?.sets ?? []).flatMap((set) =>
      [...set.mysteries.map((_, i) => announcement(set, i)), ...rosary.virtues.map((v) => `Per la ${v.it}`)]
        .flatMap((t) => unglossed(t).map((word) => `${set.id}: ${word}`)));
    expect(missing).toEqual([]);
  });
});
