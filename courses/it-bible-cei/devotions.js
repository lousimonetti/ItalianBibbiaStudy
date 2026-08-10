// Devotional / memorized texts for this course — Catholic prayers in Italian.
// (Was src/data/prayers.js; moved here in the pedagogy pass because it is
// course content, not app code. A course that omits this file simply has no
// Devotions tab.)
//
// WHY THESE ARE THE BEST LANGUAGE MATERIAL IN THE APP
//   • The meaning is already known by heart in English, so comprehension is
//     free — which is otherwise the hardest thing to source at this level.
//   • They are memorizable formulaic chunks, and formulaic language is the
//     fastest route adults have to fluent production: a chunk bypasses the
//     sentence-assembly bottleneck entirely.
//   • They are recited repeatedly, delivering the distributed re-encounter the
//     weekly vocabulary can't (only 9% of vocab terms recur across weeks).
//   • They are dense in exactly the grammar the course teaches — and in some
//     grammar it doesn't (passato remoto, imperatives with attached clitics).
//
// SHAPE
//   section = { id, title, titleEn, intro?, introEn?, prayers: [...] }
//   prayer  = {
//     id, title, titleEn, note?, noteEn?,
//     it, en,                    // full text — always present (fallback view)
//     lines?: [{ it, en, blank? }],  // line-aligned for shadowing + chunk cards
//     focus?: { text, weeks: [n] },  // what grammar this teaches, + course weeks
//   }
//
// `lines` is what unlocks per-line audio, shadowing, and cloze chunk cards.
// `blank` names the word a chunk card hides — chosen for grammatical payload
// (`sia`, `venga`) rather than difficulty. Lines without `blank` fall back to
// the longest word.

export const devotionSections = [
  {
    id: 'rosario',
    title: 'Il Rosario',
    titleEn: 'The Rosary',
    intro: 'Le preghiere fondamentali del Rosario.',
    introEn: 'The foundational prayers of the Rosary.',
    prayers: [
      {
        id: 'segno-croce',
        title: 'Segno della Croce',
        titleEn: 'Sign of the Cross',
        it: 'Nel nome del Padre, del Figlio e dello Spirito Santo. Amen.',
        en: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',
        focus: {
          text: 'Four preposizioni articolate in one short line: nel (in+il), del (di+il) twice, dello (di+lo). Note dello, not "del" — Spirito starts with s+consonant.',
          weeks: [6, 24],
        },
        lines: [
          { it: 'Nel nome del Padre,', en: 'In the name of the Father,', blank: 'del' },
          { it: 'del Figlio', en: 'and of the Son', blank: 'del' },
          { it: 'e dello Spirito Santo.', en: 'and of the Holy Spirit.', blank: 'dello' },
          { it: 'Amen.', en: 'Amen.' },
        ],
      },
      {
        id: 'credo',
        title: 'Credo degli Apostoli',
        titleEn: "Apostles' Creed",
        it: 'Io credo in Dio, Padre onnipotente, creatore del cielo e della terra; e in Gesù Cristo, suo unico Figlio, nostro Signore, il quale fu concepito di Spirito Santo, nacque da Maria Vergine, patì sotto Ponzio Pilato, fu crocifisso, morì e fu sepolto; discese agli inferi; il terzo giorno risuscitò da morte; salì al cielo, siede alla destra di Dio Padre onnipotente; di là verrà a giudicare i vivi e i morti. Credo nello Spirito Santo, la santa Chiesa cattolica, la comunione dei santi, la remissione dei peccati, la risurrezione della carne, la vita eterna. Amen.',
        en: 'I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead. I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.',
        focus: {
          text: 'The single best passato remoto paradigm you will ever memorize: fu · nacque · patì · morì · discese · risuscitò · salì. This is the narrative tense of the Gospels — the course never teaches it, but you read it every day.',
          weeks: [8, 9, 10],
        },
        lines: [
          { it: 'Io credo in Dio, Padre onnipotente,', en: 'I believe in God, the Father almighty,', blank: 'credo' },
          { it: 'creatore del cielo e della terra;', en: 'Creator of heaven and earth;', blank: 'della' },
          { it: 'e in Gesù Cristo, suo unico Figlio, nostro Signore,', en: 'and in Jesus Christ, his only Son, our Lord,', blank: 'suo' },
          { it: 'il quale fu concepito di Spirito Santo,', en: 'who was conceived by the Holy Spirit,', blank: 'fu' },
          { it: 'nacque da Maria Vergine,', en: 'born of the Virgin Mary,', blank: 'nacque' },
          { it: 'patì sotto Ponzio Pilato,', en: 'suffered under Pontius Pilate,', blank: 'patì' },
          { it: 'fu crocifisso, morì e fu sepolto;', en: 'was crucified, died and was buried;', blank: 'morì' },
          { it: 'discese agli inferi;', en: 'he descended into hell;', blank: 'discese' },
          { it: 'il terzo giorno risuscitò da morte;', en: 'on the third day he rose again from the dead;', blank: 'risuscitò' },
          { it: 'salì al cielo,', en: 'he ascended into heaven,', blank: 'salì' },
          { it: 'siede alla destra di Dio Padre onnipotente;', en: 'and is seated at the right hand of God the Father almighty;', blank: 'alla' },
          { it: 'di là verrà a giudicare i vivi e i morti.', en: 'from there he will come to judge the living and the dead.', blank: 'verrà' },
          { it: 'Credo nello Spirito Santo,', en: 'I believe in the Holy Spirit,', blank: 'nello' },
          { it: 'la santa Chiesa cattolica, la comunione dei santi,', en: 'the holy Catholic Church, the communion of saints,', blank: 'dei' },
          { it: 'la remissione dei peccati,', en: 'the forgiveness of sins,', blank: 'dei' },
          { it: 'la risurrezione della carne, la vita eterna. Amen.', en: 'the resurrection of the body, and life everlasting. Amen.', blank: 'della' },
        ],
      },
      {
        id: 'padre-nostro',
        title: 'Padre Nostro',
        titleEn: 'Our Father',
        it: 'Padre nostro, che sei nei cieli, sia santificato il tuo nome, venga il tuo regno, sia fatta la tua volontà come in cielo così in terra. Dacci oggi il nostro pane quotidiano, e rimetti a noi i nostri debiti come noi li rimettiamo ai nostri debitori, e non ci indurre in tentazione, ma liberaci dal male. Amen.',
        en: 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.',
        focus: {
          text: 'Three jussive subjunctives in a row — sia santificato, venga, sia fatta. Not predictions ("will be") and not commands, but petitions that something come to pass. Then the register flips to imperatives with clitics attached: dacci, liberaci. And God is "tu" — sei, tuo, tua — never the formal Lei.',
          weeks: [19, 26],
        },
        lines: [
          { it: 'Padre nostro, che sei nei cieli,', en: 'Our Father, who art in heaven,', blank: 'sei' },
          { it: 'sia santificato il tuo nome,', en: 'hallowed be thy name,', blank: 'sia' },
          { it: 'venga il tuo regno,', en: 'thy kingdom come,', blank: 'venga' },
          { it: 'sia fatta la tua volontà', en: 'thy will be done', blank: 'sia' },
          { it: 'come in cielo così in terra.', en: 'on earth as it is in heaven.', blank: 'così' },
          { it: 'Dacci oggi il nostro pane quotidiano,', en: 'Give us this day our daily bread,', blank: 'Dacci' },
          { it: 'e rimetti a noi i nostri debiti', en: 'and forgive us our trespasses,', blank: 'rimetti' },
          { it: 'come noi li rimettiamo ai nostri debitori,', en: 'as we forgive those who trespass against us,', blank: 'li' },
          { it: 'e non ci indurre in tentazione,', en: 'and lead us not into temptation,', blank: 'ci' },
          { it: 'ma liberaci dal male. Amen.', en: 'but deliver us from evil. Amen.', blank: 'liberaci' },
        ],
      },
      {
        id: 'ave-maria',
        title: 'Ave Maria',
        titleEn: 'Hail Mary',
        it: 'Ave, o Maria, piena di grazia, il Signore è con te. Tu sei benedetta fra le donne e benedetto è il frutto del tuo seno, Gesù. Santa Maria, Madre di Dio, prega per noi peccatori, adesso e nell\'ora della nostra morte. Amen.',
        en: 'Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
        focus: {
          text: 'Adjective agreement made audible: benedetta (feminine, of Mary) then benedetto (masculine, of the fruit) in the same breath. Same word, two endings, because Italian adjectives agree with what they describe.',
          weeks: [4],
        },
        lines: [
          { it: 'Ave, o Maria, piena di grazia,', en: 'Hail Mary, full of grace,', blank: 'piena' },
          { it: 'il Signore è con te.', en: 'the Lord is with thee.', blank: 'è' },
          { it: 'Tu sei benedetta fra le donne', en: 'Blessed art thou among women,', blank: 'benedetta' },
          { it: 'e benedetto è il frutto del tuo seno, Gesù.', en: 'and blessed is the fruit of thy womb, Jesus.', blank: 'benedetto' },
          { it: 'Santa Maria, Madre di Dio,', en: 'Holy Mary, Mother of God,', blank: 'Madre' },
          { it: 'prega per noi peccatori,', en: 'pray for us sinners,', blank: 'prega' },
          { it: 'adesso e nell\'ora della nostra morte. Amen.', en: 'now and at the hour of our death. Amen.', blank: 'della' },
        ],
      },
      {
        id: 'gloria',
        title: 'Gloria al Padre',
        titleEn: 'Glory Be',
        it: 'Gloria al Padre e al Figlio e allo Spirito Santo. Come era nel principio, ora e sempre nei secoli dei secoli. Amen.',
        en: 'Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.',
        focus: {
          text: '"Come era nel principio" — the same imperfetto "era" that opens John\'s Prologue, and for the same reason: a state with no beginning and no end.',
          weeks: [1, 11],
        },
        lines: [
          { it: 'Gloria al Padre e al Figlio', en: 'Glory be to the Father, and to the Son,', blank: 'al' },
          { it: 'e allo Spirito Santo.', en: 'and to the Holy Spirit.', blank: 'allo' },
          { it: 'Come era nel principio, ora e sempre', en: 'As it was in the beginning, is now, and ever shall be,', blank: 'era' },
          { it: 'nei secoli dei secoli. Amen.', en: 'world without end. Amen.', blank: 'nei' },
        ],
      },
      {
        id: 'fatima',
        title: 'Preghiera di Fatima',
        titleEn: 'Fatima Prayer',
        note: 'Added to the Rosary after the apparitions at Fátima (1917).',
        it: 'O Gesù mio, perdona le nostre colpe, preservaci dal fuoco dell\'inferno, porta in cielo tutte le anime, specialmente le più bisognose della tua misericordia. Amen.',
        en: 'O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to Heaven, especially those most in need of Thy mercy. Amen.',
        focus: {
          text: 'A chain of tu-form imperatives: perdona, preservaci, porta. Note preservaci — the clitic "ci" (us) attaches to the end of the imperative rather than standing before it.',
          weeks: [12, 26],
        },
        lines: [
          { it: 'O Gesù mio, perdona le nostre colpe,', en: 'O my Jesus, forgive us our sins,', blank: 'perdona' },
          { it: 'preservaci dal fuoco dell\'inferno,', en: 'save us from the fires of hell,', blank: 'preservaci' },
          { it: 'porta in cielo tutte le anime,', en: 'lead all souls to Heaven,', blank: 'porta' },
          { it: 'specialmente le più bisognose della tua misericordia. Amen.', en: 'especially those most in need of Thy mercy. Amen.', blank: 'più' },
        ],
      },
      {
        id: 'salve-regina',
        title: 'Salve Regina',
        titleEn: 'Hail Holy Queen',
        note: 'Sung or recited at the end of the Rosary.',
        it: 'Salve, o Regina, Madre di misericordia, vita, dolcezza e speranza nostra, salve. A te ricorriamo, esuli figli di Eva; a te sospiriamo, gementi e piangenti in questa valle di lacrime. Orsù dunque, avvocata nostra, rivolgi a noi quegli occhi tuoi misericordiosi. E mostraci, dopo questo esilio, Gesù, il frutto benedetto del tuo grembo. O clemente, o pia, o dolce Vergine Maria.',
        en: 'Hail, Holy Queen, Mother of mercy, our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us. And after this, our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary.',
        focus: {
          text: 'Present participles used as adjectives — gementi, piangenti ("mourning, weeping"). Italian forms these in -ante/-ente and they agree in number like any adjective.',
          weeks: [22],
        },
        lines: [
          { it: 'Salve, o Regina, Madre di misericordia,', en: 'Hail, Holy Queen, Mother of mercy,', blank: 'misericordia' },
          { it: 'vita, dolcezza e speranza nostra, salve.', en: 'our life, our sweetness, and our hope.', blank: 'speranza' },
          { it: 'A te ricorriamo, esuli figli di Eva;', en: 'To thee do we cry, poor banished children of Eve;', blank: 'ricorriamo' },
          { it: 'a te sospiriamo, gementi e piangenti', en: 'to thee do we send up our sighs, mourning and weeping', blank: 'piangenti' },
          { it: 'in questa valle di lacrime.', en: 'in this valley of tears.', blank: 'questa' },
          { it: 'Orsù dunque, avvocata nostra,', en: 'Turn then, most gracious advocate,', blank: 'dunque' },
          { it: 'rivolgi a noi quegli occhi tuoi misericordiosi.', en: 'thine eyes of mercy toward us.', blank: 'rivolgi' },
          { it: 'E mostraci, dopo questo esilio, Gesù,', en: 'And after this, our exile, show unto us Jesus,', blank: 'mostraci' },
          { it: 'il frutto benedetto del tuo grembo.', en: 'the blessed fruit of thy womb.', blank: 'benedetto' },
          { it: 'O clemente, o pia, o dolce Vergine Maria.', en: 'O clement, O loving, O sweet Virgin Mary.', blank: 'dolce' },
        ],
      },
    ],
  },
  {
    id: 'leone-xiii',
    title: 'Preci Leonine — Papa Leone XIII',
    titleEn: 'Leonine Prayers — Pope Leo XIII',
    intro: 'Papa Leone XIII ordinò queste preghiere nel 1884 da recitarsi dopo la Messa bassa in tutta la Chiesa. Includono tre Ave Maria, la Salve Regina, una preghiera per la Chiesa e la celebre Preghiera a San Michele.',
    introEn: 'Pope Leo XIII ordered these prayers in 1884 to be recited after Low Mass throughout the Church. They include three Hail Marys, the Salve Regina, a prayer for the Church, and the famous Prayer to Saint Michael.',
    prayers: [
      {
        id: 'ave-maria-leonine',
        title: 'Ave Maria (×3)',
        titleEn: 'Hail Mary (×3)',
        note: 'Recitata tre volte. / Recited three times.',
        it: 'Ave, o Maria, piena di grazia, il Signore è con te. Tu sei benedetta fra le donne e benedetto è il frutto del tuo seno, Gesù. Santa Maria, Madre di Dio, prega per noi peccatori, adesso e nell\'ora della nostra morte. Amen.',
        en: 'Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
      },
      {
        id: 'salve-regina-leonine',
        title: 'Salve Regina',
        titleEn: 'Hail Holy Queen',
        it: 'Salve, o Regina, Madre di misericordia, vita, dolcezza e speranza nostra, salve. A te ricorriamo, esuli figli di Eva; a te sospiriamo, gementi e piangenti in questa valle di lacrime. Orsù dunque, avvocata nostra, rivolgi a noi quegli occhi tuoi misericordiosi. E mostraci, dopo questo esilio, Gesù, il frutto benedetto del tuo grembo. O clemente, o pia, o dolce Vergine Maria.',
        en: 'Hail, Holy Queen, Mother of mercy, our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us. And after this, our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary.',
      },
      {
        id: 'preghiera-chiesa',
        title: 'Preghiera per la Chiesa',
        titleEn: 'Prayer for the Church',
        it: 'Dio, nostro rifugio e nostra forza, guarda propizio al tuo popolo che ti invoca: e, per l\'intercessione della gloriosa e immacolata Vergine Maria, Madre di Dio, di san Giuseppe, suo sposo, dei tuoi santi apostoli Pietro e Paolo e di tutti i santi, esaudisci, misericordioso e benigno, le preghiere che ti presentiamo per la conversione dei peccatori, per la libertà e l\'esaltazione della Santa Madre Chiesa. Per Cristo nostro Signore. Amen.',
        en: 'O God, our refuge and our strength, look down with mercy upon the people who cry to thee: and through the intercession of the glorious and immaculate Virgin Mary, Mother of God, of Saint Joseph her spouse, of thy holy Apostles Peter and Paul, and of all the Saints, mercifully hear our prayers for the conversion of sinners, and for the freedom and exaltation of Holy Mother Church. Through Christ our Lord. Amen.',
        focus: {
          text: 'A single sentence held together by relative clauses ("che ti invoca", "che ti presentiamo") — exactly the che-construction of week 16, at full liturgical length.',
          weeks: [16, 17],
        },
      },
      {
        id: 'san-michele',
        title: 'Preghiera a San Michele Arcangelo',
        titleEn: 'Prayer to Saint Michael the Archangel',
        note: 'Composta da Papa Leone XIII nel 1886.',
        noteEn: 'Composed by Pope Leo XIII in 1886.',
        it: 'San Michele Arcangelo, difendici nella lotta; sii nostro presidio contro le perfide insidie del demonio. Perché Dio lo ordini, noi supplichevolmente ti imploriamo: e tu, Principe della Milizia Celeste, per la potenza divina, ricaccia nell\'inferno satana e gli altri spiriti maligni, i quali a perdizione delle anime vanno errando sulla terra. Amen.',
        en: 'Saint Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do thou, O Prince of the Heavenly Host, by the power of God, thrust into hell Satan and all evil spirits who wander through the world seeking the ruin of souls. Amen.',
        focus: {
          text: '"Perché Dio lo ordini" is a subjunctive of purpose — perché + subjunctive means "so that", not "because". And "vanno errando" is the stare/andare + gerund construction of week 22.',
          weeks: [19, 22, 31],
        },
        lines: [
          { it: 'San Michele Arcangelo, difendici nella lotta;', en: 'Saint Michael the Archangel, defend us in battle;', blank: 'difendici' },
          { it: 'sii nostro presidio contro le perfide insidie del demonio.', en: 'be our protection against the wickedness and snares of the devil.', blank: 'sii' },
          { it: 'Perché Dio lo ordini, noi supplichevolmente ti imploriamo:', en: 'May God rebuke him, we humbly pray:', blank: 'ordini' },
          { it: 'e tu, Principe della Milizia Celeste, per la potenza divina,', en: 'and do thou, O Prince of the Heavenly Host, by the power of God,', blank: 'della' },
          { it: 'ricaccia nell\'inferno satana e gli altri spiriti maligni,', en: 'thrust into hell Satan and all evil spirits,', blank: 'ricaccia' },
          { it: 'i quali a perdizione delle anime vanno errando sulla terra. Amen.', en: 'who wander through the world seeking the ruin of souls. Amen.', blank: 'errando' },
        ],
      },
    ],
  },
  {
    id: 'leone-xiv',
    title: 'Devozioni di Papa Leone XIV',
    titleEn: 'Devotions of Pope Leo XIV',
    intro: 'Papa Leone XIV (Robert Francis Prevost, eletto l\'8 maggio 2025) è il primo papa agostiniano. La sua prima parola come papa è stata una preghiera: ha guidato la folla in piazza San Pietro nell\'Ave Maria. Il 10 maggio 2025 ha visitato il Santuario della Madre del Buon Consiglio a Genazzano — un santuario mariano caro agli Agostiniani dal 1467 — dove ha pregato con i fedeli.',
    introEn: 'Pope Leo XIV (Robert Francis Prevost, elected May 8, 2025) is the first Augustinian pope. His first words as pope were a prayer: he led the crowd in St. Peter\'s Square in the Hail Mary. On May 10, 2025, he visited the Sanctuary of Our Lady of Good Counsel in Genazzano — a Marian shrine dear to the Augustinians since 1467 — where he prayed with the faithful.',
    prayers: [
      {
        id: 'ave-maria-leone-xiv',
        title: 'Ave Maria',
        titleEn: 'Hail Mary',
        note: 'La prima preghiera di Papa Leone XIV come pontefice, guidata dalla loggia di San Pietro l\'8 maggio 2025.',
        noteEn: "Pope Leo XIV's first prayer as pontiff, led from the loggia of St. Peter's on May 8, 2025.",
        it: 'Ave, o Maria, piena di grazia, il Signore è con te. Tu sei benedetta fra le donne e benedetto è il frutto del tuo seno, Gesù. Santa Maria, Madre di Dio, prega per noi peccatori, adesso e nell\'ora della nostra morte. Amen.',
        en: 'Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
      },
      {
        id: 'madre-buon-consiglio',
        title: 'Preghiera alla Madre del Buon Consiglio',
        titleEn: 'Prayer to Our Lady of Good Counsel',
        note: 'Devozione tradizionale degli Agostiniani al santuario di Genazzano. Papa Leone XIV ha visitato il santuario il 10 maggio 2025.',
        noteEn: 'Traditional Augustinian devotion at the Genazzano shrine. Pope Leo XIV visited the sanctuary on May 10, 2025.',
        it: 'O Madre del Buon Consiglio, proteggici sotto il tuo manto. Tu che sei la guida sicura in ogni incertezza della vita, illumina le nostre menti con la sapienza del tuo Figlio divino. Nei momenti di dubbio, indicaci la via; nelle ore di prova, sostienici con la tua forza materna. Fa\' che la tua intercessione ci ottenga da Gesù la grazia di seguire sempre la volontà di Dio, di camminare nella verità, e di giungere alla gioia del cielo. Amen.',
        en: 'O Mother of Good Counsel, shelter us under your mantle. You who are a sure guide in every uncertainty of life, enlighten our minds with the wisdom of your divine Son. In moments of doubt, show us the way; in hours of trial, sustain us with your maternal strength. May your intercession obtain for us from Jesus the grace to always follow the will of God, to walk in truth, and to reach the joy of heaven. Amen.',
        focus: {
          text: 'Imperatives with attached clitics again — proteggici, indicaci, sostienici — and then "Fa\' che ... ci ottenga", where fare che forces the subjunctive.',
          weeks: [19, 26],
        },
        lines: [
          { it: 'O Madre del Buon Consiglio, proteggici sotto il tuo manto.', en: 'O Mother of Good Counsel, shelter us under your mantle.', blank: 'proteggici' },
          { it: 'Tu che sei la guida sicura in ogni incertezza della vita,', en: 'You who are a sure guide in every uncertainty of life,', blank: 'ogni' },
          { it: 'illumina le nostre menti con la sapienza del tuo Figlio divino.', en: 'enlighten our minds with the wisdom of your divine Son.', blank: 'illumina' },
          { it: 'Nei momenti di dubbio, indicaci la via;', en: 'In moments of doubt, show us the way;', blank: 'indicaci' },
          { it: 'nelle ore di prova, sostienici con la tua forza materna.', en: 'in hours of trial, sustain us with your maternal strength.', blank: 'sostienici' },
          { it: 'Fa\' che la tua intercessione ci ottenga da Gesù la grazia', en: 'May your intercession obtain for us from Jesus the grace', blank: 'ottenga' },
          { it: 'di seguire sempre la volontà di Dio, di camminare nella verità,', en: 'to always follow the will of God, to walk in truth,', blank: 'nella' },
          { it: 'e di giungere alla gioia del cielo. Amen.', en: 'and to reach the joy of heaven. Amen.', blank: 'alla' },
        ],
      },
    ],
  },
];
