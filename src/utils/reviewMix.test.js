import { describe, it, expect } from 'vitest';
import { styleFor, mixStyles } from './reviewMix';

const clozable = { it: 'la luce', en: 'the light', ex: 'La luce splende nelle tenebre.' };
const notClozable = { it: 'credere', en: 'to believe', ex: 'Ha creduto in lui.' };

describe('styleFor', () => {
  it('shows new and barely-seen cards as recognition', () => {
    expect(styleFor(clozable, undefined)).toBe('recognition');
    expect(styleFor(clozable, { reps: 1, relearn: null })).toBe('recognition');
  });

  it('steps a lapsed card back to recognition while it relearns', () => {
    expect(styleFor(clozable, { reps: 0, relearn: 0 })).toBe('recognition');
    expect(styleFor(clozable, { reps: 5, relearn: 1 })).toBe('recognition');
  });

  it('moves to cloze after a couple of successes, when the example allows', () => {
    expect(styleFor(clozable, { reps: 2, relearn: null })).toBe('cloze');
    expect(styleFor(clozable, { reps: 3 })).toBe('cloze');
    expect(styleFor(notClozable, { reps: 2, relearn: null })).toBe('recall');
  });

  it('asks established cards for full recall', () => {
    expect(styleFor(clozable, { reps: 4, relearn: null })).toBe('recall');
    expect(styleFor(clozable, { reps: 12, relearn: null })).toBe('recall');
  });
});

describe('mixStyles', () => {
  it('maps each card through its own state', () => {
    const store = { 'la luce': { reps: 2, relearn: null } };
    expect(mixStyles([clozable, notClozable], store)).toEqual(['cloze', 'recognition']);
  });
});
