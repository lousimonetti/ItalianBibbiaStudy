import { describe, it, expect } from 'vitest';
import { comprehensionItems, isValidItem, isCorrect } from './comprehension';

describe('isValidItem', () => {
  it('accepts a well-formed true/false item', () => {
    expect(isValidItem({ type: 'tf', it: 'La luce splende.', answer: true })).toBe(true);
  });
  it('accepts a well-formed multiple-choice item', () => {
    expect(isValidItem({ type: 'mc', it: 'Chi?', options: ['a', 'b'], answer: 1 })).toBe(true);
  });
  it('rejects mc with out-of-range answer', () => {
    expect(isValidItem({ type: 'mc', it: 'Chi?', options: ['a', 'b'], answer: 5 })).toBe(false);
  });
  it('rejects tf with non-boolean answer', () => {
    expect(isValidItem({ type: 'tf', it: 'x', answer: 'yes' })).toBe(false);
  });
  it('rejects empty question', () => {
    expect(isValidItem({ type: 'tf', it: '  ', answer: true })).toBe(false);
  });
});

describe('comprehensionItems', () => {
  it('filters to valid items', () => {
    const week = {
      comprehension: [
        { type: 'tf', it: 'ok', answer: false },
        { type: 'mc', it: 'bad', options: ['only one'], answer: 0 },
        { type: 'xx', it: 'unknown', answer: true },
      ],
    };
    expect(comprehensionItems(week).length).toBe(1);
  });
  it('returns [] when absent', () => {
    expect(comprehensionItems({})).toEqual([]);
  });
});

describe('isCorrect', () => {
  it('checks tf responses', () => {
    const item = { type: 'tf', it: 'x', answer: true };
    expect(isCorrect(item, true)).toBe(true);
    expect(isCorrect(item, false)).toBe(false);
  });
  it('checks mc responses', () => {
    const item = { type: 'mc', it: 'x', options: ['a', 'b', 'c'], answer: 2 };
    expect(isCorrect(item, 2)).toBe(true);
    expect(isCorrect(item, 0)).toBe(false);
  });
});
