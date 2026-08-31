// Verb-form recognition — the reading tenses this course reads but never taught.
//
// The syllabus teaches the passato prossimo (weeks 8–10) and the imperfetto
// (week 11). The narrative spine of CEI is the PASSATO REMOTO, and its
// background layer is the TRAPASSATO PROSSIMO. Neither is ever taught, which is
// survivable in the Gospels (short paratactic clauses, heavy repetition) and
// stops being survivable in Acts, where the narrative runs fast and the speeches
// stack tenses. Week 37's exegesis note names the gap; this dataset closes it.
//
// The goal is RECOGNITION, not production: modern spoken Italian, especially in
// the north, barely uses the passato remoto. A reader needs to map a form back
// to its infinitive in under a second, which is the single question every item
// asks. `pp` carries the passato prossimo the learner already owns, so each item
// is a bridge from the known tense to the unknown one rather than a cold fact.
//
// Every `form` below appears in this course's own passages, example sentences or
// prayers — verified against the corpus, not invented.

export const FORM_CATEGORIES = {
  'remoto-forte': {
    it: 'Passato remoto forte',
    en: 'irregular passato remoto (3rd singular)',
    tip: 'Irregular verbs are irregular in only three slots — io, lui/lei, loro. Narrative uses the last two, so you learn one form per verb.',
  },
  'remoto-plurale': {
    it: 'Passato remoto plurale',
    en: '3rd plural — built from the singular',
    tip: 'The 3rd plural is the 3rd singular plus -ro: disse → dissero, fece → fecero, ebbe → ebbero. The one exception is fu → furono.',
  },
  'remoto-regolare': {
    it: 'Passato remoto regolare',
    en: 'regular -are / -ire passato remoto',
    tip: 'Regular verbs are transparent: -are gives -ò / -arono, -ire gives -ì / -irono. The accent is the whole signal.',
  },
  trapassato: {
    it: 'Trapassato prossimo',
    en: 'the past behind the past',
    tip: 'Imperfetto of essere/avere + participle = "had done". You already know both halves; nobody put them together for you.',
  },
};

export const VERB_FORMS = [
  // ── strong passato remoto, 3rd singular ───────────────────────────────────
  { form: 'disse', inf: 'dire', cat: 'remoto-forte', en: 'said', pp: 'ha detto' },
  { form: 'fece', inf: 'fare', cat: 'remoto-forte', en: 'did, made', pp: 'ha fatto' },
  { form: 'venne', inf: 'venire', cat: 'remoto-forte', en: 'came', pp: 'è venuto' },
  { form: 'vide', inf: 'vedere', cat: 'remoto-forte', en: 'saw', pp: 'ha visto' },
  { form: 'prese', inf: 'prendere', cat: 'remoto-forte', en: 'took', pp: 'ha preso' },
  { form: 'mise', inf: 'mettere', cat: 'remoto-forte', en: 'put', pp: 'ha messo' },
  { form: 'scelse', inf: 'scegliere', cat: 'remoto-forte', en: 'chose', pp: 'ha scelto',
    note: 'Acts 6: "scelsero sette uomini" — the community chose the seven deacons.' },
  { form: 'rispose', inf: 'rispondere', cat: 'remoto-forte', en: 'answered', pp: 'ha risposto' },
  { form: 'chiese', inf: 'chiedere', cat: 'remoto-forte', en: 'asked', pp: 'ha chiesto',
    note: 'Do not read this as "chiese" the noun (churches) — same spelling, different word.' },
  { form: 'scrisse', inf: 'scrivere', cat: 'remoto-forte', en: 'wrote', pp: 'ha scritto' },
  { form: 'lesse', inf: 'leggere', cat: 'remoto-forte', en: 'read', pp: 'ha letto' },
  { form: 'fu', inf: 'essere', cat: 'remoto-forte', en: 'was', pp: 'è stato',
    note: 'The Creed is built on it: fu concepito, fu crocifisso, fu sepolto.' },
  { form: 'ebbe', inf: 'avere', cat: 'remoto-forte', en: 'had', pp: 'ha avuto' },
  { form: 'diede', inf: 'dare', cat: 'remoto-forte', en: 'gave', pp: 'ha dato', alt: ['dette'] },
  { form: 'stette', inf: 'stare', cat: 'remoto-forte', en: 'stayed, stood', pp: 'è stato' },
  { form: 'seppe', inf: 'sapere', cat: 'remoto-forte', en: 'knew, found out', pp: 'ha saputo' },
  { form: 'volle', inf: 'volere', cat: 'remoto-forte', en: 'wanted', pp: 'ha voluto' },
  { form: 'nacque', inf: 'nascere', cat: 'remoto-forte', en: 'was born', pp: 'è nato',
    note: 'Creed: "nacque da Maria Vergine".' },
  { form: 'cadde', inf: 'cadere', cat: 'remoto-forte', en: 'fell', pp: 'è caduto' },
  { form: 'rimase', inf: 'rimanere', cat: 'remoto-forte', en: 'remained', pp: 'è rimasto' },
  { form: 'visse', inf: 'vivere', cat: 'remoto-forte', en: 'lived', pp: 'ha vissuto' },
  { form: 'conobbe', inf: 'conoscere', cat: 'remoto-forte', en: 'knew, recognised', pp: 'ha conosciuto' },
  { form: 'tenne', inf: 'tenere', cat: 'remoto-forte', en: 'held', pp: 'ha tenuto' },
  { form: 'pose', inf: 'porre', cat: 'remoto-forte', en: 'placed', pp: 'ha posto' },
  { form: 'vinse', inf: 'vincere', cat: 'remoto-forte', en: 'won, overcame', pp: 'ha vinto',
    note: 'Week 1: "le tenebre non la vinsero" — the darkness did not overcome it.' },
  { form: 'giunse', inf: 'giungere', cat: 'remoto-forte', en: 'arrived', pp: 'è giunto' },
  { form: 'accolse', inf: 'accogliere', cat: 'remoto-forte', en: 'welcomed', pp: 'ha accolto' },
  { form: 'chiuse', inf: 'chiudere', cat: 'remoto-forte', en: 'closed', pp: 'ha chiuso' },
  { form: 'corse', inf: 'correre', cat: 'remoto-forte', en: 'ran', pp: 'ha corso' },
  { form: 'apparve', inf: 'apparire', cat: 'remoto-forte', en: 'appeared', pp: 'è apparso' },
  { form: 'crebbe', inf: 'crescere', cat: 'remoto-forte', en: 'grew', pp: 'è cresciuto' },
  { form: 'condusse', inf: 'condurre', cat: 'remoto-forte', en: 'led', pp: 'ha condotto' },
  { form: 'scese', inf: 'scendere', cat: 'remoto-forte', en: 'came down', pp: 'è sceso',
    note: 'Creed: "discese agli inferi" — the same verb with a prefix.' },
  { form: 'perse', inf: 'perdere', cat: 'remoto-forte', en: 'lost', pp: 'ha perso' },
  { form: 'uccise', inf: 'uccidere', cat: 'remoto-forte', en: 'killed', pp: 'ha ucciso' },
  { form: 'decise', inf: 'decidere', cat: 'remoto-forte', en: 'decided', pp: 'ha deciso' },
  { form: 'piacque', inf: 'piacere', cat: 'remoto-forte', en: 'pleased', pp: 'è piaciuto' },
  { form: 'bevve', inf: 'bere', cat: 'remoto-forte', en: 'drank', pp: 'ha bevuto' },

  // ── 3rd plural: the singular plus -ro ─────────────────────────────────────
  { form: 'dissero', inf: 'dire', cat: 'remoto-plurale', en: 'they said', pp: 'hanno detto',
    note: 'disse + ro. The rule holds for every strong verb here.' },
  { form: 'fecero', inf: 'fare', cat: 'remoto-plurale', en: 'they did, made', pp: 'hanno fatto' },
  { form: 'vennero', inf: 'venire', cat: 'remoto-plurale', en: 'they came', pp: 'sono venuti' },
  { form: 'videro', inf: 'vedere', cat: 'remoto-plurale', en: 'they saw', pp: 'hanno visto' },
  { form: 'presero', inf: 'prendere', cat: 'remoto-plurale', en: 'they took', pp: 'hanno preso' },
  { form: 'misero', inf: 'mettere', cat: 'remoto-plurale', en: 'they put', pp: 'hanno messo' },
  { form: 'scelsero', inf: 'scegliere', cat: 'remoto-plurale', en: 'they chose', pp: 'hanno scelto' },
  { form: 'risposero', inf: 'rispondere', cat: 'remoto-plurale', en: 'they answered', pp: 'hanno risposto' },
  { form: 'ebbero', inf: 'avere', cat: 'remoto-plurale', en: 'they had', pp: 'hanno avuto' },
  { form: 'caddero', inf: 'cadere', cat: 'remoto-plurale', en: 'they fell', pp: 'sono caduti' },
  { form: 'nacquero', inf: 'nascere', cat: 'remoto-plurale', en: 'they were born', pp: 'sono nati' },
  { form: 'vinsero', inf: 'vincere', cat: 'remoto-plurale', en: 'they overcame', pp: 'hanno vinto' },
  { form: 'giunsero', inf: 'giungere', cat: 'remoto-plurale', en: 'they arrived', pp: 'sono giunti' },
  { form: 'apparvero', inf: 'apparire', cat: 'remoto-plurale', en: 'they appeared', pp: 'sono apparsi' },
  { form: 'vollero', inf: 'volere', cat: 'remoto-plurale', en: 'they wanted', pp: 'hanno voluto' },
  { form: 'seppero', inf: 'sapere', cat: 'remoto-plurale', en: 'they found out', pp: 'hanno saputo' },
  { form: 'diedero', inf: 'dare', cat: 'remoto-plurale', en: 'they gave', pp: 'hanno dato', alt: ['dettero'] },
  { form: 'credettero', inf: 'credere', cat: 'remoto-plurale', en: 'they believed', pp: 'hanno creduto' },
  { form: 'furono', inf: 'essere', cat: 'remoto-plurale', en: 'they were', pp: 'sono stati',
    note: 'The exception. Every other verb adds -ro to the singular; essere does not (fu → furono).' },

  // ── regular passato remoto ────────────────────────────────────────────────
  { form: 'tremò', inf: 'tremare', cat: 'remoto-regolare', en: 'shook', pp: 'ha tremato',
    note: 'Acts 4,31: "il luogo in cui erano riuniti tremò".' },
  { form: 'scoppiò', inf: 'scoppiare', cat: 'remoto-regolare', en: 'broke out', pp: 'è scoppiato',
    note: 'Acts 8: "scoppiò una grande persecuzione".' },
  { form: 'andò', inf: 'andare', cat: 'remoto-regolare', en: 'went', pp: 'è andato',
    note: 'Irregular everywhere else, perfectly regular here.' },
  { form: 'parlò', inf: 'parlare', cat: 'remoto-regolare', en: 'spoke', pp: 'ha parlato' },
  { form: 'pregò', inf: 'pregare', cat: 'remoto-regolare', en: 'prayed', pp: 'ha pregato' },
  { form: 'gettò', inf: 'gettare', cat: 'remoto-regolare', en: 'threw', pp: 'ha gettato' },
  { form: 'alzò', inf: 'alzare', cat: 'remoto-regolare', en: 'raised', pp: 'ha alzato' },
  { form: 'annunciò', inf: 'annunciare', cat: 'remoto-regolare', en: 'announced', pp: 'ha annunciato' },
  { form: 'gettarono', inf: 'gettare', cat: 'remoto-regolare', en: 'they threw', pp: 'hanno gettato',
    note: 'Acts 5: "li gettarono in prigione".' },
  { form: 'mangiarono', inf: 'mangiare', cat: 'remoto-regolare', en: 'they ate', pp: 'hanno mangiato' },
  { form: 'cominciarono', inf: 'cominciare', cat: 'remoto-regolare', en: 'they began', pp: 'hanno cominciato' },
  { form: 'andarono', inf: 'andare', cat: 'remoto-regolare', en: 'they went', pp: 'sono andati' },
  { form: 'uscì', inf: 'uscire', cat: 'remoto-regolare', en: 'went out', pp: 'è uscito' },
  { form: 'salì', inf: 'salire', cat: 'remoto-regolare', en: 'went up', pp: 'è salito',
    note: 'Creed: "salì al cielo".' },
  { form: 'partì', inf: 'partire', cat: 'remoto-regolare', en: 'left', pp: 'è partito' },
  { form: 'sentì', inf: 'sentire', cat: 'remoto-regolare', en: 'heard, felt', pp: 'ha sentito' },
  { form: 'udì', inf: 'udire', cat: 'remoto-regolare', en: 'heard', pp: 'ha udito' },
  { form: 'riempì', inf: 'riempire', cat: 'remoto-regolare', en: 'filled', pp: 'ha riempito' },
  { form: 'morì', inf: 'morire', cat: 'remoto-regolare', en: 'died', pp: 'è morto',
    note: 'Creed: "patì sotto Ponzio Pilato, fu crocifisso, morì e fu sepolto".' },
  { form: 'aprirono', inf: 'aprire', cat: 'remoto-regolare', en: 'they opened', pp: 'hanno aperto' },
  { form: 'udirono', inf: 'udire', cat: 'remoto-regolare', en: 'they heard', pp: 'hanno udito' },
  { form: 'salirono', inf: 'salire', cat: 'remoto-regolare', en: 'they went up', pp: 'sono saliti' },
  { form: 'entrarono', inf: 'entrare', cat: 'remoto-regolare', en: 'they entered', pp: 'sono entrati' },

  // ── trapassato prossimo: the past behind the past ─────────────────────────
  { form: 'erano diventati', inf: 'diventare', cat: 'trapassato', en: 'they had become', pp: 'sono diventati',
    note: 'Acts 4,32: "coloro che erano diventati credenti". Imperfetto of essere + participle.' },
  { form: 'aveva detto', inf: 'dire', cat: 'trapassato', en: 'he/she had said', pp: 'ha detto' },
  { form: 'avevano udito', inf: 'udire', cat: 'trapassato', en: 'they had heard', pp: 'hanno udito' },
  { form: 'era venuto', inf: 'venire', cat: 'trapassato', en: 'he had come', pp: 'è venuto' },
  { form: 'avevano visto', inf: 'vedere', cat: 'trapassato', en: 'they had seen', pp: 'hanno visto' },
  { form: 'era uscito', inf: 'uscire', cat: 'trapassato', en: 'he had gone out', pp: 'è uscito' },
  { form: 'aveva fatto', inf: 'fare', cat: 'trapassato', en: 'he/she had done', pp: 'ha fatto' },
  { form: 'avevano creduto', inf: 'credere', cat: 'trapassato', en: 'they had believed', pp: 'hanno creduto' },
  { form: 'era nato', inf: 'nascere', cat: 'trapassato', en: 'he had been born', pp: 'è nato' },
  { form: 'avevamo scelto', inf: 'scegliere', cat: 'trapassato', en: 'we had chosen', pp: 'abbiamo scelto' },
  { form: 'erano usciti', inf: 'uscire', cat: 'trapassato', en: 'they had gone out', pp: 'sono usciti' },
  { form: 'aveva mentito', inf: 'mentire', cat: 'trapassato', en: 'he/she had lied', pp: 'ha mentito',
    note: 'Acts 5: Ananias — "hai mentito allo Spirito Santo".' },
];
