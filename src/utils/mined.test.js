import { describe, it, expect, beforeEach } from 'vitest';
import {
  sentenceAt, addEntry, removeEntry, updateEntry, hasEntry, toCards,
  loadMined, mineWord, forgetWord, editWord, MINED_EVENT, MAX_MINED,
} from './mined';
import { storageKey } from './storageKey';

beforeEach(() => localStorage.clear());

describe('sentenceAt', () => {
  const text = 'In principio era il Verbo. E il Verbo era presso Dio; tutto è stato fatto.';
  it('returns the sentence containing the offset, with its full stop', () => {
    expect(sentenceAt(text, text.indexOf('principio'))).toBe('In principio era il Verbo.');
    expect(sentenceAt(text, text.indexOf('presso'))).toBe('E il Verbo era presso Dio;');
    expect(sentenceAt(text, text.indexOf('fatto'))).toBe('tutto è stato fatto.');
  });
  it('drops an opening quotation mark', () => {
    expect(sentenceAt('«Venite e vedrete».', 3)).toBe('Venite e vedrete».');
  });
  it('copes with empty text', () => {
    expect(sentenceAt('', 0)).toBe('');
  });
});

describe('saved-word list', () => {
  it('adds an entry with a timestamp and straight apostrophes', () => {
    const r = addEntry([], { it: 'l’ombra', en: 'the shadow', ex: 'All’ombra.' }, 42);
    expect(r.added).toBe(true);
    expect(r.list).toEqual([{ it: "l'ombra", en: 'the shadow', ex: "All'ombra.", src: '', added: 42 }]);
  });
  it('refuses empty and duplicate words, ignoring case', () => {
    const { list } = addEntry([], { it: 'Pietra' });
    expect(addEntry(list, { it: '  ' }).reason).toBe('empty');
    expect(addEntry(list, { it: 'pietra' }).reason).toBe('duplicate');
    expect(hasEntry(list, 'PIETRA')).toBe(true);
  });
  it('stops at the cap', () => {
    const full = Array.from({ length: MAX_MINED }, (_, i) => ({ it: `w${i}` }));
    expect(addEntry(full, { it: 'nuova' }).reason).toBe('full');
  });
  it('edits a meaning without touching the term or date', () => {
    const list = [{ it: 'pietra', en: '', ex: '', src: '', added: 1 }];
    expect(updateEntry(list, 'Pietra', { en: 'stone', it: 'x', added: 9 })[0])
      .toEqual({ it: 'pietra', en: 'stone', ex: '', src: '', added: 1 });
    expect(removeEntry(list, 'PIETRA')).toEqual([]);
  });
  it('turns entries with a meaning into practice cards', () => {
    const cards = toCards([
      { it: 'pietra', en: 'stone', ex: 'Una pietra.', src: 'Week 3' },
      { it: 'senza', en: '', ex: '' },
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ it: 'pietra', en: 'stone', ex: 'Una pietra.', deck: 'mine', meta: 'My words · Week 3' });
  });
});

describe('stored list', () => {
  it('saves under the course prefix, notifies, edits and forgets', () => {
    let events = 0;
    const on = () => { events += 1; };
    window.addEventListener(MINED_EVENT, on);
    expect(mineWord({ it: 'pietra', ex: 'Una pietra.' }).added).toBe(true);
    expect(mineWord({ it: 'Pietra' }).added).toBe(false);
    expect(JSON.parse(localStorage.getItem(storageKey('mined')))).toHaveLength(1);
    editWord('pietra', { en: 'stone' });
    expect(loadMined()[0].en).toBe('stone');
    forgetWord('pietra');
    expect(loadMined()).toEqual([]);
    expect(events).toBe(3);
    window.removeEventListener(MINED_EVENT, on);
  });
  it('reads a damaged value as empty', () => {
    localStorage.setItem(storageKey('mined'), '{"oops":');
    expect(loadMined()).toEqual([]);
  });
});
