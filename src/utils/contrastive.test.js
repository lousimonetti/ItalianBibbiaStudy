import { describe, it, expect } from 'vitest';
import {
  canonSentence,
  verdict,
  recordResult,
  accuracyFor,
  orderByWeakness,
} from './contrastive.js';
import { TRAPS, TRAP_CATEGORIES } from '../../courses/it-bible-cei/contrastive.js';

const piacere = {
  trap: 'piacere',
  en: 'I like the psalms',
  it: 'Mi piacciono i salmi',
  wrongs: ['io piaccio i salmi', 'mi piace i salmi'],
  note: '…',
};

const madre = {
  trap: 'possessivo',
  en: 'my mother',
  it: 'mia madre',
  wrongs: ['la mia madre'],
  note: '…',
};

describe('canonSentence', () => {
  it('folds case, accents, punctuation, and whitespace', () => {
    expect(canonSentence("  C'è   una GRANDE luce! ")).toBe('ce una grande luce');
    expect(canonSentence('perché?')).toBe('perche');
  });

  it('does NOT strip a leading article (unlike answer.js canonical)', () => {
    expect(canonSentence('la mia madre')).toBe('la mia madre');
  });
});

describe('verdict', () => {
  it('accepts the target, alternates, and small typos', () => {
    expect(verdict(piacere, 'Mi piacciono i salmi')).toBe('correct');
    expect(verdict(piacere, 'mi piacciono i salmi.')).toBe('correct');
    expect(verdict(piacere, 'mi piaciono i salmi')).toBe('correct'); // typo within tolerance
    const withAlt = { ...piacere, alt: ['i salmi mi piacciono'] };
    expect(verdict(withAlt, 'I salmi mi piacciono')).toBe('correct');
  });

  it('flags predicted interference forms as trap — even when they sit within typo distance of the correct answer', () => {
    // "mi piace i salmi" is 4 edits from "mi piacciono i salmi", inside the
    // 20% fuzz — the exact-wrong check must win.
    expect(verdict(piacere, 'mi piace i salmi')).toBe('trap');
    expect(verdict(piacere, 'Io piaccio i salmi!')).toBe('trap');
  });

  it('catches typo’d trap answers after the correct check', () => {
    expect(verdict(piacere, 'io piacio i salmi')).toBe('trap');
  });

  it('handles article-presence traps in both directions', () => {
    expect(verdict(madre, 'mia madre')).toBe('correct');
    expect(verdict(madre, 'la mia madre')).toBe('trap');
  });

  it('returns other for unpredicted wrong answers and empty for blank', () => {
    expect(verdict(piacere, 'amo i salmi')).toBe('other');
    expect(verdict(piacere, '   ')).toBe('empty');
    expect(verdict(piacere, '')).toBe('empty');
  });
});

describe('stats', () => {
  it('recordResult accumulates per category without mutating', () => {
    const s0 = {};
    const s1 = recordResult(s0, 'piacere', true);
    const s2 = recordResult(s1, 'piacere', false);
    expect(s0).toEqual({});
    expect(s2.piacere).toEqual({ attempts: 2, correct: 1 });
  });

  it('accuracyFor is null when never attempted', () => {
    expect(accuracyFor({}, 'piacere')).toBeNull();
    expect(accuracyFor(recordResult({}, 'aux', true), 'aux')).toBe(1);
  });

  it('orderByWeakness serves unseen categories first, then ascending accuracy', () => {
    const items = [
      { trap: 'strong', it: 'a' },
      { trap: 'weak', it: 'b' },
      { trap: 'unseen', it: 'c' },
    ];
    let store = {};
    store = recordResult(store, 'strong', true);
    store = recordResult(store, 'strong', true);
    store = recordResult(store, 'weak', false);
    const ordered = orderByWeakness(items, store, () => 0.5);
    expect(ordered.map((i) => i.trap)).toEqual(['unseen', 'weak', 'strong']);
  });
});

describe('TRAPS dataset', () => {
  it('has a substantial set of well-formed items', () => {
    expect(TRAPS.length).toBeGreaterThanOrEqual(50);
    for (const t of TRAPS) {
      expect(t.en, t.it).toBeTruthy();
      expect(t.it, t.en).toBeTruthy();
      expect(t.note, t.en).toBeTruthy();
      expect(Array.isArray(t.wrongs) && t.wrongs.length > 0, t.en).toBe(true);
      expect(TRAP_CATEGORIES[t.trap], `unknown category ${t.trap} (${t.en})`).toBeTruthy();
    }
  });

  it('every category label has Italian and English', () => {
    for (const [id, label] of Object.entries(TRAP_CATEGORIES)) {
      expect(label.it, id).toBeTruthy();
      expect(label.en, id).toBeTruthy();
    }
  });

  it('no predicted wrong canonically equals an accepted answer (verdict ordering relies on this)', () => {
    for (const t of TRAPS) {
      const accepted = [t.it, ...(t.alt ?? [])].map(canonSentence);
      for (const w of t.wrongs) {
        expect(accepted.includes(canonSentence(w)), `${t.en}: "${w}"`).toBe(false);
      }
    }
  });

  it('typing the exact correct answer never verdicts as trap', () => {
    for (const t of TRAPS) {
      expect(verdict(t, t.it), t.en).toBe('correct');
      for (const a of t.alt ?? []) expect(verdict(t, a), `${t.en} alt "${a}"`).toBe('correct');
    }
  });

  it('every predicted wrong verdicts as trap', () => {
    for (const t of TRAPS) {
      for (const w of t.wrongs) {
        expect(verdict(t, w), `${t.en}: "${w}"`).toBe('trap');
      }
    }
  });

  it('prompts are unique', () => {
    const ens = TRAPS.map((t) => t.en);
    expect(new Set(ens).size).toBe(ens.length);
  });
});
