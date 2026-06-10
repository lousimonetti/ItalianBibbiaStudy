import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJournal } from './useJournal.js';

const STORAGE_KEY = 'italian-bible-journal';

const MOCK_PHASES = [
  {
    title: 'Phase 1: Foundation',
    weeks: [
      { n: 1, r: 'John 1-2', d: 'Apr 13-19' },
      { n: 2, r: 'John 3-4', d: 'Apr 20-26' },
    ],
  },
  {
    title: 'Phase 2: Narrative',
    weeks: [
      { n: 9, r: 'Luke 1-2', d: 'Jun 8-14' },
    ],
  },
];

beforeEach(() => {
  localStorage.clear();
});

describe('useJournal — initial state', () => {
  it('starts with no entries', () => {
    const { result } = renderHook(() => useJournal());
    expect(result.current.entries).toEqual({});
  });

  it('starts with wordCount of 0', () => {
    const { result } = renderHook(() => useJournal());
    expect(result.current.wordCount).toBe(0);
  });

  it('starts with weekCount of 0', () => {
    const { result } = renderHook(() => useJournal());
    expect(result.current.weekCount).toBe(0);
  });
});

describe('useJournal — setEntry', () => {
  it('saves a text entry with a timestamp', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'Ho imparato molto questa settimana.'));
    expect(result.current.entries[1].text).toBe('Ho imparato molto questa settimana.');
    expect(result.current.entries[1].updatedAt).toBeTruthy();
  });

  it('stores a valid ISO timestamp', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'Test'));
    expect(new Date(result.current.entries[1].updatedAt).toISOString()).toBe(
      result.current.entries[1].updatedAt
    );
  });

  it('updates an existing entry', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'First draft'));
    act(() => result.current.setEntry(1, 'Revised entry'));
    expect(result.current.entries[1].text).toBe('Revised entry');
  });

  it('can hold entries for multiple weeks', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'Week one'));
    act(() => result.current.setEntry(5, 'Week five'));
    expect(Object.keys(result.current.entries)).toHaveLength(2);
  });
});

describe('useJournal — wordCount', () => {
  it('counts words across all entries', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'uno due tre'));  // 3 words
    act(() => result.current.setEntry(2, 'quattro cinque')); // 2 words
    expect(result.current.wordCount).toBe(5);
  });

  it('ignores entries with only whitespace', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, '   '));
    expect(result.current.wordCount).toBe(0);
  });

  it('counts Italian text with accented words correctly', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'Gesù è il Salvatore'));
    expect(result.current.wordCount).toBe(4);
  });
});

describe('useJournal — weekCount', () => {
  it('counts only weeks with non-empty text', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'Has content'));
    act(() => result.current.setEntry(2, '   ')); // whitespace only
    act(() => result.current.setEntry(3, 'Also has content'));
    expect(result.current.weekCount).toBe(2);
  });

  it('returns 0 when all entries are blank', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, ''));
    expect(result.current.weekCount).toBe(0);
  });
});

describe('useJournal — localStorage persistence', () => {
  it('persists entries to localStorage on setEntry', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'Saved text'));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored[1].text).toBe('Saved text');
  });

  it('loads existing entries from localStorage on mount', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ 3: { text: 'Pre-existing', updatedAt: '2026-04-15T10:00:00.000Z' } })
    );
    const { result } = renderHook(() => useJournal());
    expect(result.current.entries[3].text).toBe('Pre-existing');
    expect(result.current.weekCount).toBe(1);
  });

  it('falls back to empty state on corrupted localStorage', () => {
    localStorage.setItem(STORAGE_KEY, '}{invalid');
    const { result } = renderHook(() => useJournal());
    expect(result.current.entries).toEqual({});
  });
});

describe('useJournal — exportMarkdown', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('creates a download anchor with the correct filename', () => {
    // Render the hook BEFORE mocking createElement so React's internal DOM
    // setup is unaffected; then intercept only the anchor creation.
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'My entry'));

    const mockAnchor = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
    act(() => result.current.exportMarkdown(MOCK_PHASES));

    expect(mockAnchor.download).toBe('italian-bible-journal.md');
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it('uses the object URL as the anchor href', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'My entry'));

    const mockAnchor = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
    act(() => result.current.exportMarkdown(MOCK_PHASES));

    expect(mockAnchor.href).toBe('blob:mock-url');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('includes the document title in the generated content', () => {
    const { result } = renderHook(() => useJournal());
    act(() => result.current.setEntry(1, 'My week one entry'));

    let capturedBlob;
    const OriginalBlob = global.Blob;
    global.Blob = class {
      constructor(parts, opts) { capturedBlob = parts[0]; return new OriginalBlob(parts, opts); }
    };
    const mockAnchor = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
    act(() => result.current.exportMarkdown(MOCK_PHASES));
    global.Blob = OriginalBlob;

    expect(capturedBlob).toContain('# Italian Bible Study — Journal');
    expect(capturedBlob).toContain('My week one entry');
    expect(capturedBlob).toContain('Phase 1: Foundation');
  });

  it('omits weeks with no entry from the export', () => {
    const { result } = renderHook(() => useJournal());
    // Only write an entry for week 2, leave week 1 and 9 empty
    act(() => result.current.setEntry(2, 'Week two notes'));

    let capturedBlob;
    const OriginalBlob = global.Blob;
    global.Blob = class {
      constructor(parts, opts) { capturedBlob = parts[0]; return new OriginalBlob(parts, opts); }
    };
    const mockAnchor = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
    act(() => result.current.exportMarkdown(MOCK_PHASES));
    global.Blob = OriginalBlob;

    expect(capturedBlob).toContain('Week two notes');
    expect(capturedBlob).not.toContain('Week 1 —');
  });
});
