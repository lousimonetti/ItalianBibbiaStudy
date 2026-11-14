import { describe, it, expect } from 'vitest';
import { PRAISE, praiseFor, COMBO_MIN, nextCombo, soundFor } from './lessonFeedback';

describe('lessonFeedback', () => {
  it('cycles through the praise words by step position', () => {
    expect(praiseFor(0)).toBe('Giusto!');
    expect(praiseFor(PRAISE.length)).toBe('Giusto!');
    expect(new Set(PRAISE.map((_, i) => praiseFor(i))).size).toBe(PRAISE.length);
  });

  it('grows the run on a right first try and ends it on a miss or a retry', () => {
    expect(nextCombo(0, true)).toBe(1);
    expect(nextCombo(4, true)).toBe(5);
    expect(nextCombo(4, false)).toBe(0);
    expect(nextCombo(4, true, true)).toBe(0);
  });

  it('picks the sound from the run after the answer', () => {
    expect(soundFor(false, 0)).toBe('wrong');
    expect(soundFor(true, 1)).toBe('correct');
    expect(soundFor(true, COMBO_MIN)).toBe('combo');
    expect(soundFor(true, COMBO_MIN + 1)).toBe('correct');
    expect(soundFor(true, COMBO_MIN * 2)).toBe('combo');
  });
});
