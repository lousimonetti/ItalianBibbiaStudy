export const DAILY = [
  { day: 'Mon', task: 'Babbel lesson + audio listen (no looking up)' },
  { day: 'Tue', task: 'Read chapters with parallel text + Anki new words' },
  { day: 'Wed', task: 'Re-read + write 3-5 sentences using weekly prompt' },
  { day: 'Thu', task: 'Babbel lesson + full Anki review deck' },
  { day: 'Fri', task: 'Read next chapter(s) + add vocab + write sentences' },
  { day: 'Sat', task: 'Anki review + listen to full passage audio again' },
  { day: 'Sun', task: 'Rest — or write a short journal entry in Italian' },
];

export const PHASES = [
  {
    id: 'p1',
    title: 'Phase 1: Foundation',
    book: 'Gospel of John',
    badgeLabel: 'Beginner',
    badgeBg: '#E1F5EE',
    badgeColor: '#085041',
    weeks: [
      {
        n: 1, d: 'Apr 13-19', r: 'John 1-2', b: 'Greetings, nouns, basic articles', review: false,
        vocab: [
          ['il Verbo', 'the Word', 'In principio era il Verbo'],
          ['la luce', 'the light', 'La luce splende'],
          ['le tenebre', 'the darkness', 'le tenebre non la vinsero'],
          ['la vita', 'life', 'in lui era la vita'],
          ['credere', 'to believe', 'ha creduto in lui'],
          ['il miracolo', 'the miracle', 'primo dei suoi miracoli'],
          ['il mondo', 'the world', 'il mondo è stato fatto per mezzo di lui'],
        ],
        grammar: {
          title: 'essere e avere — your two foundation verbs',
          body: 'Every Italian sentence runs on these. "Dio è amore" uses essere; "Gesù ha detto" uses avere. In John 1, you\'ll see "era" (was) and "aveva" (had) constantly. Spot them as you read and note whether they describe state (essere) or action/possession (avere).',
        },
        prompt: {
          it: 'In principio, Dio ha creato il mondo con la sua Parola.',
          en: 'Write about the opening of John 1 in your own words — what did the Word do?',
        },
      },
      {
        n: 2, d: 'Apr 20-26', r: 'John 3-4', b: 'Present tense verbs', review: false,
        vocab: [
          ['nascere', 'to be born', 'bisogna nascere di nuovo'],
          ['lo Spirito', 'the Spirit', 'lo Spirito soffia dove vuole'],
          ['il pozzo', 'the well', 'sedeva presso il pozzo'],
          ['adorare', 'to worship', 'i veri adoratori'],
          ['il Salvatore', 'the Savior', 'il Salvatore del mondo'],
          ['credere', 'to believe', 'chi crede in lui'],
          ['il dono', 'the gift', 'se conoscessi il dono di Dio'],
        ],
        grammar: {
          title: 'Present tense -are / -ere / -ire verb endings',
          body: 'Three verb families, each with a pattern. Adorare (to worship): adoro, adori, adora, adoriamo. Credere (to believe): credo, credi, crede, crediamo. Nascere (to be born) is -ere but irregular. As you read John 3-4, underline every present tense verb and identify its family.',
        },
        prompt: {
          it: "Descrivi l'incontro tra Gesù e la donna samaritana al pozzo.",
          en: 'Describe the meeting between Jesus and the Samaritan woman at the well.',
        },
      },
      {
        n: 3, d: 'Apr 27-May 3', r: 'John 5-6', b: 'Numbers, time expressions', review: false,
        vocab: [
          ['guarire', 'to heal', 'lo ha guarito'],
          ['il pane', 'bread', 'sono io il pane della vita'],
          ['la folla', 'the crowd', 'la folla grande lo seguiva'],
          ['saziarsi', 'to be satisfied', 'mangiarono e si saziarono'],
          ['la vita eterna', 'eternal life', 'ha la vita eterna'],
          ['la manna', 'manna', 'i nostri padri mangiarono la manna'],
          ['il segno', 'the sign', 'quale segno fai tu?'],
        ],
        grammar: {
          title: "c'è / ci sono — \"there is / there are\"",
          body: '"C\'è un ragazzo qui" (There is a boy here). "Ci sono cinque pani" (There are five loaves). You\'ll see this throughout the feeding of the 5,000 in John 6. Practice: "C\'erano cinquemila uomini. C\'erano cinque pani e due pesci."',
        },
        prompt: {
          it: 'C\'era una grande folla. Gesù ha preso cinque pani e due pesci e ha sfamato tutti.',
          en: 'Write about the multiplication of loaves — what happened and what did people think?',
        },
      },
      {
        n: 4, d: 'May 4-10', r: 'John 7-8', b: 'Adjectives, sentence structure', review: false,
        vocab: [
          ['insegnare', 'to teach', 'insegnava nel tempio'],
          ['la verità', 'the truth', 'la verità vi farà liberi'],
          ['liberare', 'to set free', 'vi farà liberi'],
          ['giudicare', 'to judge', "non giudicate secondo l'apparenza"],
          ['il peccato', 'sin', 'chi di voi è senza peccato'],
          ['scrivere', 'to write', 'scriveva per terra'],
          ['luce del mondo', 'light of the world', 'sono la luce del mondo'],
        ],
        grammar: {
          title: 'Adjective agreement — gender and number',
          body: 'Italian adjectives agree with the noun they describe. "Il figlio libero" but "la donna libera." Every time you add a word to Anki, note whether it\'s masculine or feminine.',
        },
        prompt: {
          it: 'Gesù ha detto: "Io sono la luce del mondo. Chi mi segue non camminerà nelle tenebre."',
          en: 'Write Jesus\'s "I am the light" statement and explain what it means to you.',
        },
      },
      {
        n: 5, d: 'May 11-17', r: 'John 9-11', b: 'Questions and negation', review: false,
        vocab: [
          ['il cieco', 'blind man', 'un uomo cieco dalla nascita'],
          ['vedere', 'to see', 'ora vedo'],
          ['il buon pastore', 'the good shepherd', 'io sono il buon pastore'],
          ['la pecora', 'sheep', 'conosce le mie pecore'],
          ['la tomba', 'tomb', "dov'è il sepolcro?"],
          ['risuscitare', 'to raise from dead', 'io sono la risurrezione'],
          ['piangere', 'to weep', 'Gesù scoppiò in pianto'],
        ],
        grammar: {
          title: 'Question formation and negation',
          body: '"Chi?" (who), "Dove?" (where), "Come?" (how), "Perché?" (why), "Quando?" (when). Negation: non before the verb, always. "Non capisco," "non so," "non ho visto."',
        },
        prompt: {
          it: 'Gesù ha chiamato: "Lazzaro, vieni fuori!" E il morto è uscito dal sepolcro.',
          en: "Write the scene of Lazarus's resurrection — include what Jesus said and how people responded.",
        },
      },
      {
        n: 6, d: 'May 18-24', r: 'John 12-14', b: 'Prepositions and locations', review: false,
        vocab: [
          ["l'unzione", 'the anointing', "l'unzione a Betania"],
          ["l'asino", 'the donkey', 'seduto su un asino'],
          ['lavare i piedi', 'wash feet', 'lavò i piedi ai discepoli'],
          ['il tradimento', 'betrayal', 'annunciò il suo traditore'],
          ['la casa del Padre', "Father's house", 'nella casa del Padre'],
          ['il Paraclito', 'the Paraclete', 'vi manderà il Paraclito'],
          ['la via', 'the way', 'io sono la via'],
        ],
        grammar: {
          title: 'Prepositions: di, a, da, in, con, su, per',
          body: '"A Betania" (in Bethany), "nella casa" (in the house), "per voi" (for you). Note how prepositions combine with articles: a + il = al, di + il = del, in + il = nel.',
        },
        prompt: {
          it: 'Gesù ha detto: "Io sono la via, la verità e la vita. Nessuno viene al Padre se non per mezzo di me."',
          en: 'Write what the "I am the way" statement means in your own words, using Italian.',
        },
      },
      {
        n: 7, d: 'May 25-31', r: 'John 15-17', b: 'Modal verbs: potere, dovere, volere', review: false,
        vocab: [
          ['la vite', 'the vine', 'io sono la vite vera'],
          ['il tralcio', 'the branch', 'ogni tralcio in me'],
          ['portare frutto', 'to bear fruit', 'portiate molto frutto'],
          ['il comandamento', 'commandment', 'questo è il mio comandamento'],
          ['rimanere', 'to remain', 'rimanete nel mio amore'],
          ['il mondo', 'the world', 'il mondo vi odierà'],
          ['la preghiera', 'prayer', 'pregò per i suoi discepoli'],
        ],
        grammar: {
          title: 'Modal verbs: potere, dovere, volere',
          body: '"Posso" (I can), "devo" (I must), "voglio" (I want). These always pair with an infinitive: "posso fare" (I can do), "devo partire" (I must leave), "volete rimanere?" (do you want to stay?)',
        },
        prompt: {
          it: 'Gesù ha detto: "Rimanete nel mio amore. Senza di me non potete fare nulla."',
          en: 'Write about the vine and branches image — what does it mean to "remain" in Jesus?',
        },
      },
      {
        n: 8, d: 'Jun 1-7', r: 'John 18-21', b: 'Review week + first iTalki session', review: true,
        vocab: [
          ["l'arresto", 'the arrest', "l'arresto nel Getsemani"],
          ['il rinnegamento', 'the denial', 'il rinnegamento di Pietro'],
          ['la crocifissione', 'crucifixion', 'portò la sua croce'],
          ['il sepolcro vuoto', 'empty tomb', 'il sepolcro era vuoto'],
          ['la resurrezione', 'the resurrection', 'sono risorto'],
          ['la missione', 'the mission', 'come il Padre ha mandato me'],
          ['la pace', 'peace', 'la pace sia con voi'],
        ],
        grammar: {
          title: 'Passato prossimo — your first past tense',
          body: 'Formed with avere/essere + past participle. "Ha detto" (he said), "è risorto" (he rose). Movement/change verbs use essere: "è venuto," "è uscito," "è morto." Action verbs use avere: "ha portato," "ha detto," "ha mostrato."',
        },
        prompt: {
          it: 'Descrivi il giorno della resurrezione: Maria Maddalena è andata al sepolcro e ha trovato la pietra spostata.',
          en: "Describe the resurrection morning from Mary Magdalene's perspective.",
        },
        italki: [
          'Racconta la storia del vangelo di Giovanni in 5 frasi.',
          'Qual è il tuo brano preferito di Giovanni e perché?',
          'Descrivi Gesù usando solo aggettivi italiani che hai imparato.',
          'Come ti senti a leggere la Bibbia in italiano?',
        ],
      },
    ],
  },
  {
    id: 'p2',
    title: 'Phase 2: Growth',
    book: 'Gospel of Luke',
    badgeLabel: 'Intermediate',
    badgeBg: '#E6F1FB',
    badgeColor: '#0C447C',
    weeks: [
      {
        n: 9, d: 'Jun 8-14', r: 'Luke 1-2', b: 'Past tense: passato prossimo', review: false,
        vocab: [
          ["l'annuncio", 'the announcement', "l'annunciazione a Maria"],
          ["l'angelo", 'the angel', "l'angelo Gabriele"],
          ['benedetto', 'blessed', 'benedetta tu fra le donne'],
          ['la nascita', 'birth', 'la nascita di Gesù'],
          ['la mangiatoia', 'manger', 'lo depose nella mangiatoia'],
          ['i pastori', 'shepherds', 'i pastori andarono a Betlemme'],
          ['il Magnificat', 'Magnificat', "l'anima mia magnifica il Signore"],
        ],
        grammar: {
          title: 'Passato prossimo — building fluency',
          body: 'Focus on essere verbs: "è nato" (was born), "è venuto" (came), "sono andati" (they went), "è tornata" (she returned). Before reading, predict which verbs will use essere versus avere — then verify.',
        },
        prompt: {
          it: 'L\'angelo ha detto a Maria: "Non temere, Maria. Darai alla luce un figlio e lo chiamerai Gesù."',
          en: 'Write the Annunciation scene. What did Mary say? How did she feel?',
        },
      },
      {
        n: 10, d: 'Jun 15-21', r: 'Luke 3-5', b: 'Irregular past tense verbs', review: false,
        vocab: [
          ['il battesimo', 'baptism', 'il battesimo di Gesù'],
          ['il deserto', 'desert', 'quaranta giorni nel deserto'],
          ['la tentazione', 'temptation', 'le tentazioni del diavolo'],
          ['la rete', 'net', 'gettate le reti'],
          ['il lebbroso', 'leper', 'un uomo pieno di lebbra'],
          ['perdonare', 'to forgive', 'ti sono perdonati i peccati'],
          ['camminare', 'to walk', 'alzati e cammina'],
        ],
        grammar: {
          title: 'Irregular past participles',
          body: 'Many common verbs break the rules. Fare → fatto, dire → detto, vedere → visto, venire → venuto, essere → stato, aprire → aperto. Create an Anki card for each irregular participle you encounter — this is rote memorisation, no shortcut.',
        },
        prompt: {
          it: 'Gesù è stato tentato nel deserto per quaranta giorni. Il diavolo ha detto... ma Gesù ha risposto...',
          en: "Write the temptation scene — Jesus's three responses to the devil.",
        },
      },
      {
        n: 11, d: 'Jun 22-28', r: 'Luke 6-7', b: 'Imperfect tense: imperfetto', review: false,
        vocab: [
          ['le beatitudini', 'the beatitudes', 'beati voi poveri'],
          ['il nemico', 'the enemy', 'amate i vostri nemici'],
          ['il centurione', 'centurion', 'il servo del centurione'],
          ['la vedova', 'widow', 'la vedova di Naim'],
          ['il fariseo', 'Pharisee', 'un fariseo lo invitò'],
          ['perdonare', 'to forgive', 'le sue peccata le sono perdonate'],
          ['il profeta', 'the prophet', 'un grande profeta è sorto'],
        ],
        grammar: {
          title: 'Imperfetto — ongoing past action',
          body: 'Where passato prossimo says "it happened," imperfetto says "it was happening." "Gesù insegnava" (Jesus was teaching). "La folla lo ascoltava" (the crowd was listening). Luke uses imperfetto for background and passato prossimo for key events.',
        },
        prompt: {
          it: 'Gesù insegnava sulla montagna. Le folle lo ascoltavano. Diceva: "Amate i vostri nemici."',
          en: 'Write the Sermon on the Plain — use imperfetto for background and passato prossimo for specific actions.',
        },
      },
      {
        n: 12, d: 'Jun 29-Jul 5', r: 'Luke 8-9', b: 'Object pronouns', review: false,
        vocab: [
          ['la tempesta', 'storm', 'calmò la tempesta'],
          ['i demoni', 'demons', 'i demoni lo supplicavano'],
          ['la fede', 'faith', 'la tua fede ti ha salvata'],
          ['guarire', 'to heal', 'aveva guarito molti'],
          ['la trasfigurazione', 'transfiguration', 'la trasfigurazione sul monte'],
          ['la croce', 'cross', 'prenda la sua croce'],
          ['le provviste', 'provisions', 'non prendete nulla per il viaggio'],
        ],
        grammar: {
          title: 'Direct object pronouns: lo, la, li, le',
          body: '"Lo ha guarito" (he healed him). "La folla lo seguiva" (the crowd followed him). "Li ha mandati" (he sent them). The pronoun goes before the conjugated verb in Italian, not after.',
        },
        prompt: {
          it: 'Gesù ha calmato la tempesta. I discepoli avevano paura, ma Gesù li ha rassicurati.',
          en: 'Write the calming of the storm — who was afraid, what did Jesus do, how did people respond?',
        },
      },
      {
        n: 13, d: 'Jul 6-12', r: 'Luke 10-11', b: 'Reflexive verbs', review: false,
        vocab: [
          ['il samaritano', 'Samaritan', 'il buon samaritano'],
          ['il prossimo', 'neighbor', "chi è il mio prossimo?"],
          ["l'olio", 'oil', 'versò olio e vino'],
          ['pregare', 'to pray', 'insegnateci a pregare'],
          ['il Padre Nostro', "Lord's Prayer", 'Padre nostro, che sei nei cieli'],
          ['chiedere', 'to ask', 'chiedete e vi sarà dato'],
          ['il demonio', 'demon', 'scacciava un demonio'],
        ],
        grammar: {
          title: 'Reflexive verbs — actions done to oneself',
          body: '"Alzarsi" (to get up), "chiamarsi" (to be called), "fermarsi" (to stop). The pronoun matches the subject: mi, ti, si, ci, vi, si. "Si è fermato" (he stopped himself).',
        },
        prompt: {
          it: "Un uomo si è avvicinato a Gesù e ha chiesto: \"Chi è il mio prossimo?\" Gesù ha raccontato la storia del buon samaritano.",
          en: 'Retell the Good Samaritan parable in Italian. Who stopped? Who passed by?',
        },
      },
      {
        n: 14, d: 'Jul 13-19', r: 'Luke 12-13', b: 'Future tense', review: false,
        vocab: [
          ['la ricchezza', 'wealth', 'la vita non dipende dalla ricchezza'],
          ['il granaio', 'granary', 'costruirò granai più grandi'],
          ['preoccuparsi', 'to worry', 'non preoccupatevi per la vita'],
          ['il fico', 'fig tree', 'un uomo aveva un fico'],
          ['la porta stretta', 'narrow gate', 'entrate per la porta stretta'],
          ["l'ipocrita", 'hypocrite', 'ipocriti!'],
          ['il regno di Dio', 'kingdom of God', 'il regno di Dio è vicino'],
        ],
        grammar: {
          title: 'Futuro semplice — the future tense',
          body: 'Add -rò, -rai, -rà, -remo, -rete, -ranno to the infinitive stem. Parlare → parlerò. Irregular stems: essere → sarò, avere → avrò, fare → farò, venire → verrò.',
        },
        prompt: {
          it: 'L\'uomo ricco ha detto: "Costruirò granai più grandi. Dirò alla mia anima: mangia, bevi, goditi la vita."',
          en: 'Write the parable of the rich fool. What did he plan? What happened instead?',
        },
      },
      {
        n: 15, d: 'Jul 20-26', r: 'Luke 14-16', b: 'Conditional: vorrei, sarebbe', review: false,
        vocab: [
          ['il banchetto', 'banquet', 'diede un grande banchetto'],
          ["l'invitato", 'guest', 'gli invitati non vennero'],
          ['la pecora perduta', 'lost sheep', 'se perde una delle cento pecore'],
          ['il figlio prodigo', 'prodigal son', 'il figlio minore'],
          ['il padre misericordioso', 'merciful father', 'gli corse incontro'],
          ['abbracciare', 'to embrace', 'lo abbracciò e lo baciò'],
          ['la festa', 'the celebration', 'facciamo festa'],
        ],
        grammar: {
          title: 'Condizionale — "would" and "could"',
          body: '"Vorrei" (I would like), "sarebbe" (it would be), "potrei" (I could), "dovresti" (you should). Formed by adding -rei, -resti, -rebbe endings.',
        },
        prompt: {
          it: "Il padre ha visto il figlio da lontano. Ha avuto compassione, è corso incontro a lui e lo ha abbracciato.",
          en: "Write the moment the prodigal son returns home from the father's perspective.",
        },
      },
      {
        n: 16, d: 'Jul 27-Aug 2', r: 'Luke 17-18', b: 'Relative pronouns: che, cui', review: false,
        vocab: [
          ['la gratitudine', 'gratitude', 'il samaritano ha reso grazie'],
          ["l'umiltà", 'humility', 'chi si umilia sarà esaltato'],
          ['il giudice', 'judge', 'il giudice ingiusto'],
          ['la vedova', 'widow', 'la vedova veniva da lui'],
          ['il pubblicano', 'tax collector', 'il pubblicano non osava'],
          ['la fede', 'faith', 'la tua fede ti ha salvato'],
          ['i bambini', 'children', 'lasciate che i bambini vengano'],
        ],
        grammar: {
          title: 'Relative pronouns: che and cui',
          body: '"Che" replaces a subject or direct object: "il giudice che non temeva Dio." "Cui" replaces an indirect object after a preposition: "la donna di cui parlava."',
        },
        prompt: {
          it: 'Il fariseo pregava: "Grazie, Dio, perché non sono come gli altri uomini." Il pubblicano diceva: "Dio, abbi pietà di me peccatore."',
          en: "Compare the Pharisee and the tax collector's prayers. Who went home justified?",
        },
      },
      {
        n: 17, d: 'Aug 3-9', r: 'Luke 19-21', b: 'Compound sentences, connectives', review: false,
        vocab: [
          ['Zaccheo', 'Zacchaeus', 'Zaccheo era un pubblicano ricco'],
          ['la salvezza', 'salvation', 'oggi la salvezza è entrata in questa casa'],
          ['il tempio', 'temple', 'purificò il tempio'],
          ["l'asino", 'donkey', 'trovate un asino'],
          ['la moneta', 'coin', 'la moneta della vedova'],
          ['vigilare', 'to watch', 'vigilate e pregate'],
          ['la distruzione', 'destruction', 'distruggeranno i tuoi nemici'],
        ],
        grammar: {
          title: 'Connectives — linking ideas in Italian',
          body: '"Quindi" (therefore), "però" (however), "invece" (instead), "anche" (also), "sia... sia" (both... and), "né... né" (neither... nor), "poiché" (since/because).',
        },
        prompt: {
          it: "Zaccheo era ricco ma si sentiva solo. Quando Gesù lo ha chiamato, è sceso dall'albero di sicomoro e lo ha accolto con gioia.",
          en: "Write Zacchaeus's story — include his motivation, the encounter, and his response.",
        },
      },
      {
        n: 18, d: 'Aug 10-16', r: 'Luke 22-24', b: 'Review week + iTalki: discuss Luke', review: true,
        vocab: [
          ['il tradimento', 'betrayal', 'Giuda lo consegnò'],
          ["l'ultima cena", 'Last Supper', 'diede loro il pane'],
          ['il calice', 'chalice/cup', 'questo calice è la nuova alleanza'],
          ['la passione', 'passion/suffering', 'la passione di Cristo'],
          ['Emmaus', 'Emmaus', 'la strada di Emmaus'],
          ["l'ascensione", 'ascension', 'fu portato in cielo'],
          ['la benedizione', 'blessing', 'li benedì e si allontanò'],
        ],
        grammar: {
          title: 'Putting it all together — a review',
          body: 'Read Luke 22-24 and deliberately notice: (1) passato prossimo vs imperfetto, (2) reflexive verbs, (3) object pronouns, (4) conditional constructions, (5) relative pronouns. Write a paragraph using at least one of each.',
        },
        prompt: {
          it: 'I discepoli di Emmaus camminavano tristi. Gesù si è avvicinato a loro, ma non lo riconobbero. Li ha accompagnati e spiegato le Scritture.',
          en: 'Write the full Emmaus road story — the walk, the conversation, the moment of recognition.',
        },
        italki: [
          'Qual è la parabola del vangelo di Luca che ti ha colpito di più?',
          'Descrivi Gesù come lo vedi nel vangelo di Luca.',
          'Come descrivi la Pasqua in italiano?',
          'Cosa hai imparato di nuovo in italiano leggendo la Bibbia?',
        ],
      },
    ],
  },
  {
    id: 'p3',
    title: 'Phase 3: Expansion',
    book: 'Acts of the Apostles',
    badgeLabel: 'Upper intermediate',
    badgeBg: '#FAEEDA',
    badgeColor: '#633806',
    weeks: [
      {
        n: 19, d: 'Aug 17-23', r: 'Acts 1-3', b: 'Subjunctive mood: intro', review: false,
        vocab: [
          ["l'ascensione", 'ascension', 'fu elevato in alto'],
          ['la Pentecoste', 'Pentecost', 'il giorno di Pentecoste'],
          ['lo Spirito Santo', 'Holy Spirit', 'furono tutti pieni di Spirito Santo'],
          ['le lingue di fuoco', 'tongues of fire', 'lingue come di fuoco'],
          ['battezzarsi', 'to be baptized', 'battezzatevi'],
          ['il peccato', 'sin', 'per la remissione dei peccati'],
          ['la comunità', 'community', 'erano assidui nella comunione'],
        ],
        grammar: {
          title: 'Congiuntivo — the subjunctive mood',
          body: 'Used to express doubt, desire, emotion, or necessity after certain conjunctions: "affinché" (so that), "sebbene" (although), "prima che" (before). The goal this week is recognition — find three subjunctive constructions in Acts 1-3.',
        },
        prompt: {
          it: 'Pietro si alzò e ha parlato alla folla: "Pentitevi e ognuno di voi sia battezzato nel nome di Gesù Cristo."',
          en: "Write Peter's Pentecost sermon in summary. What was his message? How did people respond?",
        },
      },
      {
        n: 20, d: 'Aug 24-30', r: 'Acts 4-6', b: 'Subjunctive with doubt and opinion', review: false,
        vocab: [
          ['la guarigione', 'healing', 'la guarigione dello storpio'],
          ['la prigione', 'prison', 'li gettarono in prigione'],
          ['Anania', 'Ananias', 'Anania con Saffira sua moglie'],
          ['mentire', 'to lie', 'hai mentito allo Spirito Santo'],
          ['i diaconi', 'deacons', 'scelsero sette uomini'],
          ['Stefano', 'Stephen', 'Stefano era pieno di grazia'],
          ['la persecuzione', 'persecution', 'scoppiò una grande persecuzione'],
        ],
        grammar: {
          title: 'Subjunctive after verbs of doubt and opinion',
          body: '"Penso che" (I think that), "credo che" (I believe that), "dubito che" (I doubt that), "sembra che" (it seems that) — all trigger subjunctive. "Credo che Stefano abbia detto la verità."',
        },
        prompt: {
          it: 'Pietro ha detto ad Anania: "Perché Satana ti ha riempito il cuore fino a mentire allo Spirito Santo?"',
          en: 'Write the scene of Ananias and Sapphira. What sin did they commit? What was the consequence?',
        },
      },
      {
        n: 21, d: 'Aug 31-Sep 6', r: 'Acts 7-9', b: 'Passive voice', review: false,
        vocab: [
          ['il martirio', 'martyrdom', 'la morte di Stefano'],
          ['la lapidazione', 'stoning', 'lo lapidavano'],
          ['Saulo', 'Saul', 'Saulo approvava la sua uccisione'],
          ['la conversione', 'conversion', 'la conversione di Paolo'],
          ['la via di Damasco', 'road to Damascus', 'sulla via di Damasco'],
          ['cieco', 'blind', 'per tre giorni non vide nulla'],
          ['il battesimo', 'baptism', 'fu battezzato'],
        ],
        grammar: {
          title: 'Voce passiva — the passive voice',
          body: 'Active: "Pietro ha guarito il cieco." Passive: "Il cieco è stato guarito da Pietro." Formed with essere + past participle. The participle agrees with the subject in gender and number.',
        },
        prompt: {
          it: 'Saulo cadde a terra e sentì una voce: "Saulo, Saulo, perché mi perseguiti?" Era Gesù che gli parlava.',
          en: "Write Paul's conversion on the road to Damascus from his own perspective.",
        },
      },
      {
        n: 22, d: 'Sep 7-13', r: 'Acts 10-12', b: 'Gerund: stare + gerundio', review: false,
        vocab: [
          ['la visione', 'vision', 'Pietro ebbe una visione'],
          ['Cornelio', 'Cornelius', 'il centurione Cornelio'],
          ['i pagani', 'Gentiles', 'il vangelo anche ai pagani'],
          ['il battesimo', 'baptism', 'chi può impedire il battesimo?'],
          ["l'angelo", 'angel', 'un angelo del Signore apparve'],
          ['il carcere', 'prison', 'Pietro era in carcere'],
          ['Erode', 'Herod', 'Erode lo aveva arrestato'],
        ],
        grammar: {
          title: 'Gerundio — ongoing and simultaneous action',
          body: '"Stare + gerundio" expresses an action in progress: "stava pregando" (was praying). The gerund (-ando/-endo) can also express simultaneity: "uscendo dalla prigione, Pietro vide..."',
        },
        prompt: {
          it: 'Mentre Pietro stava dormendo in prigione, un angelo del Signore apparve. Lo colpì al fianco e disse: "Alzati!"',
          en: 'Write Peter\'s escape from prison. Use "stava + gerundio" at least twice.',
        },
      },
      {
        n: 23, d: 'Sep 14-20', r: 'Acts 13-15', b: 'Reported speech', review: false,
        vocab: [
          ['il viaggio missionario', 'missionary journey', 'il primo viaggio'],
          ['Barnaba', 'Barnabas', 'Barnaba e Paolo'],
          ['la sinagoga', 'synagogue', 'entrarono nella sinagoga'],
          ['il concilio', 'council', 'il concilio di Gerusalemme'],
          ['la circoncisione', 'circumcision', 'la questione della circoncisione'],
          ['la grazia', 'grace', 'vivere nella grazia di Dio'],
          ['annunciare', 'to announce', 'annunciarono la parola di Dio'],
        ],
        grammar: {
          title: 'Discorso indiretto — reported speech',
          body: 'Direct: Paolo disse: "Credo in Gesù." Indirect: Paolo disse che credeva in Gesù. Note the tense shift: present → imperfect, future → conditional. "Disse che sarebbe tornato."',
        },
        prompt: {
          it: 'Paolo ha annunciato nella sinagoga: "Dio ha resuscitato Gesù dai morti. Per mezzo di lui vi è annunciata la remissione dei peccati."',
          en: "Write Paul's synagogue sermon in Pisidian Antioch in reported speech form.",
        },
      },
      {
        n: 24, d: 'Sep 21-27', r: 'Acts 16-18', b: 'Advanced prepositions', review: false,
        vocab: [
          ['Lidia', 'Lydia', 'Lidia apriva il cuore'],
          ['il terremoto', 'earthquake', 'ci fu un gran terremoto'],
          ['il carcere', 'prison', 'il custode del carcere'],
          ['Corinto', 'Corinth', 'giunsero a Corinto'],
          ["l'Areopago", 'Areopagus', "in mezzo all'Areopago"],
          ['il missionario', 'missionary', 'missionari instancabili'],
          ['la sinagoga', 'synagogue', 'ogni sabato nella sinagoga'],
        ],
        grammar: {
          title: 'Preposizioni articolate and complex prepositions',
          body: '"Al di là" (beyond), "in mezzo a" (in the middle of), "davanti a" (in front of), "dietro a" (behind), "accanto a" (next to), "insieme a" (together with).',
        },
        prompt: {
          it: "Paolo si alzò in mezzo all'Areopago e disse: \"Ateniesi, vi vedo in tutto molto religiosi. Ho trovato un altare con l'iscrizione: Al Dio ignoto.\"",
          en: "Write Paul's speech in Athens. Who was he addressing? What argument did he make?",
        },
      },
      {
        n: 25, d: 'Sep 28-Oct 4', r: 'Acts 19-21', b: 'Vocabulary: emotions, belief, community', review: false,
        vocab: [
          ['la magia', 'magic', 'bruciarono i libri di magia'],
          ['il tumulto', 'riot', 'il tumulto degli artigiani'],
          ["l'argentiere", 'silversmith', "Demetrio l'argentiere"],
          ['la profezia', 'prophecy', 'aveva quattro figlie profetesse'],
          ['legare', 'to bind', 'lo legheranno e lo consegneranno'],
          ['il viaggio', 'the journey', 'ci imbarcammo'],
          ['lo Spirito', 'the Spirit', 'lo Spirito Santo mi attesta'],
        ],
        grammar: {
          title: 'Vocabulary expansion — emotional and spiritual register',
          body: '"Commuoversi" (to be moved emotionally), "rattristarsi" (to become sad), "rallegrarsi" (to rejoice), "temere" (to fear/revere), "sperare" (to hope), "fidarsi di" (to trust in).',
        },
        prompt: {
          it: 'Paolo disse agli anziani di Efeso: "Non ho cercato né argento né oro né vesti di nessuno. Sapete che a questi miei bisogni hanno provveduto le mie mani."',
          en: "Write Paul's farewell speech at Miletus. What did he say about his ministry? How did the elders respond?",
        },
      },
      {
        n: 26, d: 'Oct 5-11', r: 'Acts 22-24', b: 'Formal vs informal register', review: false,
        vocab: [
          ['la difesa', 'defense', 'la difesa di Paolo'],
          ['il sinedrio', 'Sanhedrin', 'davanti al sinedrio'],
          ['la congiura', 'conspiracy', 'una congiura contro Paolo'],
          ['il governatore', 'governor', 'il governatore Felice'],
          ['il processo', 'trial', 'durante il processo'],
          ['il testimone', 'witness', 'sono testimone di queste cose'],
          ["l'accusa", 'accusation', 'le accuse contro Paolo'],
        ],
        grammar: {
          title: 'Registro formale vs informale',
          body: "Paul's speeches are formal public oratory — longer sentences, subjunctive, elevated vocabulary. Notice how Paul addresses different audiences (Jewish crowd vs Roman governor) and shifts his vocabulary accordingly.",
        },
        prompt: {
          it: 'Paolo disse: "Sono cittadino romano." Il tribuno domandò: "Tu sei romano?" E Paolo rispose: "Sì."',
          en: "Write Paul's defense before Felix in Acts 24. What charges were made? How did Paul respond?",
        },
      },
      {
        n: 27, d: 'Oct 12-18', r: 'Acts 25-26', b: 'Complex sentence patterns', review: false,
        vocab: [
          ['Festo', 'Festus', 'il governatore Festo'],
          ['Agrippa', 'Agrippa', 'il re Agrippa'],
          ["l'appello", 'appeal', 'ho fatto appello a Cesare'],
          ['la testimonianza', 'testimony', 'la mia testimonianza'],
          ['convertirsi', 'to convert', 'perché si convertissero'],
          ['la luce', 'light', 'una luce dal cielo'],
          ['la grazia', 'grace', 'grazie alla grazia di Dio'],
        ],
        grammar: {
          title: 'Periodi ipotetici — complex conditional sentences',
          body: '(1) Real: "Se parli italiano, capisci la Bibbia." (2) Unlikely: "Se parlassi italiano, capirei tutto." (3) Impossible/past: "Se avessi parlato italiano, avrei capito."',
        },
        prompt: {
          it: 'Paolo disse ad Agrippa: "Vorrei a Dio che non solo tu, ma anche tutti coloro che mi ascoltano oggi diventassero come sono io, a parte queste catene!"',
          en: "Write Paul's testimony before King Agrippa. What was his before/after story?",
        },
      },
      {
        n: 28, d: 'Oct 19-25', r: 'Acts 27-28', b: 'Review week + iTalki: discuss Acts', review: true,
        vocab: [
          ['il naufragio', 'shipwreck', 'il naufragio di Paolo'],
          ["l'isola", 'island', "l'isola di Malta"],
          ['il serpente', 'snake', 'una vipera uscì dal fuoco'],
          ['Roma', 'Rome', 'finalmente arrivammo a Roma'],
          ['predicare', 'to preach', 'predicava il regno di Dio'],
          ["l'impedimento", 'hindrance', 'senza impedimento alcuno'],
          ['la nave', 'ship', 'la nave si incagliò'],
        ],
        grammar: {
          title: 'Phase 3 grammar review — passive, gerund, subjunctive',
          body: 'Write three sentences about Acts 27-28 using: (1) passive — "Paolo fu morso da una vipera"; (2) gerund — "stava predicando quando..."; (3) subjunctive — "era necessario che Paolo arrivasse a Roma."',
        },
        prompt: {
          it: 'La nave si incagliò e tutti dovevano salvarsi a nuoto o su assi. Così tutti si salvarono e arrivarono sani e salvi a Malta.',
          en: 'Write the shipwreck narrative. Who was on board? What happened? How did Paul encourage them?',
        },
        italki: [
          'Racconta la storia della conversione di Paolo sulla via di Damasco.',
          'Chi preferisci tra Pietro e Paolo e perché?',
          'Descrivi la Pentecoste in italiano.',
          'Come cambia il tuo italiano quando leggi Atti rispetto al vangelo di Giovanni?',
        ],
      },
    ],
  },
  {
    id: 'p4',
    title: 'Phase 4: Consolidation',
    book: 'Romans + Selected Psalms',
    badgeLabel: 'Advanced',
    badgeBg: '#FBEAF0',
    badgeColor: '#72243E',
    weeks: [
      {
        n: 29, d: 'Oct 26-Nov 1', r: 'Romans 1-2 + Psalm 1', b: 'Theological vocabulary deep dive', review: false,
        vocab: [
          ['il vangelo', 'the gospel', 'il vangelo di Gesù Cristo'],
          ['la giustizia', 'righteousness', 'la giustizia di Dio'],
          ['il giudizio', 'judgment', 'il giudizio di Dio'],
          ["l'ira", 'wrath', "l'ira di Dio"],
          ["l'idolatria", 'idolatry', "caduti nell'idolatria"],
          ["l'albero", 'tree', 'come albero piantato'],
          ['il cammino', 'the way/path', 'non cammina nel consiglio degli empi'],
        ],
        grammar: {
          title: 'Abstract nouns — building theological vocabulary',
          body: 'Romans is dense with abstract nouns: la giustizia, la fede, la grazia, la redenzione, la condanna, la salvezza. Map every theological abstract noun and add it to a dedicated Anki deck labelled "Teologia."',
        },
        prompt: {
          it: 'San Paolo scrive: "Il giusto per fede vivrà." Il Salmo 1 dice: "Beato l\'uomo che non segue il consiglio degli empi."',
          en: 'Connect Romans 1 and Psalm 1. What do they share about the righteous person?',
        },
      },
      {
        n: 30, d: 'Nov 2-8', r: 'Romans 3-4 + Psalm 23', b: 'Argumentation and discourse connectors', review: false,
        vocab: [
          ['la fede', 'faith', 'giustificati per fede'],
          ['la grazia', 'grace', 'per pura grazia'],
          ['la redenzione', 'redemption', 'la redenzione in Cristo'],
          ['il pastore', 'shepherd', 'il Signore è il mio pastore'],
          ["l'abbondanza", 'abundance', 'non manco di nulla'],
          ['il calice', 'cup', 'il mio calice trabocca'],
          ['la tenebrosa valle', 'dark valley', 'nella valle oscura'],
        ],
        grammar: {
          title: 'Connettivi argomentativi — building an argument',
          body: '"Dunque" (therefore), "pertanto" (therefore), "tuttavia" (however), "d\'altra parte" (on the other hand), "anzitutto" (first of all), "in conclusione" (in conclusion). Read Romans 3:21-31 and map his argument.',
        },
        prompt: {
          it: 'Il Signore è il mio pastore: non manco di nulla. Paolo aggiunge: non per le opere della legge, ma per la fede siamo giustificati.',
          en: "Connect Paul's argument in Romans 3-4 with the security of Psalm 23. How do they relate?",
        },
      },
      {
        n: 31, d: 'Nov 9-15', r: 'Romans 5-6 + Psalm 46', b: 'Advanced conversation topics', review: false,
        vocab: [
          ['la pace', 'peace', 'abbiamo pace con Dio'],
          ['la sofferenza', 'suffering', 'glorificarci nelle sofferenze'],
          ['la speranza', 'hope', 'la speranza non delude'],
          ['il rifugio', 'refuge', 'Dio è il nostro rifugio'],
          ['la forza', 'strength', 'la nostra forza'],
          ['il battesimo', 'baptism', 'siamo stati battezzati in Cristo'],
          ['la morte', 'death', 'morti al peccato'],
        ],
        grammar: {
          title: 'Nuances of the subjunctive — purpose and concession',
          body: '"Perché" + subjunctive = so that: "Cristo è morto perché noi vivessimo." "Sebbene" + subjunctive = although: "sebbene fossimo peccatori."',
        },
        prompt: {
          it: 'Paolo scrive: "Dunque siamo stati sepolti insieme a lui mediante il battesimo nella morte, affinché come Cristo è risuscitato dai morti... così anche noi camminiamo in una nuova vita."',
          en: "Explain Paul's baptism theology in Romans 6. What does dying and rising with Christ mean?",
        },
      },
      {
        n: 32, d: 'Nov 16-22', r: 'Romans 7-8 + Psalm 51', b: 'Abstract noun patterns', review: false,
        vocab: [
          ['la carne', 'flesh', 'la legge della carne'],
          ['la condanna', 'condemnation', 'nessuna condanna per quelli in Cristo'],
          ['la figliolanza', 'sonship', 'lo spirito di adozione filiale'],
          ['la creazione', 'creation', 'tutta la creazione geme'],
          ['la misericordia', 'mercy', 'abbi pietà di me'],
          ['il cuore', 'heart', 'crea in me un cuore puro'],
          ['il peccato', 'sin', 'mondami dalla mia colpa'],
        ],
        grammar: {
          title: 'Noun derivation — recognise word families',
          body: 'If you know the verb, you can often guess the noun. Condannare → la condanna. Liberare → la liberazione. Creare → la creazione. For every abstract noun in Romans 7-8, find its verb root and add both to Anki as a pair.',
        },
        prompt: {
          it: 'Paolo grida: "Sono uno sventurato! Chi mi libererà da questo corpo votato alla morte?" E poi risponde: "Grazie a Dio per mezzo di Gesù Cristo nostro Signore!"',
          en: "Write Paul's struggle in Romans 7 and his resolution in 8. What changes between the two chapters?",
        },
      },
      {
        n: 33, d: 'Nov 23-29', r: 'Romans 9-10 + Psalm 91', b: 'Idioms and natural spoken patterns', review: false,
        vocab: [
          ["l'elezione", 'election', "l'elezione per grazia"],
          ['confessare', 'to confess', 'confessa con la tua bocca'],
          ['credere nel cuore', 'believe in heart', 'credere nel cuore'],
          ['la protezione', 'protection', 'sotto la sua protezione'],
          ['il nome del Signore', 'name of the Lord', 'chiunque invoca il nome del Signore'],
          ['essere salvato', 'to be saved', 'sarà salvato'],
          ['il messaggero', 'messenger', 'come udranno senza un messaggero?'],
        ],
        grammar: {
          title: "Idiomatic Italian — phrases that don't translate literally",
          body: '"Avere paura" (to be afraid). "Fare del proprio meglio" (to do one\'s best). "Mettersi in cammino" (to set out). "Avere a cuore" (to care deeply about). Italian idioms often use avere where English uses "to be."',
        },
        prompt: {
          it: 'Paolo scrive: "La Parola è vicina a te, sulla tua bocca e nel tuo cuore." Chi invoca il nome del Signore sarà salvato.',
          en: "Write Romans 10:8-13 in your own Italian words. What is Paul's point about faith and confession?",
        },
      },
      {
        n: 34, d: 'Nov 30-Dec 6', r: 'Romans 11-12 + Psalm 119 (excerpts)', b: 'Review weakest grammar areas', review: false,
        vocab: [
          ['il mistero', 'mystery', 'il mistero di Israele'],
          ['il corpo di Cristo', 'body of Christ', 'un solo corpo in Cristo'],
          ['i doni', 'gifts', 'doni diversi secondo la grazia'],
          ['la Parola', 'the Word', 'la tua Parola è una lampada'],
          ['il sentiero', 'path', 'luce sul mio sentiero'],
          ['offrire', 'to offer', 'offrite i vostri corpi come sacrificio'],
          ['rinnovarsi', 'to be renewed', 'rinnovatevi nella mente'],
        ],
        grammar: {
          title: 'Targeted grammar review',
          body: 'Look back through your writing prompts from Weeks 1-33. Which grammar errors keep appearing? Common persistent errors: essere vs avere in past tense, subjunctive formation, agreement of past participles with essere verbs.',
        },
        prompt: {
          it: 'Paolo esorta: "Non conformatevi a questo mondo, ma trasformatevi rinnovando la vostra mente." I Salmi dicono: "La tua Parola è una lampada per i miei passi."',
          en: 'Connect Romans 12:1-2 and Psalm 119. What do they say about transformation and God\'s Word?',
        },
      },
      {
        n: 35, d: 'Dec 7-13', r: 'Romans 13-14 + Psalm 121', b: 'Final Babbel units + free conversation', review: false,
        vocab: [
          ["l'autorità", 'authority', "ogni persona sia sottomessa alle autorità"],
          ['amare il prossimo', 'love neighbor', 'amerai il prossimo tuo'],
          ['la coscienza', 'conscience', 'secondo la propria coscienza'],
          ['il soccorso', 'help', 'il mio soccorso viene dal Signore'],
          ['vegliare', 'to watch over', 'non si assopisce, non dorme'],
          ['il custode', 'guardian', 'il Signore è il tuo custode'],
          ['il viaggio', 'journey', 'il Signore protegge la tua vita'],
        ],
        grammar: {
          title: 'Free production — write without a prompt',
          body: 'Write freely in Italian for 10 minutes each day. No dictionary, no checking. Write what you know. Fluency comes from committing to imperfect output.',
        },
        prompt: {
          it: 'Scrivi liberamente — qualcosa che hai imparato, una preghiera, un pensiero sulla Bibbia in italiano. Nessuna regola oggi.',
          en: 'Free writing day. Write anything in Italian for 10 minutes without stopping.',
        },
      },
      {
        n: 36, d: 'Dec 14-20', r: 'Romans 15-16 + Psalm 139', b: 'iTalki: full session in Italian only', review: true,
        vocab: [
          ['la speranza', 'hope', 'il Dio della speranza'],
          ["l'unità", 'unity', "l'unità tra ebrei e pagani"],
          ['i saluti', 'greetings', 'i saluti finali di Paolo'],
          ['conoscere', 'to know', 'tu mi conosci'],
          ['tessere', 'to weave', 'mi hai tessuto nel seno di mia madre'],
          ['fuggire', 'to flee', 'dove fuggirò dalla tua presenza?'],
          ['meraviglioso', 'wonderful', 'meravigliose sono le tue opere'],
        ],
        grammar: {
          title: 'Final review — your full Italian grammar toolkit',
          body: 'You now have: present, past, imperfect, future, conditional tenses; subjunctive; passive voice; gerund; reflexive verbs; object pronouns; relative pronouns; conditional sentences; formal/informal register; idioms. Write a paragraph using at least six of these deliberately.',
        },
        prompt: {
          it: 'Dio, tu mi conosci. Conosci il mio sedermi e il mio alzarmi. Comprendi da lontano i miei pensieri. Dove potrei andare, lontano dal tuo spirito?',
          en: 'Write Psalm 139 in your own Italian words. What does it mean to be fully known by God?',
        },
        italki: [
          'Racconta il tuo percorso di fede in italiano.',
          'Quale versetto della Bibbia in italiano ti ha cambiato di più?',
          'Descrivi cosa significa per te studiare la Bibbia in una lingua straniera.',
          'Fai una domanda al tuo insegnante italiano sulla fede o sulla Bibbia.',
        ],
      },
      {
        n: 37, d: 'Dec 21-27', r: 'Review + Psalm 150', b: 'Buon Natale. Hai finito.', review: true,
        vocab: [
          ['lodare', 'to praise', 'lodate il Signore'],
          ["l'alleluja", 'alleluia', 'alleluia!'],
          ['gli strumenti', 'instruments', "con la tromba, con l'arpa"],
          ['tutta la creazione', 'all creation', 'tutto ciò che respira'],
          ['la gloria', 'glory', 'gloria a Dio'],
          ['il Natale', 'Christmas', 'Buon Natale'],
          ['la fine', 'the end', 'sei arrivato alla fine'],
        ],
        grammar: {
          title: 'Celebrazione — you made it',
          body: 'Psalm 150 is six verses of pure praise, all imperative verbs: lodate (praise), lodatelo (praise him). You have spent 37 weeks learning to read Scripture in Italian. Read Psalm 150 aloud today — slowly, deliberately, in Italian.',
        },
        prompt: {
          it: 'Lodate Dio nel suo santuario. Lodatelo nel firmamento della sua potenza. Tutto ciò che respira lodi il Signore. Alleluia.',
          en: 'Write a final reflection in Italian: what has this 37-week journey meant to you?',
        },
        italki: [
          "Racconta in italiano cos'hai imparato in questi 37 settimane.",
          'Leggi il Salmo 150 in italiano ad alta voce con il tuo insegnante.',
          "Come vuoi continuare a studiare l'italiano dopo Natale?",
          'Buon Natale — cosa festeggi oggi?',
        ],
      },
    ],
  },
];
