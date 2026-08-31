import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import { tokenize } from './vocabIndex';
import {
  analyze, clauseCount, isFiniteVerb, isParticiple, isAuxiliary, stripElision,
} from './clauseSkeleton';

// The week-20 (Acts 4) passage — the text that motivated this module. Every
// construction the skeleton view is meant to expose appears in it.
const ACTS4_11 = 'È lui "la pietra che, scartata da voi costruttori, è diventata la pietra d\'angolo".';
const ACTS4_12 = 'In nessun altro c\'è salvezza; non vi è infatti, sotto il cielo, altro nome dato agli uomini nel quale è stabilito che noi siamo salvati».';
const ACTS4_31 = 'Mentre pregavano, il luogo in cui erano riuniti tremò e tutti furono colmati di Spirito Santo e annunciavano la parola di Dio con franchezza.';
const ACTS4_32 = 'La moltitudine di coloro che erano diventati credenti aveva un cuore solo e un\'anima sola e nessuno considerava sua proprietà quello che gli apparteneva, ma fra loro tutto era comune.';

const roleOf = (result, word) =>
  result.tokens.find((t) => t.isWord && t.text.toLowerCase() === word.toLowerCase())?.role;
const dimOf = (result, word) =>
  result.tokens.find((t) => t.isWord && t.text.toLowerCase() === word.toLowerCase())?.dim;

describe('stripElision', () => {
  it('drops an elided article so the stem is what gets tested', () => {
    expect(stripElision("l'anno")).toBe('anno');
    expect(stripElision("dell'uomo")).toBe('uomo');
    expect(stripElision("c'è")).toBe('è');
  });

  it('leaves unelided words alone', () => {
    expect(stripElision('pietra')).toBe('pietra');
    expect(stripElision('')).toBe('');
  });
});

describe('isFiniteVerb', () => {
  it('recognises the tenses the course never taught but Acts is written in', () => {
    // passato remoto — regular and strong
    expect(isFiniteVerb('tremò')).toBe(true);
    expect(isFiniteVerb('scoppiò')).toBe(true);
    expect(isFiniteVerb('gettarono')).toBe(true);
    expect(isFiniteVerb('disse')).toBe(true);
    expect(isFiniteVerb('scelsero')).toBe(true);
    expect(isFiniteVerb('furono')).toBe(true);
    // imperfetto / trapassato auxiliary
    expect(isFiniteVerb('considerava')).toBe(true);
    expect(isFiniteVerb('apparteneva')).toBe(true);
    expect(isFiniteVerb('erano')).toBe(true);
  });

  it('recognises future, conditional and subjunctive', () => {
    expect(isFiniteVerb('sarà')).toBe(true);
    expect(isFiniteVerb('annunceranno')).toBe(true);
    expect(isFiniteVerb('sarebbe')).toBe(true);
    expect(isFiniteVerb('fossero')).toBe(true);
    expect(isFiniteVerb('convertissero')).toBe(true);
  });

  it('does not flag infinitives, gerunds or participles', () => {
    for (const w of ['pregare', 'essere', 'vedere', 'pregando', 'uscendo', 'scartata', 'dato']) {
      expect(isFiniteVerb(w), w).toBe(false);
    }
  });

  // Precision guard. Each of these would be caught by a suffix rule and is a
  // noun or adjective in this corpus; a noun highlighted as a verb actively
  // misleads the reader, which is worse than a missed highlight.
  it('does not flag the corpus nouns that collide with verb endings', () => {
    const nouns = [
      'prossimo', 'pubblicano', 'samaritano', 'stefano', 'giordano', 'ebrei',
      'anno', 'inganno', 'estremo', 'però', 'perciò', 'ciò', 'così',
      'classe', 'promesse', 'interesse', 'profetesse', 'trono', 'perdono',
      'romano', 'cristiano', 'lontano', 'umano', 'invano', 'piano', 'buono',
      'oliva', 'privi', 'estate', 'diacono', 'diaconi',
    ];
    for (const n of nouns) expect(isFiniteVerb(n), n).toBe(false);
  });

  it("resolves an elided form to its stem (c'è is a verb, l'anno is not)", () => {
    expect(isFiniteVerb("c'è")).toBe(true);
    expect(isFiniteVerb("l'anno")).toBe(false);
  });
});

describe('isParticiple', () => {
  it('recognises weak and strong past participles', () => {
    for (const w of ['scartata', 'diventati', 'colmati', 'stabilito', 'dato',
                     'detto', 'fatto', 'scritto', 'aperte', 'sceso']) {
      expect(isParticiple(w), w).toBe(true);
    }
  });

  it('does not flag the nouns and adjectives those endings collide with', () => {
    const nouns = ['peccato', 'spirito', 'subito', 'sabato', 'nascita', 'salute',
                   'partito', 'vestito', 'marito', 'beati', 'ipocriti', 'paraclito',
                   'unigenito', 'principati', 'morte', 'volta', 'risposta', 'offerta'];
    for (const n of nouns) expect(isParticiple(n), n).toBe(false);
  });
});

describe('isAuxiliary', () => {
  it('covers essere/avere and the passive auxiliaries', () => {
    for (const w of ['è', 'erano', 'furono', 'ha', 'avevano', 'venne']) {
      expect(isAuxiliary(w), w).toBe(true);
    }
    expect(isAuxiliary('tremò')).toBe(false);
  });
});

describe('analyze — the auxiliary-adjacency rule', () => {
  it('treats a participle leaning on an auxiliary as part of the clause spine', () => {
    const r = analyze('La pietra è diventata la pietra d\'angolo.');
    expect(roleOf(r, 'è')).toBe('finite');
    expect(roleOf(r, 'diventata')).toBe('compound');
  });

  it('treats a bare participle as a reduced relative clause', () => {
    // "il nome dato agli uomini" = "il nome CHE È STATO dato agli uomini"
    const r = analyze('altro nome dato agli uomini');
    expect(roleOf(r, 'dato')).toBe('participle');
  });

  it('sees through an adverb between the auxiliary and its participle', () => {
    const r = analyze('non fu mai scartata');
    expect(roleOf(r, 'scartata')).toBe('compound');
  });

  it('reads the trapassato prossimo as one compound verb, not two', () => {
    const r = analyze('coloro che erano diventati credenti');
    expect(roleOf(r, 'erano')).toBe('finite');
    expect(roleOf(r, 'diventati')).toBe('compound');
    expect(r.finiteCount).toBe(1);
  });
});

describe('analyze — parentheticals', () => {
  it('dims a comma-delimited stretch that holds no finite verb', () => {
    const r = analyze(ACTS4_11);
    expect(r.hasParenthetical).toBe(true);
    expect(dimOf(r, 'scartata')).toBe(true);
    expect(dimOf(r, 'costruttori')).toBe(true);
    // the spine stays lit
    expect(dimOf(r, 'diventata')).toBe(false);
    expect(dimOf(r, 'pietra')).toBe(false);
  });

  it('dims a bare adverbial aside', () => {
    const r = analyze(ACTS4_12);
    expect(dimOf(r, 'cielo')).toBe(true);
  });

  it('does NOT dim a subordinate clause that has its own verb', () => {
    // "Mentre pregavano," is comma-closed on the right but carries a finite
    // verb — it is a clause, not an aside, and must stay readable.
    const r = analyze(ACTS4_31);
    expect(dimOf(r, 'pregavano')).toBe(false);
    expect(r.hasParenthetical).toBe(false);
  });

  it('never dims a segment that is open at one end', () => {
    const r = analyze('Con grande forza gli apostoli davano testimonianza, e tutti godevano di grande favore.');
    expect(r.tokens.every((t) => !t.dim)).toBe(true);
  });
});

describe('clauseCount', () => {
  it('counts the finite verbs — the number of clauses to unpack', () => {
    expect(clauseCount(ACTS4_32)).toBe(5);
    expect(clauseCount(ACTS4_31)).toBe(5);
    expect(clauseCount('Gesù pianse.')).toBe(1);
  });

  it('is 0 for text with no verb', () => {
    expect(clauseCount('la pietra d\'angolo')).toBe(0);
    expect(clauseCount('')).toBe(0);
  });
});

describe('analyze — output integrity', () => {
  it('preserves the original text exactly', () => {
    for (const s of [ACTS4_11, ACTS4_12, ACTS4_31, ACTS4_32]) {
      expect(analyze(s).tokens.map((t) => t.text).join('')).toBe(s);
    }
  });

  it('handles empty and nullish input', () => {
    expect(analyze('').tokens).toEqual([]);
    expect(analyze(null).finiteCount).toBe(0);
  });
});

// Corpus-wide precision guard: this is what the lexicons were tuned against,
// so it is also what protects them from a regression when course text changes.
describe('corpus sanity', () => {
  const weeks = PHASES.flatMap((p) => p.weeks);
  const words = [];
  for (const w of weeks) {
    const texts = [w.prompt?.it || '', ...(w.vocab || []).map((v) => v[2] || ''),
                   ...(w.passage?.verses || []).map((v) => v.t || '')];
    for (const t of texts) {
      for (const tok of tokenize(t)) if (tok.isWord) words.push(stripElision(tok.text));
    }
  }

  it('finds a finite verb in the great majority of authored passage verses', () => {
    const verses = weeks.flatMap((w) => (w.passage?.verses || []).map((v) => v.t));
    const verbless = verses.filter((v) => clauseCount(v) === 0);
    // A handful of verses are genuinely verbless ("Beati i poveri in spirito").
    expect(verbless.length / verses.length).toBeLessThan(0.1);
  });

  // Some forms are irreducibly ambiguous: "prese" is both 3rd-singular passato
  // remoto (he took) and a feminine-plural participle (taken). analyze()
  // resolves the overlap finite-first, which is the right call in narrative
  // prose. This pins the overlap set so a lexicon edit can't widen it silently.
  it('keeps the finite/participle overlap to the known ambiguous forms', () => {
    const both = [...new Set(words)].filter((w) => isFiniteVerb(w) && isParticiple(w));
    expect(both.sort()).toEqual(['chiuse', 'corse', 'prese']);
  });

  it('resolves an ambiguous form to finite inside a real sentence', () => {
    expect(roleOf(analyze('Pietro prese la parola.'), 'prese')).toBe('finite');
  });
});
