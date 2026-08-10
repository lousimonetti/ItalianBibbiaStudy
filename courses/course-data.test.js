// Integrity checks over the bundled course data. These guard the invariants the
// pedagogy pass introduced — cheap to run, and a broken one means a learner sees
// a wrong translation or a cloze that can't be built.
import { describe, it, expect } from 'vitest';
import { phases } from './it-bible-cei/content.js';
import { devotionSections } from './it-bible-cei/devotions.js';
import { config } from './it-bible-cei/config.js';
import { validateCourse } from '../course/validate.js';
import { parseVocab } from '../course/vocab.js';
import { makeCloze } from '../src/utils/cloze.js';

const allWeeks = phases.flatMap((p) => p.weeks);
const allVocab = allWeeks.flatMap((w) => w.vocab.map(parseVocab));

describe('course validation', () => {
  it('passes the validator', () => {
    expect(validateCourse(config, phases)).toEqual([]);
  });
});

describe('vocab enrichment', () => {
  it('every entry has an example translation', () => {
    const missing = allVocab.filter((v) => !v.exEn).map((v) => v.it);
    expect(missing).toEqual([]);
  });

  it('every declared form actually occurs in its example', () => {
    const bad = allVocab
      .filter((v) => v.form && !v.ex.toLowerCase().includes(v.form.toLowerCase()))
      .map((v) => `${v.it} → ${v.form}`);
    expect(bad).toEqual([]);
  });

  it('keeps cloze coverage high — forms are what make conjugated examples usable', () => {
    const eligible = allVocab.filter((v) => makeCloze(v.it, v.ex, v.form) !== null);
    // Was 61% before inflected forms were recorded.
    expect(eligible.length / allVocab.length).toBeGreaterThan(0.8);
  });

  it('does not disturb the exercises merged onto weeks', () => {
    // content.js merges exercises.js onto each week; the enrichment pass edits
    // vocab tuples in the same file, so assert the merge still lands.
    expect(allWeeks.filter((w) => Array.isArray(w.drill)).length).toBeGreaterThan(0);
    expect(allWeeks.filter((w) => w.passage?.verses?.length).length).toBeGreaterThan(0);
  });
});

describe('exegesis notes', () => {
  it('each has a title and body, and well-formed forms', () => {
    const withNotes = allWeeks.filter((w) => w.exegesis);
    expect(withNotes.length).toBeGreaterThan(0);
    for (const w of withNotes) {
      expect(w.exegesis.title, `week ${w.n}`).toBeTruthy();
      expect(w.exegesis.body, `week ${w.n}`).toBeTruthy();
      for (const f of w.exegesis.forms || []) {
        expect(f.it, `week ${w.n} form`).toBeTruthy();
        expect(f.gloss, `week ${w.n} form`).toBeTruthy();
      }
    }
  });
});

describe('devotions', () => {
  it('line-by-line text reconstructs the full text exactly', () => {
    for (const s of devotionSections) {
      for (const p of s.prayers) {
        if (!p.lines) continue;
        const joined = p.lines.map((l) => l.it).join(' ').replace(/\s+/g, ' ').trim();
        expect(joined, p.id).toBe(p.it.replace(/\s+/g, ' ').trim());
      }
    }
  });

  it('every line has a translation', () => {
    for (const s of devotionSections) {
      for (const p of s.prayers) {
        for (const l of p.lines || []) expect(l.en, `${p.id}: ${l.it}`).toBeTruthy();
      }
    }
  });

  it('every authored blank occurs in its line', () => {
    for (const s of devotionSections) {
      for (const p of s.prayers) {
        for (const l of p.lines || []) {
          if (!l.blank) continue;
          expect(l.it.toLowerCase(), p.id).toContain(l.blank.toLowerCase());
        }
      }
    }
  });

  it('grammar cross-links point at real weeks', () => {
    const weekNumbers = new Set(allWeeks.map((w) => w.n));
    for (const s of devotionSections) {
      for (const p of s.prayers) {
        for (const n of p.focus?.weeks || []) {
          expect(weekNumbers.has(n), `${p.id} → week ${n}`).toBe(true);
        }
      }
    }
  });
});

describe('course guide', () => {
  it('supplies the prose the shared components used to hardcode', () => {
    expect(config.guide.sentencePatterns.length).toBeGreaterThan(0);
    expect(config.guide.journalStarters.length).toBeGreaterThan(0);
  });
});
