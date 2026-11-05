// Hand-labelled cases for evaluating local models on the voice tutor's AI features.
// `mustMention` is the fact a correct explanation has to touch, as a regex. It is only a
// first filter: a person still reads every output, since a reply can name the right
// tense and still be wrong about it. build-cases.mjs fails if a case's `expected` text
// isn't in the course, so nothing here can rest on a verse the course doesn't quote.

export const EXPLAIN_CASES = [
  { week: 1, expected: 'E il Verbo si fece carne', heard: 'il Verbo si fa carne', fact: 'fece is the passato remoto of fare; fa is the present', mustMention: /passato remoto|remote past|simple past|past/i },
  { week: 2, expected: 'Costui andò da Gesù, di notte, e gli disse', heard: 'costui andò da Gesù di notte e le disse', fact: 'gli is "to him", le is "to her"', mustMention: /\bhim\b|masculine/i },
  { week: 16, expected: 'altro nome dato agli uomini', heard: 'altro nome dati agli uomini', fact: 'the participle dato agrees with the singular masculine nome', mustMention: /agree|singular/i },
  { week: 16, expected: 'che è stata scartata da voi', heard: 'che è stato scartato da voi', fact: 'stata scartata agrees with the feminine pietra', mustMention: /feminine/i },
  { week: 13, expected: 'gli corse incontro', heard: 'gli correva incontro', fact: 'corse is passato remoto, a single completed act; correva is imperfetto', mustMention: /passato remoto|remote past|imperfe/i },
  { week: 6, expected: 'Abbiate fede in Dio', heard: 'avete fede in Dio', fact: 'abbiate is an imperative, avete is the present indicative', mustMention: /imperative|command/i },
  { week: 6, expected: 'Non sia turbato il vostro cuore', heard: 'non è turbato il vostro cuore', fact: 'sia is a subjunctive expressing a wish or command; è states a fact', mustMention: /subjunctive|congiuntivo|wish|command|let/i },
  { week: 13, expected: 'e lo baciò', heard: 'e la baciò', fact: 'lo is "him", la is "her"', mustMention: /\bhim\b|masculine/i },
  { week: 9, expected: 'Gloria a Dio nel più alto dei cieli', heard: 'gloria a Dio nel più alto del cielo', fact: 'dei cieli is plural (di + i); del cielo is singular', mustMention: /plural/i },
  { week: 26, expected: 'sono privi della gloria di Dio', heard: 'sono privo della gloria di Dio', fact: 'privi is plural, agreeing with tutti', mustMention: /plural|agree/i },
  { week: 10, expected: "di' a questa pietra", heard: 'dici a questa pietra', fact: "di' is the tu imperative of dire; dici is the present", mustMention: /imperative|command/i },
  { week: 12, expected: "Va' e anche tu fa' così", heard: 'vai e anche tu fai così', fact: "va' and fa' are short tu imperatives; vai and fai can also be imperatives", mustMention: /imperative|command/i },
  { week: 13, expected: 'Si alzò e tornò da suo padre', heard: 'si alza e torna da suo padre', fact: 'alzò and tornò are passato remoto; alza and torna are present', mustMention: /passato remoto|remote past|past/i },
  { week: 13, expected: 'non sono più degno di essere chiamato tuo figlio', heard: 'non sono più degno a essere chiamato tuo figlio', fact: 'degno takes di before an infinitive', mustMention: /\bdi\b/i },
  { week: 14, expected: 'Zaccheo, scendi subito', heard: 'Zaccheo scende subito', fact: 'scendi is the tu imperative; scende is third person', mustMention: /imperative|command|\btu\b/i },
  { week: 26, expected: 'perché tutti hanno peccato', heard: 'perché tutti ha peccato', fact: 'tutti is plural, so hanno rather than ha', mustMention: /plural/i },
  { week: 16, expected: "In nessun altro c'è salvezza", heard: 'in nessun altro ci sono salvezza', fact: "salvezza is singular, so c'è rather than ci sono", mustMention: /singular/i },
  { week: 17, expected: 'ciò che era stato venduto', heard: 'ciò che è stato venduto', fact: 'era stato is the trapassato ("had been"); è stato is the passato prossimo', mustMention: /trapassato|past perfect|pluperfect|had been/i },
  { week: 4, expected: 'Signore, dacci sempre questo pane', heard: 'Signore dai sempre questo pane', fact: "dacci is da' + ci, 'give us', with the pronoun attached and the c doubled", mustMention: /\bus\b/i },
  { week: 7, expected: 'Abbiamo visto il Signore', heard: 'avevamo visto il Signore', fact: 'abbiamo visto is passato prossimo ("have seen"); avevamo visto is trapassato ("had seen")', mustMention: /passato prossimo|present perfect|have seen/i },
];

// Held out from prompt tuning: the prompt was revised after reading results on the cases
// above, so these are the check that the revision didn't just fit those 20.
export const EXPLAIN_HOLDOUT = [
  { week: 8, expected: 'Se non vedo nelle sue mani', heard: 'se non vedevo nelle sue mani', fact: 'vedo is present ("if I do not see"); vedevo is imperfetto ("I was not seeing")', mustMention: /present|imperfe/i },
  { week: 3, expected: 'Allora gli dissero', heard: 'allora gli disse', fact: 'dissero is plural ("they said"); disse is singular ("he said")', mustMention: /plural|they/i },
  { week: 2, expected: 'sappiamo che sei venuto da Dio', heard: 'sappiamo che sei venuta da Dio', fact: 'venuto is masculine, agreeing with Jesus; venuta is feminine', mustMention: /masculine|feminine/i },
  { week: 15, expected: 'ebbe compassione', heard: 'ha avuto compassione', fact: 'ebbe is passato remoto and ha avuto is passato prossimo, with much the same meaning', mustMention: /passato remoto|remote past|passato prossimo/i },
  { week: 15, expected: 'suo padre lo vide', heard: 'suo padre la vide', fact: 'lo is "him", la is "her"', mustMention: /\bhim\b|masculine/i },
  { week: 17, expected: 'oggi devo fermarmi a casa tua', heard: 'oggi devo fermare a casa tua', fact: 'fermarmi is reflexive, "stop/stay myself"; fermare means to stop something else', mustMention: /reflexive|myself|\bmi\b/i },
  { week: 20, expected: 'noi siamo salvati', heard: 'noi siamo salvato', fact: 'salvati is plural, agreeing with noi', mustMention: /plural|agree/i },
  { week: 20, expected: 'Nessuno infatti tra loro era bisognoso', heard: 'nessuno infatti tra loro è bisognoso', fact: 'era is imperfetto ("was"); è is present ("is")', mustMention: /imperfe|\bpast\b|\bwas\b/i },
  { week: 24, expected: 'gli venne accanto il Signore', heard: 'gli viene accanto il Signore', fact: 'venne is passato remoto ("came"); viene is present ("comes")', mustMention: /passato remoto|remote past|\bcame\b|\bpast\b/i },
  { week: 30, expected: 'ci troviamo e ci vantiamo', heard: 'si troviamo e si vantiamo', fact: 'ci goes with noi ("ourselves"); si is third person', mustMention: /ourselves|\bwe\b|\bnoi\b|first.person/i },
];

// `about` is a word that has to appear in that week's reading, so a turn can't be run
// against a passage it isn't about, which would make a good reply look like a wandering one.

// Correct Italian a learner might say. A reply that "corrects" any of these is wrong.
export const CORRECT_UTTERANCES = [
  { week: 1, about: 'Verbo', text: 'Il Verbo era presso Dio.' },
  { week: 1, about: 'tenebre', text: 'Credo che la luce sia più forte delle tenebre.' },
  { week: 3, about: 'pane', text: 'Gesù è il pane della vita.' },
  { week: 6, about: 'cuore', text: 'Questo versetto mi dà pace.' },
  { week: 9, about: 'gloria', text: 'Gli angeli cantano la gloria di Dio.' },
  { week: 13, about: 'compassione', text: 'Il samaritano ha aiutato quell\'uomo.' },
  { week: 15, about: 'padre', text: 'Il padre ha perdonato suo figlio.' },
  { week: 20, about: 'salvezza', text: 'Pietro parla con coraggio.' },
  { week: 30, about: 'gloria', text: 'Tutti hanno bisogno della grazia.' },
  { week: 37, about: 'Lodate', text: 'Mi piace questo salmo perché è pieno di gioia.' },
];

// Learner turns with a real mistake, plus some mangled by a recognizer and an off-topic
// question. These are read by a person, for tone and for whether the reply stays useful.
export const CONVERSA_TURNS = [
  { week: 1, about: 'luce', text: 'Io penso che il luce è molto importante.', note: 'gender error: la luce' },
  { week: 3, about: 'pane', text: 'Gesù ha detto che lui è il pane per tutti persone.', note: 'tutte le persone' },
  { week: 15, about: 'padre', text: 'Il figlio è tornato a suo padre perché aveva fame.', note: 'tornato da suo padre' },
  { week: 20, about: 'salvezza', text: 'pietro e giovanni non hanno paura', note: 'correct, transcript has no capitals or punctuation' },
  { week: 30, about: 'gloria', text: 'la grazzia e per tutti', note: 'recognizer spelling; must not be corrected' },
  { week: 6, text: 'Non lo so.', note: 'learner is stuck; should get an easier question' },
  { week: 9, text: 'blu cane dieci', note: 'nonsense; should ask to repeat' },
  { week: 30, about: 'gloria', text: 'Che cosa insegna la Chiesa sulla giustificazione?', note: 'doctrine; should redirect gently' },
  { week: 1, text: 'What does this mean?', note: 'English; should respond in simple Italian' },
  { week: 37, about: 'Lodate', text: 'Puoi citarmi un altro salmo?', note: 'asks for a quotation; must not invent one' },
];
