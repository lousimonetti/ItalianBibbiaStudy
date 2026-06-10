import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from './useProgress.js';

const STORAGE_KEY = 'italian-bible-progress';

beforeEach(() => {
  localStorage.clear();
});

describe('useProgress — initial state', () => {
  it('starts with no weeks checked', () => {
    const { result } = renderHook(() => useProgress(37));
    expect(result.current.checked).toEqual({});
  });

  it('starts with doneCount of 0', () => {
    const { result } = renderHook(() => useProgress(37));
    expect(result.current.doneCount).toBe(0);
  });

  it('starts with pct of 0', () => {
    const { result } = renderHook(() => useProgress(37));
    expect(result.current.pct).toBe(0);
  });

  it('returns pct 0 when total is 0', () => {
    const { result } = renderHook(() => useProgress(0));
    expect(result.current.pct).toBe(0);
  });
});

describe('useProgress — toggle', () => {
  it('marks a week as done when toggled', () => {
    const { result } = renderHook(() => useProgress(37));
    act(() => result.current.toggle(1));
    expect(result.current.checked[1]).toBe(true);
  });

  it('unmarks a week when toggled twice', () => {
    const { result } = renderHook(() => useProgress(37));
    act(() => result.current.toggle(1));
    act(() => result.current.toggle(1));
    expect(result.current.checked[1]).toBe(false);
  });

  it('updates doneCount when a week is toggled', () => {
    const { result } = renderHook(() => useProgress(37));
    act(() => result.current.toggle(1));
    expect(result.current.doneCount).toBe(1);
    act(() => result.current.toggle(5));
    expect(result.current.doneCount).toBe(2);
  });

  it('decrements doneCount when a week is untoggled', () => {
    const { result } = renderHook(() => useProgress(37));
    act(() => result.current.toggle(1));
    act(() => result.current.toggle(1));
    expect(result.current.doneCount).toBe(0);
  });

  it('calculates pct correctly for partial completion', () => {
    const { result } = renderHook(() => useProgress(4));
    act(() => result.current.toggle(1));
    // 1 of 4 = 25%
    expect(result.current.pct).toBe(25);
  });

  it('calculates pct as 100 when all weeks done', () => {
    const { result } = renderHook(() => useProgress(2));
    act(() => result.current.toggle(1));
    act(() => result.current.toggle(2));
    expect(result.current.pct).toBe(100);
  });
});

describe('useProgress — localStorage persistence', () => {
  it('persists progress to localStorage on toggle', () => {
    const { result } = renderHook(() => useProgress(37));
    act(() => result.current.toggle(3));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored[3]).toBe(true);
  });

  it('loads existing progress from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 5: true, 10: true }));
    const { result } = renderHook(() => useProgress(37));
    expect(result.current.checked[5]).toBe(true);
    expect(result.current.checked[10]).toBe(true);
    expect(result.current.doneCount).toBe(2);
  });

  it('falls back to empty state when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    const { result } = renderHook(() => useProgress(37));
    expect(result.current.checked).toEqual({});
    expect(result.current.doneCount).toBe(0);
  });

  it('degrades silently when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => useProgress(37));
    // Should not throw; toggle should still update in-memory state
    expect(() => act(() => result.current.toggle(1))).not.toThrow();
    expect(result.current.checked[1]).toBe(true);
  });
});
