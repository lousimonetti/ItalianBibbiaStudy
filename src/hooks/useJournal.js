import { useState, useCallback } from 'react';

const STORAGE_KEY = 'italian-bible-journal';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function useJournal() {
  const [entries, setEntries] = useState(load);

  const setEntry = useCallback((weekNum, text) => {
    setEntries((prev) => {
      const next = {
        ...prev,
        [weekNum]: {
          text,
          updatedAt: new Date().toISOString(),
        },
      };
      save(next);
      return next;
    });
  }, []);

  const exportMarkdown = useCallback((phases) => {
    const lines = ['# Italian Bible Study — Journal\n'];
    for (const phase of phases) {
      lines.push(`## ${phase.title}\n`);
      for (const week of phase.weeks) {
        const entry = entries[week.n];
        if (entry?.text?.trim()) {
          lines.push(`### Week ${week.n} — ${week.r}`);
          lines.push(`*${week.d}*\n`);
          lines.push(entry.text.trim());
          lines.push('');
        }
      }
    }
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'italian-bible-journal.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  const wordCount = Object.values(entries).reduce((sum, e) => {
    return sum + (e?.text?.trim().split(/\s+/).filter(Boolean).length ?? 0);
  }, 0);

  const weekCount = Object.values(entries).filter((e) => e?.text?.trim()).length;

  return { entries, setEntry, exportMarkdown, wordCount, weekCount };
}
