// Clause skeleton — a reading aid for hypotactic prose (Acts, the Epistles,
// the Psalms), where CEI stops stringing short clauses with "e" and starts
// building periodic sentences with embedded subordinate and participial
// clauses.
//
// The pedagogy it encodes (see the reading-strategy notes in AUTHORING.md):
//   1. A sentence has as many clauses as it has FINITE verbs. Find those first.
//   2. A stretch between commas with NO finite verb is a parenthetical —
//      collapse it, read the sentence without it, then put it back.
//   3. A past participle NOT leaning on an auxiliary is a reduced relative:
//      "il nome dato agli uomini" = "il nome CHE È STATO dato agli uomini".
//      This is the construction that most often breaks an English reader,
//      because English rarely wedges one between a relative pronoun and its
//      verb ("la pietra che, scartata da voi, è diventata…").
//
// Detection is deliberately PRECISION-FIRST: a missed verb is a soft failure
// (it just isn't highlighted), a noun mislabelled as a verb actively misleads.
// So ambiguous endings are either lexicon-gated or excluded outright, and the
// stoplists below were built empirically by running the detector over every
// passage, example sentence and prompt in the course; the corpus-sanity block
// in clauseSkeleton.test.js pins that tuning against regressions.
//
// Three context rules do the work the word-level lexicons cannot:
//   · a word right after a determiner is a NOUN, not a verb ("la vista",
//     "un posto", "i morti", "la porta" vs "porta molto frutto");
//   · a word carrying an elided article ("all'aperto") is a noun phrase, never
//     a reduced relative;
//   · a comma-delimited stretch is only an ASIDE when nothing marks it as
//     content — see isAsideSegment() for the guards, which were added after
//     the first version dimmed coordinated lists ("con tutta la tua anima, con
//     tutta la tua forza") and infinitive complements, i.e. exactly the
//     material the reader must NOT skip.
//
// Pure + unit-tested. No course data is imported: this is language-level logic
// for `config.locale.target === 'it-IT'`, and the caller decides when to use it.

import { tokenize } from './vocabIndex';

const lower = (w) => String(w ?? '').toLowerCase();

const ELISION = /^([a-zà-ÿ]{1,4})['’](.+)$/;

// Strip a leading elided article/preposition so "l'anno" is tested as "anno"
// and "dell'uomo" as "uomo" — otherwise the -anno future rule fires on a noun.
export function stripElision(word) {
  const m = lower(word).match(ELISION);
  return m ? m[2] : lower(word);
}

// True when the word carries an elided proclitic ("l'aperto", "dell'uomo").
// Apart from "l'ha/l'hanno" — where the elided piece is an object clitic and
// the verb is finite — what follows an elision is a noun phrase, so this is
// enough to rule out the reduced-relative reading of "all'aperto".
export function hasElision(word) {
  return ELISION.test(lower(word));
}

// Enclitic pronouns, stripped one at a time so an imperative that swallowed its
// object ("lodàtelo", "ammazzatelo", "liberatelo") is still testable as a verb.
// Only unambiguous enclitics are listed: -se/-te/-me are excluded because they
// are ordinary noun endings ("promesse", "estate").
const ENCLITIC = /(?:gli|lo|la|li|le|ne|mi|ti|ci|vi|si)$/;

export function stripClitics(word) {
  let w = stripElision(word);
  for (let i = 0; i < 2; i++) {
    const m = w.match(ENCLITIC);
    if (!m) break;
    const stem = w.slice(0, w.length - m[0].length);
    if (stem.length < 4) break;
    w = stem;
  }
  return w;
}

// ── auxiliaries ──────────────────────────────────────────────────────────────
// Finite forms of essere/avere (plus venire/andare, which build the passive in
// biblical register: "venne battezzato", "andò perduto", and stare, which
// carries "sta scritto"). A participle leaning on one of these is part of a
// compound tense — spine, not a reduced relative.
const AUX = new Set([
  'sono', 'sei', 'è', 'siamo', 'siete',
  'ero', 'eri', 'era', 'eravamo', 'eravate', 'erano',
  'fui', 'fosti', 'fu', 'fummo', 'foste', 'furono',
  'sarò', 'sarai', 'sarà', 'saremo', 'sarete', 'saranno',
  'sia', 'siano', 'fosse', 'fossero', 'sarei', 'sarebbe', 'sarebbero',
  'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno',
  'avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano',
  'ebbi', 'ebbe', 'ebbero', 'avrò', 'avrà', 'avranno',
  'abbia', 'abbiano', 'avesse', 'avessero', 'avrei', 'avrebbe',
  'viene', 'vengono', 'venne', 'vennero', 'veniva', 'venivano',
  'sta', 'stanno', 'stava', 'stavano',
]);

export function isAuxiliary(word) {
  return AUX.has(stripElision(word));
}

// ── finite verbs: irregular + present-tense lexicon ──────────────────────────
// Suffix rules (below) cover the imperfect, future, conditional, subjunctive
// and regular passato remoto with near-zero noun collisions. What they cannot
// cover is the present tense and the STRONG passato remoto, whose endings
// (-o, -a, -e, -i) are indistinguishable from ordinary nouns. Those are listed.
const FINITE_LEXICON = new Set([
  ...AUX,
  // dire · fare · andare · vedere · sapere
  'dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono', 'disse', 'dissero', 'dica', 'dicano',
  'dissi', 'vidi', 'feci', 'venni', 'presi', 'stetti',
  'faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno', 'fece', 'fecero', 'faccia', 'facciano',
  'vado', 'vai', 'va', 'andiamo', 'andate', 'vanno', 'vada', 'vadano',
  'vedo', 'vedi', 'vede', 'vediamo', 'vedete', 'vedono', 'vide', 'videro', 'veda', 'vedano',
  'so', 'sai', 'sa', 'sappiamo', 'sapete', 'sanno', 'seppe', 'seppero', 'sappia',
  // modals
  'posso', 'puoi', 'può', 'possiamo', 'potete', 'possono', 'poté', 'possa', 'possano',
  'devo', 'devi', 'deve', 'dobbiamo', 'dovete', 'devono', 'dovette', 'debba', 'debbano',
  'voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono', 'volle', 'vollero', 'voglia', 'vogliano',
  // dare · stare · rimanere · tenere · porre
  'do', 'dà', 'diamo', 'danno', 'diede', 'diedero', 'dette', 'dettero', 'dia', 'diano',
  'sto', 'stai', 'stia', 'stiano', 'stiamo', 'stette',
  'rimane', 'rimangono', 'rimase', 'rimasero',
  'tiene', 'tengono', 'tenne', 'tennero',
  'pone', 'pongono', 'pose', 'posero',
  // strong passato remoto — the narrative spine of CEI
  'prendo', 'prende', 'prendono', 'prese', 'presero',
  'metto', 'mette', 'mettono', 'mise', 'misero',
  'scelgo', 'sceglie', 'scelgono', 'scelse', 'scelsero',
  'rispondo', 'risponde', 'rispondono', 'rispose', 'risposero',
  'scrivo', 'scrive', 'scrivono', 'scrisse', 'scrissero',
  'leggo', 'leggono', 'lesse', 'lessero', // 'legge' is below, as a homograph
  'chiede', 'chiedono', 'chiese', 'chiesero',
  'nasce', 'nacque', 'nacquero',
  'cade', 'cadde', 'caddero',
  'vive', 'vivono', 'visse', 'vissero',
  'muore', 'muoiono',
  'conosce', 'conoscono', 'conobbe', 'conobbero',
  'cresce', 'crebbe', 'crebbero',
  'beve', 'bevve', 'bevvero',
  'pare', 'parve', 'parvero',
  'appare', 'apparve', 'apparvero',
  'piace', 'piacciono', 'piacque',
  'vince', 'vinse', 'vinsero',
  'giunge', 'giunse', 'giunsero',
  'accoglie', 'accolse', 'accolsero',
  'coglie', 'colse', 'colsero',
  'volge', 'volse', 'volsero',
  'piange', 'pianse', 'piansero',
  'spinge', 'spinse', 'spinsero',
  'chiude', 'chiuse', 'chiusero',
  'avvolge', 'avvolse', 'avvolsero',
  'perde', 'perse', 'persero',
  'corre', 'corse', 'corsero',
  'decide', 'decise', 'decisero',
  'uccide', 'uccise', 'uccisero',
  'distrugge', 'distrusse', 'distrussero',
  'conduce', 'condusse', 'condussero',
  'traduce', 'tradusse',
  'scende', 'scendi', 'scendono', 'scese', 'scesero',
  'divide', 'divise', 'divisero',
  'espone', 'espose', 'esposero',
  'concede', 'conceda', 'concedano', 'concesse', 'concessero',
  'vale', 'valgono', 'valga',
  'possiedo', 'possiede', 'possiedono',
  'vuol', 'suole', 'alzati', 'àlzati', 'goditi',
  // high-frequency regular presents with no common noun homograph
  'prega', 'parla', 'ascolta', 'annuncia', 'annuncio', 'cammina', 'perdona', 'comanda',
  'insegna', 'battezza', 'predica', 'racconta', 'ringrazia', 'ama', 'amano',
  'mando', 'rendo', 'esorto', 'respira', 'respirano',
  'crede', 'credo', 'temo', 'teme', 'segue', 'seguo', 'vengo', 'vieni',
]);

// Verbs that are also ordinary nouns. They stay in the finite lexicon — the
// determiner rule in analyze() is what tells "porta molto frutto" (it bears
// fruit) from "la porta" (the door), so they are only ever read as verbs when
// no determiner precedes them.
const NOUN_HOMOGRAPH_VERBS = new Set([
  'porta', 'portano', 'legge', 'leggi', 'lava', 'guida', 'opera', 'cura',
  'grida', 'canta', 'ordina', 'pesca', 'conta', 'firma', 'posa', 'piega',
]);
for (const w of NOUN_HOMOGRAPH_VERBS) FINITE_LEXICON.add(w);

// ── suffix rules ─────────────────────────────────────────────────────────────
// Each rule is [regex, minLength]. Collisions are handled by NOT_FINITE below.
const FINITE_SUFFIXES = [
  [/(?:av|ev|iv)(?:o|i|a|amo|ate|ano)$/, 5],          // imperfetto
  [/r(?:ò|ai|à|emo|ete|anno|ei|esti|ebbe|emmo|este|ebbero)$/, 5], // futuro / condizionale
  [/(?:ò|ì)$/, 3],                                     // passato remoto 3sg -are/-ire
  [/ai$/, 5],                                          // passato remoto 1sg -are
  [/(?:arono|erono|irono|ettero)$/, 6],                // passato remoto 3pl regolare
  [/(?:ssero|ssimo)$/, 6],                             // congiuntivo/pass. rem. forte pl
  [/(?:asse|esse|isse)$/, 5],                          // congiuntivo imperfetto sg
  [/iamo$/, 5],                                        // 1a plurale
  [/(?:ate|ite|ete)$/, 5],                             // 2a plurale / imperativo
  [/(?:ano|ono)$/, 5],                                 // 3a plurale presente
];

// Words a FINITE_SUFFIXES rule would flag that are not verbs in this register.
// Built empirically from the course corpus (see the corpus-sanity tests).
const NOT_FINITE = new Set([
  // -ano / -ono nouns and adjectives
  'romano', 'romani', 'cristiano', 'italiano', 'lontano', 'umano', 'sovrano',
  'invano', 'pagano', 'anziano', 'piano', 'soprano', 'oceano', 'organo',
  'platano', 'gabbano', 'trono', 'suono', 'abbandono', 'perdono', 'colono',
  'contorno', 'diacono', 'diaconi', 'sermone', 'padrono',
  // -anno / -emo collisions with the future rule
  'anno', 'inganno', 'affanno', 'tiranno', 'malanno', 'panno',
  'estremo', 'supremo', 'remo',
  // accented finals that are not passato remoto
  'però', 'perciò', 'ciò', 'falò', 'comò', 'lì', 'sì', 'così', 'giù', 'più',
  // -ai collisions with the passato remoto rule
  'granai', 'ormai', 'assai', 'guai', 'ahimè',
  // -asse / -esse / -isse collisions
  'classe', 'promesse', 'interesse', 'spesse', 'fesse',
  // -ete collisions
  'parete', 'pareti', 'monete', 'quiete', 'profete', 'comete',
  // -iva / -ivi collisions
  'oliva', 'olive', 'gengiva', 'privi', 'privo',
  // -ssimo collision
  'prossimo', 'prossima',
  // -ano proper nouns and gentilics (frequent in this corpus)
  'pubblicano', 'pubblicani', 'samaritano', 'samaritani', 'stefano',
  'giordano', 'buono', 'buoni',
  // -ei collision with the conditional rule
  'ebrei', 'ebreo',
  // -esse collision
  'profetesse',
  // -ate / -ite nouns and adjectives
  'estate', 'patate', 'polite', 'mite',
]);

export function isFiniteVerb(word) {
  const w = stripElision(word);
  if (!w) return false;
  if (NOT_FINITE.has(w)) return false;
  if (FINITE_LEXICON.has(w)) return true;
  if (FINITE_SUFFIXES.some(([re, min]) => w.length >= min && re.test(w))) return true;
  // Last chance: an imperative that swallowed its pronoun ("lodàtelo").
  // Only the lexicon and the *imperative* endings may apply to a stripped stem:
  // running the full suffix table over one turns "diavolo" into "diavo" and
  // "meritevole" into "meritevo", both of which look like an imperfetto.
  const stem = stripClitics(w);
  if (stem === w || NOT_FINITE.has(stem)) return false;
  return FINITE_LEXICON.has(stem) || (stem.length >= 5 && /(?:iamo|ate|ite|ete)$/.test(stem));
}

// ── past participles ─────────────────────────────────────────────────────────
// Strong participles have no usable ending pattern, so they are listed; the
// weak families (-ato/-uto/-ito and their gender/number variants) are matched
// by suffix minus the noun stoplist.
const PARTICIPLE_LEXICON = new Set([
  'detto', 'detta', 'detti', 'dette',
  'fatto', 'fatta', 'fatti', 'fatte',
  'visto', 'vista', 'visti', 'viste',
  'preso', 'presa', 'presi', 'prese',
  'messo', 'messa', 'messi', // 'messe' omitted: harvest / Mass
  'scelto', 'scelta', 'scelti', 'scelte',
  'scritto', 'scritta', 'scritti', 'scritte',
  'letto', 'letta', 'letti', 'lette',
  'chiesto', 'chiesta', 'chiesti', 'chieste',
  'risposto', 'risposti', 'risposte', // 'risposta' omitted: the noun
  'morto', 'morta', 'morti', // 'morte' omitted: the noun
  'nato', 'nata', 'nati', 'nate',
  'rimasto', 'rimasta', 'rimasti', 'rimaste',
  'aperto', 'aperta', 'aperti', 'aperte',
  'offerto', 'offerti', 'offerte', // 'offerta' omitted: the noun
  'sofferto', 'sofferta', 'sofferti', 'sofferte',
  'corso', 'corsa', 'corsi', 'corse',
  'perso', 'persa', 'persi', 'perse',
  'chiuso', 'chiusa', 'chiusi', 'chiuse',
  'deciso', 'decisa', 'decisi', 'decise',
  'ucciso', 'uccisa', 'uccisi', 'uccise',
  'vinto', 'vinta', 'vinti', 'vinte',
  'giunto', 'giunta', 'giunti', 'giunte',
  'spinto', 'spinta', 'spinti', 'spinte',
  'distrutto', 'distrutta', 'distrutti', 'distrutte',
  'condotto', 'condotti', 'condotte', // 'condotta' omitted: the noun
  'posto', 'posti', 'poste', // 'posta' omitted: the noun
  'composto', 'composta', 'composti', 'composte',
  'rotto', 'rotta', 'rotti', 'rotte',
  'accolto', 'accolta', 'accolti', 'accolte',
  'colto', 'colta', 'colti', 'colte',
  'raccolto', 'raccolta', 'raccolti', 'raccolte',
  'volto', 'volti', // 'volta'/'volte' omitted: the noun
  'sepolto', 'sepolta', 'sepolti', 'sepolte',
  'crocifisso', 'crocifissa', 'crocifissi', 'crocifisse',
  'concepito', 'concepita', 'concepiti', 'concepite',
  'sceso', 'scesa', 'scesi', 'scese',
  'diviso', 'divisa', 'divisi', 'divise',
  'giaciuto', 'apparso', 'apparsa', 'apparsi', 'apparse',
  'rimesso', 'rimessa', 'rimessi', 'rimesse',
  // Short weak participles that fall under the 5-char suffix guard. Only the
  // masculine singular is safe: "data"/"dati"/"date" are the noun and the verb.
  'dato',
  // Genuine -iti participles, now that the suffix rule no longer takes -iti.
  'fuggiti', 'riuniti', 'saliti', 'usciti', 'partiti', 'finiti',
]);

// Two endings are deliberately absent.
//   -e  : a weak feminine-plural participle ("gettate") is homographic with a
//         2nd-person plural verb ("lodate"), and the verb reading is ~6x more
//         common in this corpus.
//   -iti: homographic with the 2nd-person singular of -itare/-uitare verbs.
//         "perché mi perseguiti?" is "why do you persecute me?", not a
//         participle — caught in the browser on the Acts 9 passage.
// Strong participles with those endings ("aperte", "scese", "fuggiti") stay
// reachable through PARTICIPLE_LEXICON.
const PARTICIPLE_SUFFIX = /(?:(?:at|ut)[oai]|it[oa])$/;

// Nouns/adjectives/adverbs the participle suffix would otherwise flag.
const NOT_PARTICIPLE = new Set([
  'peccato', 'peccati', 'senato', 'prato', 'prati', 'mercato', 'mercati',
  'avvocato', 'apostolato', 'palato', 'fato', 'bucato', 'ducato',
  'salute', 'virtute', 'estate', 'patate',
  'spirito', 'spiriti', 'subito', 'partito', 'partiti', 'vestito', 'vestiti',
  'marito', 'mariti', 'rito', 'riti', 'sito', 'invito', 'appetito', 'debito',
  'infinito', 'gomito', 'cubito', 'transito', 'deposito',
  // nouns and adjectives the -ato/-uto/-ito families catch
  'nascita', 'unigenito', 'paraclito', 'sabato', 'abiti', 'abito',
  'ipocriti', 'ipocrita', 'saluti', 'saluto', 'flauto', 'esiti', 'esito',
  'principati', 'principato', 'beati', 'beato', 'beata', 'beate',
  'corsa', 'volta', 'volte', 'morte', 'posta', 'offerta', 'risposta',
  'condotta', 'alzati', 'àlzati', 'goditi', 'dissoluto', 'dissoluta',
]);

// Participles that double as everyday nouns. They may still be read as the
// participle half of a compound tense ("ha visto", "sono morti"), but never on
// their own as a reduced relative — "la vista" is sight, "un posto" is a place,
// "tra i morti" is among the dead. See the bare-participle rule in analyze().
const NOUN_PARTICIPLES = new Set([
  'vista', 'viste', 'posto', 'posti', 'morto', 'morta', 'morti',
  'fatto', 'fatti', 'detto', 'letto', 'stato', 'stati', 'corso', 'corsi',
]);

export function isParticiple(word) {
  const w = stripElision(word);
  if (!w) return false;
  // "all'aperto", "dell'amato": what follows an elided article heads a noun
  // phrase, so it is never the reduced relative this module is hunting for.
  if (hasElision(word)) return false;
  if (NOT_PARTICIPLE.has(w)) return false;
  if (PARTICIPLE_LEXICON.has(w)) return true;
  return w.length >= 5 && PARTICIPLE_SUFFIX.test(w);
}

// ── gerunds and infinitives ──────────────────────────────────────────────────
// Both mark a stretch of text as *content* rather than an aside: a gerund heads
// an implicit clause worth collapsing, an infinitive heads a complement that
// must be read. Neither is ever a finite verb.
const NOT_GERUND = new Set(['quando', 'bando', 'mando', 'rendo', 'stendo', 'spendo']);

export function isGerund(word) {
  const w = stripClitics(stripElision(word));
  return w.length >= 6 && /(?:ando|endo)$/.test(w) && !NOT_GERUND.has(w);
}

const NOT_INFINITIVE = new Set([
  'altare', 'altari', 'cesare', 'mare', 'carcere', 'carceriere', 'lettere',
  'maniere', 'opere', 'sere', 'torre', 'polvere', 'camere', 'febbre', 'cifre',
  'argentiere', 'diversi', 'avversi',
]);

export function isInfinitive(word) {
  const w = stripElision(word);
  if (hasElision(word)) return false; // "l'argentiere" is a silversmith
  if (w.length < 4 || NOT_INFINITIVE.has(w)) return false;
  return /(?:[aei]re|[aei]rsi)$/.test(w);
}

// ── determiners and function words ───────────────────────────────────────────
// A word immediately after a determiner is a noun: this single rule is what
// separates "la vista" from "la vide", "un posto" from "ha posto", and "la
// porta" from "porta molto frutto".
//
// DETERMINERS holds only forms that cannot also be a proclitic pronoun, so they
// block BOTH the finite and the participle reading. CLITIC_OR_ARTICLE holds
// lo/la/le/gli/li, which are articles before a noun but object pronouns before
// a verb — they block only the participle reading ("la vista"), never the verb
// one ("gli disse"), which is why they are kept apart.
const ARTICLES = new Set(['il', 'i', 'un', 'uno', 'una']);

// Articulated prepositions: determiners for the noun rule, prepositions for the
// aside rule, which is why they are kept as their own set.
const ARTICULATED = new Set([
  'del', 'dello', 'della', 'dei', 'degli', 'delle',
  'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  'col', 'coi',
]);

const POSSESSIVES = new Set([
  'mio', 'mia', 'miei', 'mie', 'tuo', 'tua', 'tuoi', 'tue',
  'suo', 'sua', 'suoi', 'sue', 'nostro', 'nostra', 'nostri', 'nostre',
  'vostro', 'vostra', 'vostri', 'vostre',
]);

const DETERMINERS = new Set([...ARTICLES, ...ARTICULATED, ...POSSESSIVES]);

const CLITIC_OR_ARTICLE = new Set(['lo', 'la', 'le', 'gli', 'li']);

export function isDeterminer(word) {
  return DETERMINERS.has(stripElision(word));
}

// Coordinators: a segment opening with one continues the sentence, it does not
// interrupt it ("né angeli né principati, né presente né avvenire").
const COORDINATORS = new Set([
  'e', 'ed', 'o', 'od', 'oppure', 'né', 'ma', 'anzi', 'ossia', 'ovvero',
]);

// Relatives and subordinating conjunctions: a segment opening with one is a
// clause whose verb we simply failed to recognise — never an aside.
const SUBORDINATORS = new Set([
  'che', 'chi', 'cui', 'quando', 'qualora', 'perché', 'poiché', 'giacché',
  'se', 'mentre', 'dove', 'come', 'quale', 'quali', 'affinché', 'benché',
  'sebbene', 'finché', 'appena', 'purché', 'quanto', 'quanti', 'ove',
]);

// Object/reflexive clitics and the negator: all of them lean on a verb, so a
// segment opening with one is a clause, not an aside ("vi annuncio…").
const PROCLITICS = new Set([
  'mi', 'ti', 'ci', 'vi', 'si', 'ne', 'gli', 'lo', 'la', 'li', 'le', 'non',
]);

const PREPOSITIONS = new Set([
  'di', 'a', 'ad', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'sotto', 'sopra', 'senza', 'verso', 'presso', 'dopo', 'prima', 'durante',
  'secondo', 'mediante', 'contro', 'dentro', 'fuori', 'oltre', 'entro',
  'circa', 'attraverso', 'lungo', 'dietro', 'davanti', 'insieme',
  ...ARTICULATED, // the articulated forms (nel, dalla, sugli …) head a phrase too
]);

// Time adverbs. A segment ending in one is a temporal frame ("Pochi giorni
// dopo, il figlio più giovane, …"), so the noun phrase after it is the SUBJECT
// of the sentence, not an apposition to anything — see the antecedent test.
const TIME_ADVERBS = new Set([
  'dopo', 'prima', 'poi', 'oggi', 'ieri', 'domani', 'ora', 'allora',
  'presto', 'tardi', 'fa', 'intanto', 'frattanto',
]);

// ── analysis ─────────────────────────────────────────────────────────────────
// How far back a participle may look for its auxiliary. "è stato dato",
// "non fu mai scartata" — two intervening words is enough in practice.
const AUX_LOOKBACK = 2;

const SENTENCE_STOP = /[.;:!?…»«"]/;

/**
 * Analyze one sentence.
 *
 * Returns `{ tokens, finiteCount, hasParenthetical }` where each token is
 * `{ text, isWord, role, dim }`:
 *   role 'finite'      — a conjugated verb: the spine of a clause
 *   role 'compound'    — a participle leaning on an auxiliary (still spine)
 *   role 'participle'  — a bare participle: a reduced relative clause
 *   role 'plain'       — everything else
 *   dim  true          — inside a comma-delimited aside (see isAsideSegment)
 *
 * `finiteCount` is the clause count: the number of finite verbs, which is what
 * the reader is being taught to count first.
 */
export function analyze(text) {
  const tokens = tokenize(String(text ?? '')).map((t) => ({
    ...t,
    role: 'plain',
    dim: false,
  }));

  const wordIdx = [];
  tokens.forEach((t, i) => { if (t.isWord) wordIdx.push(i); });

  // Pass 1 — roles, in context. A word preceded by a determiner is a noun, so
  // it is left plain even when its form is a perfectly good verb or participle.
  wordIdx.forEach((i, n) => {
    const prev = n > 0 ? stripElision(tokens[wordIdx[n - 1]].text) : '';
    const afterDeterminer = DETERMINERS.has(prev);
    const afterArticleOrClitic = afterDeterminer || CLITIC_OR_ARTICLE.has(prev);
    const w = stripElision(tokens[i].text);

    if (!isFiniteVerb(tokens[i].text)) return;
    // "la porta" / "la legge": a homograph after any article is the noun.
    if (afterDeterminer || (afterArticleOrClitic && NOUN_HOMOGRAPH_VERBS.has(w))) return;
    tokens[i].role = 'finite';
  });

  wordIdx.forEach((i, n) => {
    if (tokens[i].role === 'finite') return;
    if (!isParticiple(tokens[i].text)) return;
    const prev = n > 0 ? stripElision(tokens[wordIdx[n - 1]].text) : '';
    const leansOnAux = wordIdx
      .slice(Math.max(0, n - AUX_LOOKBACK), n)
      .some((j) => isAuxiliary(tokens[j].text));
    if (leansOnAux) { tokens[i].role = 'compound'; return; }
    // Bare participle = reduced relative, but only when nothing marks it as a
    // noun: "la vista", "un posto", "i morti" are nouns, not clauses.
    if (DETERMINERS.has(prev) || CLITIC_OR_ARTICLE.has(prev)) return;
    if (NOUN_PARTICIPLES.has(stripElision(tokens[i].text))) return;
    tokens[i].role = 'participle';
  });

  // Pass 2 — asides. Split the token stream on commas and on sentence stops; a
  // segment comma-delimited on BOTH sides is a candidate, and isAsideSegment
  // decides whether it is really an aside or just content that happens to sit
  // between commas.
  const segments = [];
  let start = 0;
  let leftComma = false;
  tokens.forEach((t, i) => {
    if (t.isWord) return;
    const stop = SENTENCE_STOP.test(t.text);
    const comma = t.text.includes(',');
    if (!stop && !comma) return;
    segments.push({ start, end: i, closedLeft: leftComma, closedRight: !stop && comma });
    start = i + 1;
    leftComma = !stop && comma;
  });
  segments.push({ start, end: tokens.length, closedLeft: leftComma, closedRight: false });

  segments.forEach((seg) => {
    seg.words = tokens.slice(seg.start, seg.end).filter((t) => t.isWord);
    seg.head = seg.words.length ? stripElision(seg.words[0].text) : '';
  });

  let hasParenthetical = false;
  segments.forEach((seg, i) => {
    if (!seg.closedLeft || !seg.closedRight) return;
    const prev = seg.closedLeft ? segments[i - 1] : null;
    const next = segments[i + 1];
    if (!isAsideSegment(seg, prev, next)) return;
    hasParenthetical = true;
    for (let j = seg.start; j < seg.end; j++) tokens[j].dim = true;
  });

  return {
    tokens,
    finiteCount: tokens.filter((t) => t.role === 'finite').length,
    hasParenthetical,
  };
}

// An aside is material the reader can lift out and still have a sentence. The
// first version of this test was "comma-delimited and verbless", which also
// caught coordinated lists ("con tutta la tua anima, con tutta la tua forza")
// and infinitive complements ("ad offrire i vostri corpi") — dimming those told
// the reader to skip the substance. Each guard below removes one such class,
// and every guard only ever *prevents* dimming: a missed aside is invisible, a
// wrong one is misleading.
function isAsideSegment(seg, prev, next) {
  const words = seg.words;
  if (!words.length) return false;
  // A verb of its own makes it a clause, not an aside.
  if (words.some((t) => t.role === 'finite' || t.role === 'compound')) return false;
  const head = seg.head;
  if (COORDINATORS.has(head)) return false;   // continues the sentence
  if (SUBORDINATORS.has(head)) return false;  // a clause whose verb we missed
  if (PROCLITICS.has(head)) return false;     // leans on a verb we missed
  if (words.some((t) => isInfinitive(t.text))) return false; // a complement

  // An implicit clause — gerund or bare participle — is an aside at any length:
  // "pernottando all'aperto", "i piedi e le mani legati con bende".
  const implicit = words.some((t) => t.role === 'participle' || isGerund(t.text));
  if (implicit) return true;

  // Everything below is a phrase, not a clause, so it only qualifies if it is
  // short, and if a relative or conjunction anywhere inside it does not betray
  // a clause whose verb went undetected ("per quanto si preoccupi").
  if (words.length > 6) return false;
  if (words.some((t) => SUBORDINATORS.has(stripElision(t.text)))) return false;

  if (PREPOSITIONS.has(head)) {
    // A prepositional phrase that rhymes with its neighbour is a list item, not
    // an aside: "con tutto il tuo cuore, con tutta la tua anima, con tutta…".
    if (prev?.head === head || next?.head === head) return false;
    // …and so is one that coordinates inside itself.
    if (words.some((t) => COORDINATORS.has(stripElision(t.text)))) return false;
    return true;
  }

  // A noun phrase between commas is an apposition or a vocative — "Tommaso,
  // uno dei Dodici, chiamato Dìdimo" — but it is just as often a plain
  // argument of the verb ("vidi, o re, una luce, più splendente del sole") or
  // the subject itself. Two tests keep those out:
  //   · a bare determiner + noun ("una luce") is too short to be an apposition;
  //     a real one carries a postmodifier ("uno dei Dodici").
  //   · an apposition needs something to be in apposition TO, so the stretch
  //     before the comma must be able to end a noun phrase. After a temporal
  //     frame ("Pochi giorni dopo,") what follows is the subject, not an aside.
  //     One-word vocatives and adjectives ("fratelli", "tremante") are exempt:
  //     they are asides wherever they land.
  if (ARTICLES.has(head) && words.length < 3) return false;
  if (words.length > 1) {
    const before = prev?.words?.[prev.words.length - 1];
    const tail = before ? stripElision(before.text) : '';
    if (!before) return false;
    if (COORDINATORS.has(tail) || PREPOSITIONS.has(tail) || TIME_ADVERBS.has(tail)) return false;
  }
  return true;
}

// Clause count for a sentence — the "how many verbs can you find?" metric.
export function clauseCount(text) {
  return analyze(text).finiteCount;
}
