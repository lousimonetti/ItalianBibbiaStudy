// Consigli — how to learn Italian, not what to learn. Each tip is a technique
// with evidence or long teaching practice behind it, stated in a sentence or
// two and shown with real Italian. One is dealt per day on the Today card
// (each once per cycle); the whole set is browsable there by category.
//
// SHAPE
//   tip = { id, cat, title, body, examples?: [{ it, en }], tryIt? }
// `tryIt` names the place in this app where the technique is practised.
// The Italian in `examples` is spoken by the speaker button and is tappable,
// so keep it real Italian with no English mixed into the `it` field.

export const TIP_CATEGORIES = [
  { id: 'memory', title: 'Memoria', titleEn: 'Making it stick' },
  { id: 'words', title: 'Parole', titleEn: 'Vocabulary shortcuts' },
  { id: 'sounds', title: 'Suoni', titleEn: 'Pronunciation' },
  { id: 'grammar', title: 'Grammatica', titleEn: 'Grammar shortcuts' },
  { id: 'fluency', title: 'Scioltezza', titleEn: 'Listening and speaking' },
  { id: 'habits', title: 'Abitudini', titleEn: 'Habits that last' },
];

export const TIPS = [
  // ── Memory ────────────────────────────────────────────────────────────────
  {
    id: 'recall-first', cat: 'memory', title: 'Try to recall before you look',
    body: 'Pulling a word out of memory strengthens it far more than reading it again. Cover the Italian, say your best guess aloud, then check. A wrong guess still helps, as long as you see the answer straight after.',
    tryIt: 'Flashcards → Practice → Recall',
  },
  {
    id: 'space-it', cat: 'memory', title: 'Space your reviews',
    body: 'A word reviewed just as you are about to forget it lasts longest. That is what the "due" count is: do those cards first, every day, and leave the rest alone. Ten minutes daily beats an hour on Sunday.',
    tryIt: 'The Review button on the Today card',
  },
  {
    id: 'first-letters', cat: 'memory', title: 'Memorize a verse from its first letters',
    body: 'Write only the first letter of each word and recite the verse from those. Each letter is just enough of a cue to pull the word back.',
    examples: [{ it: 'In principio era il Verbo', en: 'I p e i V' }],
    tryIt: 'Versetto del giorno → Impara',
  },
  {
    id: 'fade', cat: 'memory', title: 'Fade the text away',
    body: 'Read a verse, hide one word and say it whole, then hide three, then most of it. Because the blanks only grow, what you recalled a moment ago is asked for again.',
    tryIt: 'Versetti → Memorize, in any week',
  },
  {
    id: 'picture-it', cat: 'memory', title: 'Tie the sound to a picture',
    body: 'For a word that will not stay, find an English word it sounds like and picture the two together, the sillier the better. You need the picture only for a few days; then the word stands on its own.',
    examples: [
      { it: 'il pane', en: 'bread: a frying pan piled with loaves' },
      { it: 'la luce', en: 'light: a loose bulb swinging' },
    ],
  },
  {
    id: 'chunks', cat: 'memory', title: 'Learn chunks, not single words',
    body: 'Fluent speakers pull out ready-made phrases. A chunk carries its grammar with it, so you never have to build it. Collect them whole and say them whole.',
    examples: [
      { it: 'per mezzo di lui', en: 'through him' },
      { it: 'in verità vi dico', en: 'truly I tell you' },
      { it: 'non abbiate paura', en: 'do not be afraid' },
    ],
    tryIt: 'Frasi fisse, under More practice in each week',
  },
  {
    id: 'aloud', cat: 'memory', title: 'Say it aloud',
    body: 'Words you speak are remembered better than words you read silently, and your mouth learns the movements at the same time. Read every example aloud, even under your breath.',
  },
  {
    id: 'mix', cat: 'memory', title: 'Mix old with new',
    body: 'Drilling one kind of thing in a block feels smooth and fades fast. Mixing old words, new words and different exercise types feels harder and lasts longer.',
    tryIt: 'Practice → Smart mix',
  },
  {
    id: 'sleep', cat: 'memory', title: 'Review at night, test in the morning',
    body: 'Memory is consolidated during sleep. Five minutes of review before bed and a quick self-test after waking is one of the cheapest gains there is.',
  },
  {
    id: 'make-it-yours', cat: 'memory', title: 'Make each word true about you',
    body: 'A sentence about your own life is remembered better than the textbook one. For every new word, say one true thing.',
    examples: [
      { it: 'Ho fame.', en: 'I am hungry.' },
      { it: 'La mia casa è piccola.', en: 'My house is small.' },
    ],
    tryIt: 'Journal, or Pensa in italiano on the Today card',
  },

  // ── Words ─────────────────────────────────────────────────────────────────
  {
    id: 'zione', cat: 'words', title: '-tion becomes -zione',
    body: 'Hundreds of English words convert at once, and every one of them is feminine.',
    examples: [
      { it: 'la nazione', en: 'nation' },
      { it: 'la risurrezione', en: 'resurrection' },
      { it: 'la benedizione', en: 'blessing (benediction)' },
    ],
  },
  {
    id: 'ta', cat: 'words', title: '-ty becomes -tà',
    body: 'Always feminine, stressed on the final à, and the plural does not change: una città, due città.',
    examples: [
      { it: 'la verità', en: 'truth (verity)' },
      { it: 'la carità', en: 'charity' },
      { it: 'la libertà', en: 'liberty' },
    ],
  },
  {
    id: 'mente', cat: 'words', title: '-ly becomes -mente',
    body: 'Take the feminine form of the adjective and add -mente.',
    examples: [
      { it: 'veramente', en: 'truly' },
      { it: 'finalmente', en: 'finally, at last' },
      { it: 'certamente', en: 'certainly' },
    ],
  },
  {
    id: 'oso-bile', cat: 'words', title: '-ous becomes -oso, -ble becomes -bile',
    body: 'Two more endings that turn English you know into Italian you can guess.',
    examples: [
      { it: 'glorioso', en: 'glorious' },
      { it: 'generoso', en: 'generous' },
      { it: 'possibile', en: 'possible' },
      { it: 'visibile', en: 'visible' },
    ],
  },
  {
    id: 'enza', cat: 'words', title: '-ence and -ance become -enza and -anza',
    body: 'Every word with these endings is feminine. Not all of them are look-alikes (hope is la speranza), but the ending still tells you the gender.',
    examples: [
      { it: 'la pazienza', en: 'patience' },
      { it: 'la presenza', en: 'presence' },
      { it: "l'importanza", en: 'importance' },
    ],
  },
  {
    id: 'ista', cat: 'words', title: '-ist becomes -ista, for men and women alike',
    body: 'The singular is the same for both; only the article changes. The plural splits: -isti for men, -iste for women.',
    examples: [
      { it: "l'evangelista", en: 'the evangelist' },
      { it: 'il turista, la turista', en: 'the tourist' },
    ],
  },
  {
    id: 'false-friends', cat: 'words', title: 'Know the false friends',
    body: 'A few look-alikes mean something else. Learn this short list and trust the rest.',
    examples: [
      { it: 'i parenti', en: 'relatives (parents are i genitori)' },
      { it: 'la camera', en: 'room (a camera is la macchina fotografica)' },
      { it: 'la libreria', en: 'bookshop (a library is la biblioteca)' },
      { it: 'attualmente', en: 'currently (actually is in realtà)' },
      { it: 'educato', en: 'polite (educated is istruito)' },
    ],
    tryIt: 'Flashcards → Trappole',
  },
  {
    id: 'families', cat: 'words', title: 'Learn words in families',
    body: 'One root gives you four or five words. When you meet a new word, ask what its relatives are.',
    examples: [
      { it: 'credere, credente, credibile, incredulo', en: 'to believe, believer, believable, unbelieving' },
      { it: 'luce, luminoso, illuminare', en: 'light, bright, to light up' },
    ],
  },
  {
    id: 'latin-bridge', cat: 'words', title: 'Use the English word you rarely use',
    body: 'English often has two words, a plain one and a Latin one. The Italian is nearly always the Latin one, so reach for the formal English word and you will often land on it.',
    examples: [
      { it: 'cominciare', en: 'to commence (begin)' },
      { it: 'rispondere', en: 'to respond (answer)' },
      { it: 'entrare', en: 'to enter (go in)' },
    ],
  },

  // ── Sounds ────────────────────────────────────────────────────────────────
  {
    id: 'vowels', cat: 'sounds', title: 'Every vowel is spoken, and never slides',
    body: 'Italian vowels are short, clear and the same every time. No silent e, no English glide: o is "oh" held still, not "oh-oo". Say each vowel of a word separately first, then join them.',
    examples: [
      { it: 'pace', en: 'peace: pa-ce, two syllables' },
      { it: 'Dio', en: 'God: di-o' },
    ],
  },
  {
    id: 'c-g', cat: 'sounds', title: 'C and G: hard or soft by the next letter',
    body: 'Hard before a, o, u. Soft before e, i. An h keeps them hard; an i makes them soft and is itself silent.',
    examples: [
      { it: 'casa, cena', en: 'house (k), supper (ch)' },
      { it: 'che, chi', en: 'that, who (both k)' },
      { it: 'ciao, giorno', en: 'ch-ow, j-orno' },
      { it: 'Gesù, gente', en: 'Jesus, people (both j)' },
    ],
  },
  {
    id: 'doubles', cat: 'sounds', title: 'Hold the double consonants',
    body: 'A double letter is held about twice as long, and it changes the word. Pause on it as if a tiny comma sat in the middle.',
    examples: [
      { it: 'sete, sette', en: 'thirst, seven' },
      { it: 'nono, nonno', en: 'ninth, grandfather' },
      { it: 'pala, palla', en: 'shovel, ball' },
    ],
  },
  {
    id: 'stress', cat: 'sounds', title: 'Stress the second-to-last syllable, unless told otherwise',
    body: 'Most words stress the syllable before the last. A written accent means the last syllable is stressed. A smaller group stresses the third from last, and those you learn by ear, so always listen before you say a new word.',
    examples: [
      { it: 'parola, amore', en: 'pa-RO-la, a-MO-re' },
      { it: 'città, perché', en: 'final syllable' },
      { it: 'angelo, credere, popolo', en: 'AN-ge-lo, CRE-de-re, PO-po-lo' },
    ],
  },
  {
    id: 'gli-gn', cat: 'sounds', title: 'gli and gn are single sounds',
    body: 'gli is close to the "lli" of million; gn is the "ny" of canyon. Neither has a hard g in it.',
    examples: [
      { it: 'figlio, famiglia', en: 'son, family' },
      { it: 'Signore, agnello', en: 'Lord, lamb' },
    ],
  },
  {
    id: 'sc', cat: 'sounds', title: 'sc is "sh" before e and i',
    body: 'Before a, o, u it stays "sk". An h brings the k back.',
    examples: [
      { it: 'scendere, uscire', en: 'to go down, to go out (sh)' },
      { it: 'scuola, schiavo', en: 'school, slave (sk)' },
    ],
  },
  {
    id: 'shadow', cat: 'sounds', title: 'Shadow a speaker',
    body: 'Play a line and speak along with it, a fraction of a second behind, copying the rhythm and melody rather than the words. It trains the ear and the mouth together and is the fastest fix for a flat, word-by-word delivery.',
    tryIt: 'Versetti → Shadow, or Prayers → Shadow',
  },

  // ── Grammar ───────────────────────────────────────────────────────────────
  {
    id: 'with-article', cat: 'grammar', title: 'Learn every noun with its article',
    body: 'Never learn "luce"; learn "la luce". The article carries the gender, and gender decides every adjective and participle around the noun.',
    examples: [
      { it: 'il pane, la luce, lo Spirito', en: 'the bread, the light, the Spirit' },
    ],
  },
  {
    id: 'gender-endings', cat: 'grammar', title: 'Guess gender from the ending',
    body: 'Nouns in -o are nearly all masculine, nouns in -a feminine. Those in -e can be either and must be learned. Words in -zione, -tà and -tù are feminine. Greek words in -ma are masculine.',
    examples: [
      { it: 'il padre, la madre', en: 'both end in -e' },
      { it: 'la virtù, la nazione, la città', en: 'feminine' },
      { it: 'il problema, il tema', en: 'masculine, despite the -a' },
    ],
  },
  {
    id: 'no-subject', cat: 'grammar', title: 'Drop the subject pronoun',
    body: 'The verb ending already says who. Adding io or tu every time is the surest mark of a learner; Italians use them only for contrast.',
    examples: [
      { it: 'Credo.', en: 'I believe.' },
      { it: 'Io credo, ma tu?', en: 'I believe, but what about you?' },
    ],
  },
  {
    id: 'iamo', cat: 'grammar', title: 'Start from what never changes',
    body: 'In the present tense the "we" form ends in -iamo for every verb, and "I" ends in -o for nearly all. Learn those two first and you can already say a great deal.',
    examples: [
      { it: 'parliamo, crediamo, partiamo', en: 'we speak, we believe, we leave' },
      { it: 'parlo, credo, parto', en: 'I speak, I believe, I leave' },
    ],
  },
  {
    id: 'essere-avere', cat: 'grammar', title: 'Essere for coming, going and becoming',
    body: 'In the past tense most verbs take avere. Verbs of movement and of change of state take essere, and then the participle agrees with the subject.',
    examples: [
      { it: 'Ha parlato.', en: 'He spoke.' },
      { it: 'È venuto. È venuta.', en: 'He came. She came.' },
      { it: 'È nato, è morto, è risorto.', en: 'He was born, died, rose.' },
    ],
  },
  {
    id: 'piacere', cat: 'grammar', title: 'Piacere runs backwards',
    body: 'Italian does not say "I like the book" but "the book pleases me". The thing liked is the subject, so the verb agrees with it.',
    examples: [
      { it: 'Mi piace il libro.', en: 'I like the book.' },
      { it: 'Mi piacciono i salmi.', en: 'I like the psalms.' },
    ],
  },
  {
    id: 'prepositions', cat: 'grammar', title: 'Prepositions fuse with the article',
    body: 'di, a, da, in and su join the article that follows. Learn the pattern once for "il" and "la"; the others follow the article you already know.',
    examples: [
      { it: 'del, della, dello, dei', en: 'of the' },
      { it: 'nel nome del Padre', en: 'in the name of the Father' },
      { it: 'al, alla, dal, sul', en: 'to the, from the, on the' },
    ],
  },
  {
    id: 'remoto', cat: 'grammar', title: 'Recognise the passato remoto; do not produce it',
    body: 'The Bible narrates in a past tense that everyday speech in most of Italy replaces with the passato prossimo. Learn to read the common forms and keep speaking with the tense you know.',
    examples: [
      { it: 'disse', en: 'he said (= ha detto)' },
      { it: 'vide', en: 'he saw (= ha visto)' },
      { it: 'venne', en: 'he came (= è venuto)' },
      { it: 'fu', en: 'he was (= è stato)' },
    ],
    tryIt: 'Flashcards → verb forms',
  },
  {
    id: 'clitics', cat: 'grammar', title: 'Small pronouns go before the verb, or glue to its end',
    body: 'mi, ti, lo, la, ci, vi stand before a conjugated verb. With a command or an infinitive they attach to the end and the word is written as one.',
    examples: [
      { it: 'Ti amo.', en: 'I love you.' },
      { it: 'Seguimi!', en: 'Follow me!' },
      { it: 'Dacci oggi il nostro pane.', en: 'Give us today our bread.' },
    ],
  },
  {
    id: 'avere-idioms', cat: 'grammar', title: 'You "have" hunger, thirst and years',
    body: 'Where English says "I am", Italian often says "I have". Learn these as chunks rather than translating.',
    examples: [
      { it: 'Ho fame. Ho sete.', en: 'I am hungry. I am thirsty.' },
      { it: 'Ho paura.', en: 'I am afraid.' },
      { it: "Ho trent'anni.", en: 'I am thirty.' },
    ],
  },

  // ── Fluency ───────────────────────────────────────────────────────────────
  {
    id: 'listen-first', cat: 'fluency', title: 'Listen before you read',
    body: 'Hear a sentence twice with the text hidden, and only then look. Reading first lets your eyes do the work your ears need to learn.',
    tryIt: 'Practice → Listening',
  },
  {
    id: 'same-passage', cat: 'fluency', title: 'Listen to the same passage many times',
    body: 'The fifth hearing of one passage teaches more than a first hearing of five. Each pass you catch a little more, until the whole thing arrives at normal speed.',
    tryIt: "The speaker on each verse of the week's reading",
  },
  {
    id: 'think', cat: 'fluency', title: 'Narrate your day in your head',
    body: 'Fluency is speed of retrieval, and you can practise retrieval anywhere, silently. Describe what you are doing in the simplest Italian you have. Note the word you were missing and look it up later.',
    examples: [{ it: 'Adesso preparo il caffè.', en: 'Now I am making coffee.' }],
    tryIt: 'Pensa in italiano on the Today card',
  },
  {
    id: 'no-word-for-word', cat: 'fluency', title: 'Ask how Italian says it, not how to translate it',
    body: 'Word-for-word translation produces English wearing Italian clothes. When a sentence feels awkward, look for the Italian way of framing the idea.',
    examples: [
      { it: 'Mi chiamo Luca.', en: 'My name is Luca (I call myself Luca).' },
      { it: 'Che ore sono?', en: 'What time is it? (What hours are they?)' },
    ],
  },
  {
    id: 'say-it-simply', cat: 'fluency', title: 'When the word is missing, say it another way',
    body: 'Do not stop and do not switch to English. Describe the thing with words you have. Getting around a gap is itself a fluency skill, and the listener will usually hand you the word.',
    examples: [{ it: 'la cosa per aprire la porta', en: 'the thing for opening the door (the key)' }],
  },
  {
    id: 'known-texts', cat: 'fluency', title: 'Start from texts you already know',
    body: 'When you know what a passage says, all your attention is free for how Italian says it. Prayers and familiar Gospel scenes are the easiest real Italian you will ever read.',
    tryIt: 'Pray → Prayers and Rosary',
  },
  {
    id: 'record', cat: 'fluency', title: 'Record yourself and compare',
    body: 'Read a verse into your phone, then play the model and your recording back to back. You will hear at once what no explanation could tell you.',
  },
  {
    id: 'italian-first', cat: 'fluency', title: 'Read the Italian first; use English only to check',
    body: 'Guess from context, tap the one word that blocks you, and look at the translation last. Every sentence you understand without English is practice at the real skill.',
    tryIt: "The EN chip on each verse of the week's reading",
  },

  // ── Habits ────────────────────────────────────────────────────────────────
  {
    id: 'daily', cat: 'habits', title: 'A little every day',
    body: 'Fifteen minutes daily builds more than two hours once a week, because memory needs the gaps. Protect the streak on bad days with a single review.',
  },
  {
    id: 'anchor', cat: 'habits', title: 'Attach study to something you already do',
    body: 'Choose a fixed moment, after coffee or before bed, and always start with the same small step. A habit with a trigger survives weeks when motivation does not.',
    tryIt: 'The reminder on the Today card',
  },
  {
    id: 'mistakes', cat: 'habits', title: 'Treat mistakes as a to-do list',
    body: 'An error tells you exactly what to practise next. Words you keep missing are not a sign you are bad at this; they are the most valuable ten minutes of your week.',
    tryIt: 'Practice → Parole difficili',
  },
  {
    id: 'speak-early', cat: 'habits', title: 'Speak with a person, early and often',
    body: 'Nothing replaces a real listener. Before each conversation prepare three sentences you want to use, use them, and afterwards write down what you could not say.',
  },
  {
    id: 'one-thing', cat: 'habits', title: 'Fix one thing at a time',
    body: 'Pick a single target for the week, such as holding double consonants or dropping "io", and listen for only that. Trying to correct everything at once corrects nothing.',
  },
];
