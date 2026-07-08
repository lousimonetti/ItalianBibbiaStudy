import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import { tokenize, lookupWord } from './vocabIndex';
import { lookupCommon } from './it2en';

// Guards tap-to-translate coverage: every word a learner can tap in the
// course's connected text (writing prompts, vocab example sentences, reading
// passages) must resolve to an English gloss — either a vocab entry
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
});
