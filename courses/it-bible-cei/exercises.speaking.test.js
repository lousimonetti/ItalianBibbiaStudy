import { describe, it, expect } from 'vitest';
import { EXERCISES } from './exercises.js';
import { weekPhrases } from '../../src/utils/chunks.js';
import { transformItems, checkTransform } from '../../src/utils/transformDrill.js';
import { questionItems, matchesSpoken } from '../../src/utils/spokenAnswer.js';

const weeks = Object.keys(EXERCISES).map(Number).sort((a, b) => a - b);

describe('speaking layer authored data (P3)', () => {
  it('covers all 37 weeks with phrases, transform, and questions', () => {
    expect(weeks).toHaveLength(37);
    for (const n of weeks) {
      const w = EXERCISES[n];
      expect(weekPhrases(w).length, `week ${n} phrases`).toBeGreaterThanOrEqual(2);
      expect(transformItems(w).length, `week ${n} transform`).toBeGreaterThanOrEqual(2);
      expect(questionItems(w).length, `week ${n} questions`).toBeGreaterThanOrEqual(2);
    }
  });

  it('every transform answer passes its own exact-form checker', () => {
    for (const n of weeks) {
      for (const t of transformItems(EXERCISES[n])) {
        expect(checkTransform(t, t.answer).correct, `week ${n}: "${t.instruction}" / "${t.answer}"`).toBe(true);
        // The base sentence should NOT already satisfy the target (else the
        // transformation is a no-op / mis-authored).
        expect(checkTransform(t, t.base).correct, `week ${n}: base equals answer for "${t.instruction}"`).toBe(false);
      }
    }
  });

  it('every question is satisfied by its own model or first acceptable answer', () => {
    for (const n of weeks) {
      for (const q of questionItems(EXERCISES[n])) {
        const probe = q.model || q.answers[0];
        expect(matchesSpoken(q, probe), `week ${n}: "${q.q}" not matched by its model/answer`).toBe(true);
      }
    }
  });

  it('phrase lit glosses, when present, are non-empty strings', () => {
    for (const n of weeks) {
      for (const p of weekPhrases(EXERCISES[n])) {
        if ('lit' in p && p.lit !== undefined) {
          expect(typeof p.lit === 'string' && p.lit.trim().length > 0, `week ${n}: "${p.it}"`).toBe(true);
        }
      }
    }
  });
});
