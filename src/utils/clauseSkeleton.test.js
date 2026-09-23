import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import { tokenize } from './vocabIndex';
import {
  analyze, clauseCount, isFiniteVerb, isParticiple, isAuxiliary, stripElision,
  stripClitics, isGerund, isInfinitive, hasElision,
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
      // -ai / -ete additions, and words the enclitic stripper could maul:
      // "diavolo" minus -lo looks like an imperfetto, "meritevole" minus -le too.
      'granai', 'parete', 'quiete', 'diavolo', 'meritevole', 'vicendevole',
      'fratelli', 'peccati', 'apostoli', 'spiriti', 'vangelo', 'popolo',
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

  // Regression: "perseguiti" is 2nd-person singular present ("why do you
  // persecute me?"), not a participle. Found by eye on the Acts 9 passage.
  it('does not read a 2nd-person singular -iti verb as a participle', () => {
    expect(isParticiple('perseguiti')).toBe(false);
    expect(isFiniteVerb('perseguiti')).toBe(false); // not claimed either way
  });

  it('still recognises the genuine -iti participles via the lexicon', () => {
    expect(isParticiple('fuggiti')).toBe(true);
    expect(isParticiple('riuniti')).toBe(true);
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

describe('the tenses the suffix table gained', () => {
  it('reads the 2nd-person plural present (-ete)', () => {
    for (const w of ['rimanete', 'piangete', 'valete', 'temete']) {
      expect(isFiniteVerb(w), w).toBe(true);
    }
  });

  it('reads the 1st-person singular passato remoto (-ai)', () => {
    for (const w of ['recai', 'andai', 'parlai']) expect(isFiniteVerb(w), w).toBe(true);
    expect(isFiniteVerb('granai')).toBe(false); // barns
    expect(isFiniteVerb('mai')).toBe(false);
  });
});

describe('stripClitics', () => {
  it('peels one enclitic pronoun at a time', () => {
    expect(stripClitics('lodatelo')).toBe('lodate');
    expect(stripClitics('ammazzatelo')).toBe('ammazzate');
    expect(stripClitics('ricordandosi')).toBe('ricordando');
  });

  it('leaves a stem that would be too short alone', () => {
    expect(stripClitics('morti')).toBe('morti');
    expect(stripClitics('tutti')).toBe('tutti');
  });

  it('lets an imperative that swallowed its pronoun read as a verb', () => {
    for (const w of ['lodatelo', 'liberatelo', 'lasciatelo', 'ammazzatelo', 'insegnateci']) {
      expect(isFiniteVerb(w), w).toBe(true);
    }
  });

  // Regression: the stem is only allowed to match the lexicon and the
  // imperative endings. Run the whole suffix table over it and "diavolo" (minus
  // -lo) reads as an imperfetto.
  it('does not turn a noun into a verb by stripping its last syllable', () => {
    for (const w of ['diavolo', 'meritevole', 'vicendevole', 'popolo', 'vangelo']) {
      expect(isFiniteVerb(w), w).toBe(false);
    }
  });
});

describe('isGerund / isInfinitive', () => {
  it('recognises gerunds, including ones carrying a pronoun', () => {
    for (const w of ['pregando', 'vedendo', 'ricordandosi', 'liberandoti']) {
      expect(isGerund(w), w).toBe(true);
    }
    expect(isGerund('quando')).toBe(false);
    expect(isGerund('mando')).toBe(false); // 1st person, not a gerund
  });

  it('recognises infinitives but not the nouns that rhyme with them', () => {
    for (const w of ['offrire', 'vedere', 'proclamare', 'uccidersi']) {
      expect(isInfinitive(w), w).toBe(true);
    }
    for (const w of ['altare', 'carcere', 'opere', 'mare', "l'argentiere"]) {
      expect(isInfinitive(w), w).toBe(false);
    }
  });
});

describe('analyze — a word after a determiner is a noun', () => {
  it('reads a verb/noun homograph by what precedes it', () => {
    expect(roleOf(analyze('Chi rimane in me porta molto frutto.'), 'porta')).toBe('finite');
    expect(roleOf(analyze('Bussate, e la porta vi sarà aperta.'), 'porta')).toBe('plain');
  });

  it('does not read a noun as a reduced relative', () => {
    // "la vista" is sight, "un posto" a place, "i morti" the dead — none of
    // them is "which has been seen/placed/died".
    expect(roleOf(analyze('perché tu riacquisti la vista'), 'vista')).toBe('plain');
    expect(roleOf(analyze('Vado a prepararvi un posto.'), 'posto')).toBe('plain');
    expect(roleOf(analyze('Perché cercate tra i morti colui che è vivo?'), 'morti')).toBe('plain');
  });

  it('still reads the same words as the participle half of a compound', () => {
    expect(roleOf(analyze('Dio lo ha risuscitato dai morti.'), 'risuscitato')).toBe('compound');
    expect(roleOf(analyze('Gesù ha visto la folla.'), 'visto')).toBe('compound');
  });

  it('leaves an object clitic + verb alone (gli disse, not "the said")', () => {
    expect(roleOf(analyze('Gesù gli disse: «Vieni».'), 'disse')).toBe('finite');
  });

  it('never reads an elided noun phrase as a participle', () => {
    expect(hasElision("all'aperto")).toBe(true);
    expect(isParticiple("all'aperto")).toBe(false);
    expect(roleOf(analyze("pernottando all'aperto"), "all'aperto")).toBe('plain');
  });

  it('ties "sta scritto" together as one compound verb', () => {
    const r = analyze('Gesù gli rispose: «Sta scritto: "Non di solo pane vivrà l\'uomo"».');
    expect(roleOf(r, 'scritto')).toBe('compound');
  });
});

// The first version of the aside rule was "comma-delimited and verbless", which
// also swallowed coordinated lists, infinitive complements and plain objects —
// i.e. told the reader to skip the substance. Each case below is one class it
// got wrong, taken from the course corpus.
describe('analyze — what is NOT an aside', () => {
  const notDim = (text, word) => expect(dimOf(analyze(text), word)).toBe(false);

  it('does not dim the items of a coordinated list', () => {
    notDim('Amerai il Signore tuo Dio con tutto il tuo cuore, con tutta la tua anima, '
      + 'con tutta la tua forza e con tutta la tua mente.', 'anima');
  });

  it('does not dim a segment that continues with a coordinator', () => {
    notDim('Sono persuaso che né morte né vita, né angeli né principati, '
      + 'né presente né avvenire potranno separarci.', 'angeli');
  });

  it('does not dim an infinitive complement', () => {
    const r = analyze('Vi esorto dunque, fratelli, per la misericordia di Dio, '
      + 'ad offrire i vostri corpi come sacrificio vivente.');
    expect(dimOf(r, 'offrire')).toBe(false);
    expect(dimOf(r, 'fratelli')).toBe(true); // the vocative still is one
  });

  it('does not dim a clause whose verb it failed to recognise', () => {
    // opens with a clitic ("vi annuncio"), so something finite is in there
    notDim('Non temete: ecco, vi annuncio una grande gioia, che sarà di tutto il popolo.', 'gioia');
    // opens with a relative
    notDim('Beati voi, che ora piangete, perché riderete.', 'piangete');
  });

  it('does not dim the subject that follows a temporal frame', () => {
    const r = analyze('Pochi giorni dopo, il figlio più giovane, raccolte tutte le sue cose, '
      + 'partì per un paese lontano.');
    expect(dimOf(r, 'figlio')).toBe(false);
    expect(dimOf(r, 'raccolte')).toBe(true); // the absolute participle still is an aside
  });

  it('does not dim a bare object caught between commas', () => {
    const r = analyze('E mentre ero in cammino, in pieno giorno, vidi, o re, una luce, '
      + 'più splendente del sole, che veniva dal cielo.');
    expect(dimOf(r, 'luce')).toBe(false);
    expect(dimOf(r, 'giorno')).toBe(true);   // the temporal aside still is one
    expect(dimOf(r, 'splendente')).toBe(true);
  });

  it('still dims the appositives and implicit clauses it was built for', () => {
    const r = analyze('Tommaso, uno dei Dodici, chiamato Dìdimo, non era con loro.');
    expect(dimOf(r, 'Dodici')).toBe(true);
    expect(dimOf(r, 'chiamato')).toBe(true);
    expect(dimOf(r, 'Tommaso')).toBe(false);
    expect(dimOf(analyze('Il carceriere, vedendo aperte le porte della prigione, '
      + 'tirò fuori la spada.'), 'vedendo')).toBe(true);
  });
});

// Found by re-reading all 200 verses with the toggle on. Each is one class of
// mismark, taken from the corpus.
describe('analyze — second corpus pass', () => {
  const role = (text, word) => roleOf(analyze(text), word);

  it('does not let a postposed possessive hide the verb after it', () => {
    expect(role('Io sono la vite vera e il Padre mio è l\'agricoltore.', 'è')).toBe('finite');
    expect(role('Beati voi, poveri, perché vostro è il regno di Dio.', 'è')).toBe('finite');
    expect(role('Li condusse a casa sua, apparecchiò la mensa.', 'apparecchiò')).toBe('finite');
  });

  it('still reads a prenominal possessive as a determiner', () => {
    expect(role('Si alzò e tornò da suo padre.', 'padre')).toBe('plain');
  });

  it('reads a finite form after an auxiliary as the participle', () => {
    expect(role('mentre erano chiuse le porte del luogo', 'chiuse')).toBe('compound');
    expect(role('Essi furono presi da grande timore,', 'presi')).toBe('compound');
  });

  it('ties a participle to an infinitive or gerund auxiliary', () => {
    expect(role('che cosa devo fare per essere salvato?', 'salvato')).toBe('compound');
    expect(role('per aver creduto in Dio.', 'creduto')).toBe('compound');
    expect(role('senza averne sentito parlare?', 'sentito')).toBe('compound');
    expect(role('venire ucciso e risorgere il terzo giorno', 'ucciso')).toBe('compound');
  });

  it('accepts the -e and -peccato participles only after an auxiliary', () => {
    expect(role('e queste cose vi saranno date in aggiunta.', 'date')).toBe('compound');
    expect(role('tutti infatti hanno peccato', 'peccato')).toBe('compound');
    expect(role('Cristo è morto per i nostri peccato', 'peccato')).toBe('plain');
  });

  it('reads a lone feminine-plural participle between commas as a participle', () => {
    expect(role('ma, entrate, non trovarono il corpo', 'entrate')).toBe('participle');
    expect(role('Le donne, impaurite, tenevano il viso chinato a terra', 'impaurite')).toBe('participle');
    expect(role('Considerate i corvi: non seminano', 'Considerate')).toBe('finite');
  });

  it('reads a noun homograph after a prenominal adjective as the noun', () => {
    expect(role('a portare ai poveri il lieto annuncio', 'annuncio')).toBe('plain');
    expect(role('Non temete: ecco, vi annuncio una grande gioia', 'annuncio')).toBe('finite');
  });

  it('knows the strong participles the first pass missed', () => {
    expect(role('Davvero il Signore è risorto!', 'risorto')).toBe('compound');
    expect(role('troverete un bambino avvolto in fasce', 'avvolto')).toBe('participle');
    expect(role('perché chiunque crede in lui non vada perduto', 'perduto')).toBe('compound');
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
    expect(both.sort()).toEqual([
      'battezzati', 'chiuse', 'corse', 'divise', 'perdonati', 'prese', 'presi', 'scese',
    ]);
  });

  it('resolves an ambiguous form to finite inside a real sentence', () => {
    expect(roleOf(analyze('Pietro prese la parola.'), 'prese')).toBe('finite');
  });

  // Dimming is the loudest thing this module does, so it has to stay rare: an
  // aside is a genuine parenthetical, not "any comma we did not understand".
  it('marks an aside in only a small minority of authored verses', () => {
    const verses = weeks.flatMap((w) => (w.passage?.verses || []).map((v) => v.t));
    const withAside = verses.filter((v) => analyze(v).hasParenthetical);
    expect(withAside.length / verses.length).toBeLessThan(0.2);
  });
});
