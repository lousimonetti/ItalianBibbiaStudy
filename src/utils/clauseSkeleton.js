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
// Pure + unit-tested. No course data is imported: this is language-level logic
// for `config.locale.target === 'it-IT'`, and the caller decides when to use it.

import { tokenize } from './vocabIndex';

const lower = (w) => String(w ?? '').toLowerCase();

// Strip a leading elided article/preposition so "l'anno" is tested as "anno"
// and "dell'uomo" as "uomo" — otherwise the -anno future rule fires on a noun.
export function stripElision(word) {
  const m = lower(word).match(/^(?:[a-zà-ÿ]{1,4})['’](.+)$/);
  return m ? m[1] : lower(word);
}

// ── auxiliaries ──────────────────────────────────────────────────────────────
// Finite forms of essere/avere (plus venire/andare, which build the passive in
// biblical register: "venne battezzato", "andò perduto"). A participle leaning
// on one of these is part of a compound tense — spine, not a reduced relative.
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
  'sto', 'stai', 'sta', 'stiamo', 'stanno', 'stette', 'stia', 'stiano',
  'rimane', 'rimangono', 'rimase', 'rimasero',
  'tiene', 'tengono', 'tenne', 'tennero',
  'pone', 'pongono', 'pose', 'posero',
  // strong passato remoto — the narrative spine of CEI
  'prendo', 'prende', 'prendono', 'prese', 'presero',
  'metto', 'mette', 'mettono', 'mise', 'misero',
  'scelgo', 'sceglie', 'scelgono', 'scelse', 'scelsero',
  'rispondo', 'risponde', 'rispondono', 'rispose', 'risposero',
  'scrivo', 'scrive', 'scrivono', 'scrisse', 'scrissero',
  'leggo', 'leggono', 'lesse', 'lessero', // 'legge' omitted: "la legge" dominates here
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
  'perde', 'perse', 'persero',
  'corre', 'corse', 'corsero',
  'decide', 'decise', 'decisero',
  'uccide', 'uccise', 'uccisero',
  'distrugge', 'distrusse', 'distrussero',
  'conduce', 'condusse', 'condussero',
  'traduce', 'tradusse',
  'vuol', 'suole', 'alzati', 'àlzati', 'goditi',
  // high-frequency regular presents with no common noun homograph
  'prega', 'parla', 'ascolta', 'annuncia', 'cammina', 'perdona', 'comanda',
  'insegna', 'battezza', 'predica', 'racconta', 'ringrazia',
  'crede', 'credo', 'temo', 'teme', 'segue', 'seguo', 'vengo', 'vieni',
]);

// ── suffix rules ─────────────────────────────────────────────────────────────
// Each rule is [regex, minLength]. Collisions are handled by NOT_FINITE below.
const FINITE_SUFFIXES = [
  [/(?:av|ev|iv)(?:o|i|a|amo|ate|ano)$/, 5],          // imperfetto
  [/r(?:ò|ai|à|emo|ete|anno|ei|esti|ebbe|emmo|este|ebbero)$/, 5], // futuro / condizionale
  [/(?:ò|ì)$/, 3],                                     // passato remoto 3sg -are/-ire
  [/(?:arono|erono|irono|ettero)$/, 6],                // passato remoto 3pl regolare
  [/(?:ssero|ssimo)$/, 6],                             // congiuntivo/pass. rem. forte pl
  [/(?:asse|esse|isse)$/, 5],                          // congiuntivo imperfetto sg
  [/iamo$/, 5],                                        // 1a plurale
  [/(?:ate|ite)$/, 5],                                 // 2a plurale / imperativo
  [/(?:ano|ono)$/, 5],                                 // 3a plurale presente
];

// Words a FINITE_SUFFIXES rule would flag that are not verbs in this register.
// Built empirically from the course corpus (scripts/audit-skeleton.mjs).
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
  // -asse / -esse / -isse collisions
  'classe', 'promesse', 'interesse', 'spesse', 'fesse',
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
  return FINITE_SUFFIXES.some(([re, min]) => w.length >= min && re.test(w));
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
  'volto', 'volti', // 'volta'/'volte' omitted: the noun
  'sepolto', 'sepolta', 'sepolti', 'sepolte',
  'crocifisso', 'crocifissa', 'crocifissi', 'crocifisse',
  'concepito', 'concepita', 'concepiti', 'concepite',
  'sceso', 'scesa', 'scesi', 'scese',
  'giaciuto', 'apparso', 'apparsa', 'apparsi', 'apparse',
  'rimesso', 'rimessa', 'rimessi', 'rimesse',
  // Short weak participles that fall under the 5-char suffix guard. Only the
  // masculine singular is safe: "data"/"dati"/"date" are the noun and the verb.
  'dato',
]);

// Note the missing 'e': a weak feminine-plural participle ("gettate") is
// homographic with a 2nd-person plural verb ("lodate"), and the audit found the
// verb reading six times more common in this corpus. Strong -e participles
// ("aperte", "scese") stay reachable through PARTICIPLE_LEXICON.
const PARTICIPLE_SUFFIX = /(?:at|ut|it)[oai]$/;

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
  'condotta', 'alzati', 'àlzati', 'goditi',
]);

export function isParticiple(word) {
  const w = stripElision(word);
  if (!w) return false;
  if (NOT_PARTICIPLE.has(w)) return false;
  if (PARTICIPLE_LEXICON.has(w)) return true;
  return w.length >= 5 && PARTICIPLE_SUFFIX.test(w);
}

// ── analysis ─────────────────────────────────────────────────────────────────
// How far back a participle may look for its auxiliary. "è stato dato",
// "non fu mai scartata" — two intervening words is enough in practice.
const AUX_LOOKBACK = 2;

/**
 * Analyze one sentence.
 *
 * Returns `{ tokens, finiteCount, hasParenthetical }` where each token is
 * `{ text, isWord, role, dim }`:
 *   role 'finite'      — a conjugated verb: the spine of a clause
 *   role 'compound'    — a participle leaning on an auxiliary (still spine)
 *   role 'participle'  — a bare participle: a reduced relative clause
 *   role 'plain'       — everything else
 *   dim  true          — inside a comma-delimited stretch with no finite verb
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

  // Pass 1 — roles. Finite first, then participles (which need to see whether
  // an auxiliary precedes them).
  for (const i of wordIdx) {
    if (isFiniteVerb(tokens[i].text)) tokens[i].role = 'finite';
  }
  wordIdx.forEach((i, n) => {
    if (tokens[i].role === 'finite') return;
    if (!isParticiple(tokens[i].text)) return;
    const leansOnAux = wordIdx
      .slice(Math.max(0, n - AUX_LOOKBACK), n)
      .some((j) => isAuxiliary(tokens[j].text));
    tokens[i].role = leansOnAux ? 'compound' : 'participle';
  });

  // Pass 2 — parentheticals. Split the token stream on commas; a segment that
  // is comma-delimited on BOTH sides and holds no finite verb is an aside.
  const segments = [];
  let start = 0;
  tokens.forEach((t, i) => {
    if (!t.isWord && t.text.includes(',')) {
      segments.push({ start, end: i, closedLeft: start > 0, closedRight: true });
      start = i + 1;
    }
  });
  segments.push({ start, end: tokens.length, closedLeft: start > 0, closedRight: false });

  let hasParenthetical = false;
  for (const seg of segments) {
    if (!seg.closedLeft || !seg.closedRight) continue;
    const slice = tokens.slice(seg.start, seg.end);
    if (!slice.some((t) => t.isWord)) continue;
    if (slice.some((t) => t.role === 'finite' || t.role === 'compound')) continue;
    hasParenthetical = true;
    for (let i = seg.start; i < seg.end; i++) tokens[i].dim = true;
  }

  return {
    tokens,
    finiteCount: tokens.filter((t) => t.role === 'finite').length,
    hasParenthetical,
  };
}

// Clause count for a sentence — the "how many verbs can you find?" metric.
export function clauseCount(text) {
  return analyze(text).finiteCount;
}
