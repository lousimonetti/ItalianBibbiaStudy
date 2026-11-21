import { describe, it, expect } from 'vitest';
import {
  easter, dn, isoOf, liturgyFor, upcoming, movedThisYear, storySubject, roman, cycles, ordinaryWeek,
} from './liturgy';
import { FIXED, MOVABLE } from '../data/liturgicalCalendar';
import { SAINTS } from '../data/saintsCalendar';

const at = (y, m, d) => liturgyFor(new Date(y, m - 1, d));
const iso = (n) => isoOf(n);

describe('data', () => {
  it('every fixed celebration is the saints calendar entry for its date', () => {
    // The fixed entries borrow their Wikipedia titles from that entry.
    for (const f of FIXED) expect(SAINTS[f.md], f.md).toBeTruthy();
  });

  it('ids, dates and colours are well formed', () => {
    const ids = MOVABLE.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    const mds = FIXED.map((f) => f.md);
    expect(new Set(mds).size).toBe(mds.length);
    for (const c of [...FIXED, ...MOVABLE]) {
      expect(c.name && c.en, c.name).toBeTruthy();
      expect([null, 'viola', 'bianco', 'rosso', 'verde', 'rosaceo']).toContain(c.colour);
    }
  });
});

describe('easter', () => {
  it('matches known dates, including the earliest and latest possible', () => {
    expect(iso(easter(2000))).toBe('2000-04-23');
    expect(iso(easter(2024))).toBe('2024-03-31');
    expect(iso(easter(2025))).toBe('2025-04-20');
    expect(iso(easter(2026))).toBe('2026-04-05');
    expect(iso(easter(2027))).toBe('2027-03-28');
    expect(iso(easter(2038))).toBe('2038-04-25');
    expect(iso(easter(2285))).toBe('2285-03-22');
  });
});

describe('the movable celebrations of 2026 (Italian usage)', () => {
  const cases = [
    ['2026-01-11', 'Battesimo del Signore'],
    ['2026-02-18', 'Mercoledì delle Ceneri'],
    ['2026-03-29', 'Domenica delle Palme e della Passione del Signore'],
    ['2026-04-02', 'Giovedì Santo'],
    ['2026-04-03', 'Venerdì Santo, Passione del Signore'],
    ['2026-04-04', 'Sabato Santo'],
    ['2026-04-05', 'Domenica di Pasqua, Risurrezione del Signore'],
    ['2026-04-06', "Lunedì dell'Angelo"],
    ['2026-04-12', 'II domenica di Pasqua o della Divina Misericordia'],
    ['2026-05-17', 'Ascensione del Signore'],
    ['2026-05-24', 'Domenica di Pentecoste'],
    ['2026-05-31', 'Santissima Trinità'],
    ['2026-06-07', 'Santissimo Corpo e Sangue di Cristo (Corpus Domini)'],
    ['2026-06-12', 'Sacratissimo Cuore di Gesù'],
    ['2026-11-22', "Nostro Signore Gesù Cristo Re dell'universo"],
    ['2026-11-29', 'I domenica di Avvento'],
    ['2026-12-27', 'Santa Famiglia di Gesù, Maria e Giuseppe'],
  ];
  it.each(cases)('%s is %s', (date, name) => {
    const [y, m, d] = date.split('-').map(Number);
    expect(at(y, m, d).name).toBe(name);
  });
});

describe('seasons, Sundays and colours', () => {
  it('names and counts Sundays', () => {
    expect(at(2026, 2, 15).name).toBe('VI domenica del Tempo Ordinario');
    expect(at(2026, 11, 15).name).toBe('XXXIII domenica del Tempo Ordinario');
    expect(at(2026, 1, 4).name).toBe('II domenica dopo Natale');
    expect(at(2026, 3, 1).name).toBe('II domenica di Quaresima');
    expect(at(2026, 12, 20).name).toBe('IV domenica di Avvento');
  });

  it('counts Ordinary Time after Pentecost back from Christ the King', () => {
    // 2026: week 7 is skipped; the Monday after Pentecost is in week 8.
    expect(ordinaryWeek(dn(2026, 2, 17))).toBe(6);
    expect(ordinaryWeek(dn(2026, 5, 25))).toBe(8);
    expect(ordinaryWeek(dn(2026, 11, 22))).toBe(34);
    expect(at(2026, 11, 21).name).toBe('Sabato della XXXIII settimana del Tempo Ordinario');
  });

  it('gives each season its colour, with rose on Gaudete and Laetare', () => {
    expect(at(2026, 7, 14).colour).toBe('verde');
    expect(at(2026, 12, 1).colour).toBe('viola');
    expect(at(2026, 12, 13).colour).toBe('rosaceo');
    expect(at(2026, 3, 15).colour).toBe('rosaceo');
    expect(at(2026, 3, 29).colour).toBe('rosso');
    expect(at(2026, 4, 3).colour).toBe('rosso');
    expect(at(2026, 4, 4).colour).toBeNull();
    expect(at(2026, 5, 24).colour).toBe('rosso');
    expect(at(2026, 11, 2).colour).toBe('viola');
  });

  it('works out the Sunday and weekday cycles', () => {
    expect(cycles(dn(2026, 11, 28))).toEqual({ sundayYear: 'A', weekdayCycle: 'II' });
    expect(cycles(dn(2026, 11, 29))).toEqual({ sundayYear: 'B', weekdayCycle: 'I' });
    expect(cycles(dn(2027, 11, 28))).toEqual({ sundayYear: 'C', weekdayCycle: 'II' });
    expect(cycles(dn(2025, 11, 30)).sundayYear).toBe('A');
  });

  it('marks Italy\'s days of obligation', () => {
    expect(at(2026, 12, 8).precetto).toBe(true);
    expect(at(2026, 8, 15).precetto).toBe(true);
    expect(at(2026, 11, 22).precetto).toBe(true); // a Sunday
    expect(at(2026, 4, 6).precetto).toBe(false); // Easter Monday
    expect(at(2026, 3, 19).precetto).toBe(false); // not in Italy
  });

  it('every day from 2020 to 2040 has a name, season and colour or none', () => {
    for (let n = dn(2020, 1, 1); n <= dn(2040, 12, 31); n++) {
      const c = liturgyFor(n);
      expect(c.name, iso(n)).toBeTruthy();
      expect(c.seasonLabel, iso(n)).toBeTruthy();
      expect(c.rankLabel, iso(n)).toBeTruthy();
      if (c.colour === null) expect(c.id, iso(n)).toBe('sabato-santo');
      expect(c.name, iso(n)).not.toMatch(/undefined|NaN| {2}/);
    }
  });
});

describe('precedence and transfers', () => {
  it('moves the Annunciation out of Holy Week to the Monday after Divine Mercy Sunday', () => {
    expect(at(2024, 3, 25).name).toBe('Lunedì della Settimana Santa');
    expect(at(2024, 4, 8).name).toBe('Annunciazione del Signore');
    expect(at(2024, 4, 8).movedFrom).toBe('03-25');
    expect(at(2035, 4, 2).name).toBe('Annunciazione del Signore');
  });

  it('moves Saint Joseph out of Holy Week to the Saturday before Palm Sunday', () => {
    expect(at(2035, 3, 17).name).toBe('San Giuseppe, sposo della Beata Vergine Maria');
    expect(at(2035, 3, 19).name).toBe('Lunedì della Settimana Santa');
  });

  it('moves a solemnity off an Advent Sunday to the Monday', () => {
    expect(at(2030, 12, 8).name).toBe('II domenica di Avvento');
    expect(at(2030, 12, 9).name).toBe('Immacolata Concezione della Beata Vergine Maria');
    expect(movedThisYear('12-08', 2030).to.getDate()).toBe(9);
  });

  it('puts the Holy Family on 30 December when no Sunday falls in the Octave', () => {
    expect(at(2022, 12, 30).name).toBe('Santa Famiglia di Gesù, Maria e Giuseppe');
    expect(movedThisYear('12-30', 2022)).toBeNull();
    expect(movedThisYear('12-30', 2026).to.getDate()).toBe(27);
  });

  it('lets a feast of the Lord replace a Sunday in Ordinary Time, but not a saint\'s feast', () => {
    expect(at(2025, 11, 9).name).toBe('Dedicazione della Basilica Lateranense');
    expect(at(2026, 8, 9).name).toBe('XIX domenica del Tempo Ordinario');
    expect(movedThisYear('08-09', 2026)).toMatchObject({ omitted: true });
    // The Holy Family on Sunday 27 December 2026 takes Saint John's day.
    expect(movedThisYear('12-27', 2026)).toMatchObject({ omitted: true });
  });

  it('lets a solemnity or All Souls replace a Sunday in Ordinary Time', () => {
    expect(at(2025, 11, 2).name).toBe('Commemorazione di tutti i fedeli defunti');
    expect(at(2025, 6, 29).name).toBe('Santi Pietro e Paolo, apostoli');
  });

  it('shows both when two solemnities meet, rather than guessing the decree', () => {
    const c = at(2022, 6, 24);
    expect(c.name).toBe('Sacratissimo Cuore di Gesù');
    expect(c.also.map((a) => a.name)).toEqual(['Natività di San Giovanni Battista']);
  });
});

describe('upcoming', () => {
  it('lists the coming great days in order', () => {
    const list = upcoming(new Date(2026, 10, 21), 5).map((c) => c.iso);
    expect(list).toEqual(['2026-11-22', '2026-11-29', '2026-11-30', '2026-12-08', '2026-12-25']);
  });
});

describe('storySubject', () => {
  const saint = { key: '11-22', name: 'Santa Cecilia', it: 'Santa Cecilia', en: 'Saint Cecilia' };
  it('tells the feast\'s story when it is not the saint of the day', () => {
    const s = storySubject(at(2026, 11, 22), saint);
    expect(s).toMatchObject({ it: 'Cristo Re', feast: true });
  });
  it('keeps the saint on a plain weekday and when the feast is the saint', () => {
    expect(storySubject(at(2026, 11, 21), saint)).toBe(saint);
    const joseph = { key: '03-19', ...SAINTS['03-19'] };
    expect(storySubject(at(2026, 3, 19), joseph)).toBe(joseph);
  });
});

describe('roman', () => {
  it('writes the numbers the calendar needs', () => {
    expect([1, 4, 9, 14, 19, 24, 33, 34].map(roman)).toEqual(['I', 'IV', 'IX', 'XIV', 'XIX', 'XXIV', 'XXXIII', 'XXXIV']);
  });
});
