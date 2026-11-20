import { describe, it, expect, beforeEach } from 'vitest';
import {
  allWords, kidPrayers, listenRound, memoryBoard, flipCard, closeMiss, isFaceUp, boardDone,
  emptyKids, normalizeKids, markFound, addStars, setLocked, foundCount, loadKids, saveKids,
  KIDS_KEY, cheer, CHEERS,
} from './kids';
import { rngFor } from './gameRandom';
import { kids } from '../../courses/it-bible-cei/kids.js';
import { devotionSections } from '../../courses/it-bible-cei/devotions.js';

const WORDS = allWords(kids);

describe('course data', () => {
  it('every word has Italian, English and a picture', () => {
    for (const w of WORDS) {
      expect(w.it, JSON.stringify(w)).toBeTruthy();
      expect(w.en, JSON.stringify(w)).toBeTruthy();
      expect(w.pic, JSON.stringify(w)).toBeTruthy();
    }
  });

  it('word ids are unique across the whole corner (they key the album)', () => {
    const its = WORDS.map((w) => w.it);
    expect(new Set(its).size).toBe(its.length);
  });

  it('pictures are unique within a theme (several show at once)', () => {
    for (const t of kids.themes) {
      const pics = t.words.map((w) => w.pic);
      expect(new Set(pics).size, t.id).toBe(pics.length);
    }
  });

  it('every theme can fill a listening round and a memory board', () => {
    for (const t of kids.themes) {
      expect(t.words.length, t.id).toBeGreaterThanOrEqual(6);
    }
  });

  it('every listed prayer resolves to line-by-line text', () => {
    const resolved = kidPrayers(kids, devotionSections);
    expect(resolved.map((p) => p.id)).toEqual(kids.prayers);
  });
});

describe('kidPrayers', () => {
  it('skips unknown ids and prayers without lines', () => {
    const sections = [{ prayers: [{ id: 'a', lines: [{ it: 'x' }] }, { id: 'b', lines: [] }] }];
    expect(kidPrayers({ prayers: ['b', 'zz', 'a'] }, sections).map((p) => p.id)).toEqual(['a']);
    expect(kidPrayers(null, sections)).toEqual([]);
  });
});

describe('listenRound', () => {
  const words = kids.themes[0].words;

  it('asks each word at most once, always with its answer among the options', () => {
    const round = listenRound(words, rngFor('t1'), { questions: 6, options: 3 });
    expect(round).toHaveLength(6);
    expect(new Set(round.map((q) => q.answer.it)).size).toBe(6);
    for (const q of round) {
      expect(q.options).toHaveLength(3);
      expect(q.options.map((o) => o.it)).toContain(q.answer.it);
      expect(new Set(q.options.map((o) => o.it)).size).toBe(3);
    }
  });

  it('does not always put the answer in the same place', () => {
    const places = new Set();
    for (let s = 0; s < 10; s++) {
      for (const q of listenRound(words, rngFor(`p${s}`))) places.add(q.options.indexOf(q.answer));
    }
    expect(places.size).toBe(3);
  });

  it('is exact for a given rng and copes with tiny pools', () => {
    expect(listenRound(words, rngFor('x'))).toEqual(listenRound(words, rngFor('x')));
    expect(listenRound(words.slice(0, 1), rngFor('x'))).toEqual([]);
    expect(listenRound(words.slice(0, 2), rngFor('x'), { questions: 5, options: 3 })).toHaveLength(2);
  });
});

describe('memory board', () => {
  const words = kids.themes[1].words;
  const fresh = () => memoryBoard(words, rngFor('m'), 4);

  it('deals each chosen word twice', () => {
    const b = fresh();
    expect(b.cards).toHaveLength(8);
    const counts = {};
    for (const c of b.cards) counts[c.word.it] = (counts[c.word.it] || 0) + 1;
    expect(Object.values(counts)).toEqual([2, 2, 2, 2]);
    expect(new Set(b.cards.map((c) => c.key)).size).toBe(8);
  });

  const pairOf = (b, i) => b.cards.findIndex((c, j) => j !== i && c.word.it === b.cards[i].word.it);
  const otherThan = (b, i) => b.cards.findIndex((c) => c.word.it !== b.cards[i].word.it);

  it('matches a pair and keeps both cards up', () => {
    let b = fresh();
    let r = flipCard(b, 0);
    expect(r.event).toBe('open');
    r = flipCard(r.board, pairOf(b, 0));
    expect(r.event).toBe('match');
    expect(isFaceUp(r.board, 0)).toBe(true);
    expect(r.board.open).toEqual([]);
    expect(r.board.moves).toBe(1);
  });

  it('a miss shows both cards until closeMiss, and taps in between are ignored', () => {
    const b = fresh();
    const j = otherThan(b, 0);
    let r = flipCard(flipCard(b, 0).board, j);
    expect(r.event).toBe('miss');
    expect(r.board.open).toEqual([0, j]);
    const third = b.cards.findIndex((_, k) => k !== 0 && k !== j);
    expect(flipCard(r.board, third).event).toBe('ignored');
    const closed = closeMiss(r.board);
    expect(closed.open).toEqual([]);
    expect(isFaceUp(closed, 0)).toBe(false);
  });

  it('ignores a tap on a card already up', () => {
    const r = flipCard(fresh(), 0);
    expect(flipCard(r.board, 0).event).toBe('ignored');
  });

  it('is done when every pair is matched', () => {
    let b = fresh();
    expect(boardDone(b)).toBe(false);
    for (let i = 0; i < b.cards.length; i++) {
      if (isFaceUp(b, i)) continue;
      b = flipCard(flipCard(b, i).board, pairOf(b, i)).board;
    }
    expect(boardDone(b)).toBe(true);
    expect(b.moves).toBe(4);
  });
});

describe('album store', () => {
  beforeEach(() => localStorage.clear());

  it('normalizes junk', () => {
    expect(normalizeKids(null)).toEqual(emptyKids());
    expect(normalizeKids({ found: 3, stars: -2, locked: 'yes' })).toEqual(emptyKids());
  });

  it('collects stickers once and counts them against a word list', () => {
    let s = markFound(emptyKids(), ['il sole', 'la luna']);
    s = markFound(s, ['il sole']);
    expect(Object.keys(s.found)).toHaveLength(2);
    expect(foundCount(s, kids.themes[0].words)).toBe(2);
  });

  it('adds stars and remembers the lock across a reload', () => {
    saveKids(setLocked(addStars(emptyKids(), 3), true));
    const back = loadKids();
    expect(back.stars).toBe(3);
    expect(back.locked).toBe(true);
    expect(KIDS_KEY).toMatch(/-kids$/);
  });

  it('survives unreadable storage', () => {
    localStorage.setItem(KIDS_KEY, '{nope');
    expect(loadKids()).toEqual(emptyKids());
  });
});

describe('cheer', () => {
  it('cycles through the praise list', () => {
    expect(cheer(0)).toBe(CHEERS[0]);
    expect(cheer(CHEERS.length)).toBe(CHEERS[0]);
    expect(cheer(-1)).toBe(CHEERS[CHEERS.length - 1]);
  });
});
