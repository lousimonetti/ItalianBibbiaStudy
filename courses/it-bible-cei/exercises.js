// Per-week exercises — merged onto the weeks in content.js (see the bottom of
// that file). Kept here, separate from the week definitions, so the large body of
// drill/comprehension content is authored in one place without bloating each
// week object.
//
// Shapes:
//   drill:          [{ q, a, hint }]  — q has a blank marked `___`; a is the fill;
//                   hint is an English/grammar nudge. Every drill sentence is
//                   anchored to that week's vetted example sentences, so the
//                   Italian is already correct — we only blank a grammar-relevant
//                   token framed by the week's grammar focus.
//   comprehension:  [{ type:'tf', it, en, answer, explain? }]
//                   [{ type:'mc', it, en, options:[...], answer:<index>, explain? }]
//                   it = Italian question/statement; en = English gloss.
//   passage: {
//     ref: 'Giovanni 1,1-5', translation: 'CEI 2008',
//     verses: [{ n: 1, t: '…' }, …]
//   }
//   When a `passage` is present the reader (O2), dictogloss (O4) and comprehension
//   (O5) use it; otherwise they fall back to the week's example sentences.
//
// Speaking layer (plan-speaking.md P3), authored in the SPEAKING block below and
// merged onto each week at export time:
//   phrases:   [{ it, en, lit? }]        — formulaic chunks (S1); lit is a literal
//              word-by-word rendering showing how Italian construes the meaning.
//   transform: [{ instruction, base, answer }] — Italian-only transformation drill
//              (S2); instruction is in Italian, base/answer are vetted correct.
//   questions: [{ q, answers:[...], model }]   — timed spoken Q&A about the reading
//              (S3); answers are acceptable short forms, model a full sentence.

const BASE_EXERCISES = {
  // ── Phase 1: John ─────────────────────────────────────────────────────────
  1: {
    passage: {
      ref: 'Giovanni 1,1-5.14',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'In principio era il Verbo, il Verbo era presso Dio e il Verbo era Dio.' },
        { n: 2, t: 'Egli era in principio presso Dio:' },
        { n: 3, t: 'tutto è stato fatto per mezzo di lui, e senza di lui niente è stato fatto di tutto ciò che esiste.' },
        { n: 4, t: 'In lui era la vita e la vita era la luce degli uomini;' },
        { n: 5, t: 'la luce splende nelle tenebre, e le tenebre non l\'hanno vinta.' },
        { n: 14, t: 'Il Verbo si fece carne e venne ad abitare in mezzo a noi; e noi abbiamo contemplato la sua gloria, gloria come del Figlio unigenito che viene dal Padre, pieno di grazia e di verità.' },
      ],
    },
    drill: [
      { q: 'In principio ___ il Verbo.', a: 'era', hint: 'essere — "was" (a state)' },
      { q: '___ creduto in lui.', a: 'ha', hint: 'avere — forms the past tense with the participle' },
    ],
    comprehension: [
      { type: 'tf', it: 'In principio era il Verbo.', en: 'In the beginning was the Word.', answer: true },
      { type: 'tf', it: 'Le tenebre hanno vinto la luce.', en: 'The darkness overcame the light.', answer: false, explain: '"Le tenebre non la vinsero" — the darkness did not overcome it.' },
    ],
  },
  2: {
    passage: {
      ref: 'Giovanni 3,1-3.5.8.16',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'C\'era tra i farisei un uomo di nome Nicodemo, un capo dei Giudei.' },
        { n: 2, t: 'Egli andò da Gesù di notte e gli disse: «Rabbi, sappiamo che sei un maestro venuto da Dio; nessuno infatti può fare i segni che tu fai, se Dio non è con lui».' },
        { n: 3, t: 'Gli rispose Gesù: «In verità, in verità ti dico, se uno non nasce dall\'alto, non può vedere il regno di Dio».' },
        { n: 5, t: 'Rispose Gesù: «In verità, in verità ti dico, se uno non nasce da acqua e da Spirito, non può entrare nel regno di Dio.' },
        { n: 8, t: 'Il vento soffia dove vuole e ne odi la voce, ma non sai da dove viene né dove va: così è chiunque è nato dallo Spirito».' },
        { n: 16, t: 'Dio infatti ha tanto amato il mondo da dare il Figlio unigenito, perché chiunque crede in lui non vada perduto, ma abbia la vita eterna.' },
      ],
    },
    drill: [
      { q: 'Lo Spirito ___ dove vuole.', a: 'soffia', hint: 'soffiare → present, 3rd person' },
      { q: 'Chi ___ in lui ha la vita.', a: 'crede', hint: 'credere → crede (3rd person present)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Per entrare nel regno di Dio bisogna nascere di nuovo.', en: 'To enter the kingdom of God one must be born again.', answer: true },
      { type: 'tf', it: 'Gesù incontrò la donna samaritana al fiume Giordano.', en: 'Jesus met the Samaritan woman at the river Jordan.', answer: false, explain: 'Era presso il pozzo — at the well, not the river.' },
    ],
  },
  3: {
    passage: {
      ref: 'Giovanni 6,35.48-51',
      translation: 'CEI 2008',
      verses: [
        { n: 35, t: 'Gesù disse loro: «Io sono il pane della vita; chi viene a me non avrà più fame e chi crede in me non avrà più sete.' },
        { n: 48, t: 'Io sono il pane della vita.' },
        { n: 49, t: 'I vostri padri hanno mangiato la manna nel deserto e sono morti;' },
        { n: 50, t: 'questo è il pane che discende dal cielo, perché chi ne mangia non muoia.' },
        { n: 51, t: 'Io sono il pane vivo, disceso dal cielo. Se uno mangia di questo pane vivrà in eterno e il pane che io darò è la mia carne per la vita del mondo».' },
      ],
    },
    drill: [
      { q: '___ cinque pani e due pesci.', a: "C'erano", hint: '"ci sono" in the past — there were' },
      { q: 'Sono io il ___ della vita.', a: 'pane', hint: 'bread (il pane)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Gesù sfamò una grande folla con cinque pani e due pesci.', en: 'Jesus fed a large crowd with five loaves and two fish.', answer: true },
      { type: 'tf', it: 'Dopo il miracolo la folla rimase affamata.', en: 'After the miracle the crowd stayed hungry.', answer: false, explain: '"Mangiarono e si saziarono" — they ate and were satisfied.' },
    ],
  },
  4: {
    passage: {
      ref: 'Giovanni 8,12.31-32.36',
      translation: 'CEI 2008',
      verses: [
        { n: 12, t: 'Gesù parlò loro di nuovo: «Io sono la luce del mondo; chi segue me non camminerà nelle tenebre, ma avrà la luce della vita».' },
        { n: 31, t: 'Gesù allora disse ai Giudei che credevano in lui: «Se rimanete nella mia parola, siete davvero miei discepoli;' },
        { n: 32, t: 'conoscerete la verità e la verità vi farà liberi».' },
        { n: 36, t: 'Se dunque il Figlio vi farà liberi, sarete liberi davvero.' },
      ],
    },
    drill: [
      { q: 'La verità vi farà ___.', a: 'liberi', hint: 'agrees with "voi" — masculine plural' },
      { q: 'Io sono la ___ del mondo.', a: 'luce', hint: 'light (la luce, feminine)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Gesù insegnava nel tempio.', en: 'Jesus was teaching in the temple.', answer: true },
      { type: 'tf', it: "Gesù condannò la donna sorpresa in adulterio.", en: 'Jesus condemned the woman caught in adultery.', answer: false, explain: '"Neanch\'io ti condanno" — neither do I condemn you.' },
    ],
  },
  5: {
    passage: {
      ref: 'Giovanni 11,25-26.35.43-44',
      translation: 'CEI 2008',
      verses: [
        { n: 25, t: 'Gesù le disse: «Io sono la risurrezione e la vita; chi crede in me, anche se muore, vivrà;' },
        { n: 26, t: 'chiunque vive e crede in me, non morirà in eterno. Credi questo?»' },
        { n: 35, t: 'Gesù scoppiò in pianto.' },
        { n: 43, t: 'Detto questo, gridò a gran voce: «Lazzaro, vieni fuori!».' },
        { n: 44, t: 'Il morto uscì, i piedi e le mani legati con bende, e il viso avvolto da un sudario. Gesù disse loro: «Liberatelo e lasciatelo andare».' },
      ],
    },
    drill: [
      { q: 'Io sono il buon ___.', a: 'pastore', hint: 'shepherd (il pastore)' },
      { q: 'Gesù scoppiò in ___.', a: 'pianto', hint: 'piangere → il pianto (weeping)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Gesù guarì un uomo cieco dalla nascita.', en: 'Jesus healed a man blind from birth.', answer: true },
      { type: 'tf', it: 'Quando Lazzaro morì, Gesù rimase indifferente.', en: 'When Lazarus died, Jesus stayed indifferent.', answer: false, explain: 'Gesù scoppiò in pianto — Jesus wept.' },
    ],
  },
  6: {
    passage: {
      ref: 'Giovanni 14,1-3.6',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: '«Non sia turbato il vostro cuore. Abbiate fede in Dio e abbiate fede anche in me.' },
        { n: 2, t: 'Nella casa del Padre mio vi sono molte dimore. Se no, vi avrei mai detto: "Vado a prepararvi un posto"?' },
        { n: 3, t: 'Quando sarò andato e vi avrò preparato un posto, ritornerò e vi prenderò con me, perché siate anche voi dove sono io.' },
        { n: 6, t: 'Gli disse Gesù: «Io sono la via, la verità e la vita. Nessuno viene al Padre se non per mezzo di me.' },
      ],
    },
    drill: [
      { q: 'Io sono la ___, la verità e la vita.', a: 'via', hint: 'the way (la via)' },
      { q: 'Lavò i ___ ai discepoli.', a: 'piedi', hint: 'feet (i piedi) — note di/a + article' },
    ],
    comprehension: [
      { type: 'tf', it: 'Gesù lavò i piedi ai suoi discepoli.', en: 'Jesus washed his disciples\' feet.', answer: true },
      { type: 'mc', it: 'Gesù entrò a Gerusalemme seduto su…', en: 'Jesus entered Jerusalem seated on…', options: ['un cavallo', 'un asino', 'un carro'], answer: 1, explain: '"seduto su un asino" — on a donkey.' },
    ],
  },
  7: {
    passage: {
      ref: 'Giovanni 15,1.4-5.12-13',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: '«Io sono la vite vera e il Padre mio è l\'agricoltore.' },
        { n: 4, t: 'Rimanete in me e io in voi. Come il tralcio non può portare frutto da se stesso se non rimane nella vite, così neanche voi se non rimanete in me.' },
        { n: 5, t: 'Io sono la vite, voi i tralci. Chi rimane in me e io in lui, porta molto frutto, perché senza di me non potete far nulla.' },
        { n: 12, t: 'Questo è il mio comandamento: che vi amiate gli uni gli altri come io ho amato voi.' },
        { n: 13, t: 'Nessuno ha un amore più grande di questo: dare la sua vita per i propri amici.' },
      ],
    },
    drill: [
      { q: 'Io sono la ___ vera.', a: 'vite', hint: 'the vine (la vite)' },
      { q: '___ nel mio amore.', a: 'Rimanete', hint: 'rimanere → voi imperative (remain)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Gesù si paragona alla vite e i discepoli ai tralci.', en: 'Jesus compares himself to the vine and the disciples to the branches.', answer: true },
      { type: 'tf', it: 'Gesù disse che il mondo avrebbe amato i suoi discepoli.', en: 'Jesus said the world would love his disciples.', answer: false, explain: '"Il mondo vi odierà" — the world will hate you.' },
    ],
  },
  8: {
    passage: {
      ref: 'Giovanni 20,19-21.24-25.28',
      translation: 'CEI 2008',
      verses: [
        { n: 19, t: 'La sera di quel giorno, il primo della settimana, mentre erano chiuse le porte del luogo dove si trovavano i discepoli per timore dei Giudei, venne Gesù, stette in mezzo e disse loro: «Pace a voi!».' },
        { n: 20, t: 'Detto questo, mostrò loro le mani e il fianco. E i discepoli gioirono al vedere il Signore.' },
        { n: 21, t: 'Gesù disse loro di nuovo: «Pace a voi! Come il Padre ha mandato me, anche io mando voi».' },
        { n: 24, t: 'Tommaso, uno dei Dodici, chiamato Dìdimo, non era con loro quando venne Gesù.' },
        { n: 25, t: 'Gli dicevano gli altri discepoli: «Abbiamo visto il Signore!». Ma egli disse loro: «Se non vedo nelle sue mani il segno dei chiodi e non metto il mio dito nel segno dei chiodi e non metto la mia mano nel suo fianco, io non credo».' },
        { n: 28, t: 'Rispose Tommaso: «Mio Signore e mio Dio!».' },
      ],
    },
    drill: [
      { q: 'La ___ sia con voi.', a: 'pace', hint: 'peace (la pace)' },
      { q: 'Il sepolcro ___ vuoto.', a: 'era', hint: 'essere, imperfect — was' },
    ],
    comprehension: [
      { type: 'tf', it: 'Pietro rinnegò Gesù.', en: 'Peter denied Jesus.', answer: true },
      { type: 'tf', it: 'Le donne trovarono il sepolcro ancora chiuso e pieno.', en: 'The women found the tomb still closed and full.', answer: false, explain: 'Il sepolcro era vuoto — the tomb was empty.' },
    ],
  },
  // ── Phase 2: Luke ─────────────────────────────────────────────────────────
  9: {
    passage: {
      ref: 'Luca 2,8-14',
      translation: 'CEI 2008',
      verses: [
        { n: 8, t: 'C\'erano in quella regione alcuni pastori che, pernottando all\'aperto, vegliavano tutta la notte sul loro gregge.' },
        { n: 9, t: 'Un angelo del Signore si presentò a loro e la gloria del Signore li avvolse di luce. Essi furono presi da grande timore,' },
        { n: 10, t: 'ma l\'angelo disse loro: «Non temete: ecco, vi annuncio una grande gioia, che sarà di tutto il popolo:' },
        { n: 11, t: 'oggi, nella città di Davide, è nato per voi un Salvatore, che è Cristo Signore.' },
        { n: 12, t: 'Questo per voi il segno: troverete un bambino avvolto in fasce, adagiato in una mangiatoia».' },
        { n: 14, t: '«Gloria a Dio nel più alto dei cieli e sulla terra pace agli uomini, che egli ama».' },
      ],
    },
    drill: [
      { q: "L'angelo disse a Maria: «Non ___».", a: 'temere', hint: 'temere — infinitive after "non" (do not fear)' },
      { q: "L'anima mia ___ il Signore.", a: 'magnifica', hint: 'magnificare → present (the Magnificat)' },
    ],
    comprehension: [
      { type: 'tf', it: "L'angelo Gabriele annunciò a Maria la nascita di Gesù.", en: 'The angel Gabriel announced to Mary the birth of Jesus.', answer: true },
      { type: 'tf', it: 'Gesù nacque in un palazzo a Gerusalemme.', en: 'Jesus was born in a palace in Jerusalem.', answer: false, explain: '"Lo depose nella mangiatoia" a Betlemme — in a manger in Bethlehem.' },
    ],
  },
  10: {
    passage: {
      ref: 'Luca 4,1-4.18-19',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'Gesù, pieno di Spirito Santo, si allontanò dal Giordano e fu condotto dallo Spirito nel deserto' },
        { n: 2, t: 'per quaranta giorni, tentato dal diavolo. Non mangiò nulla in quei giorni, poi quando furono terminati, ebbe fame.' },
        { n: 3, t: 'Il diavolo gli disse: «Se tu sei Figlio di Dio, di\' a questa pietra che diventi pane».' },
        { n: 4, t: 'Gesù gli rispose: «Sta scritto: "Non di solo pane vivrà l\'uomo"».' },
        { n: 18, t: '«Lo Spirito del Signore è sopra di me; per questo mi ha consacrato con l\'unzione e mi ha mandato a portare ai poveri il lieto annuncio, a proclamare ai prigionieri la liberazione e ai ciechi la vista, a rimettere in libertà gli oppressi,' },
        { n: 19, t: 'a proclamare l\'anno di grazia del Signore».' },
      ],
    },
    drill: [
      { q: 'Gesù è ___ tentato nel deserto.', a: 'stato', hint: 'essere + participle — passive/past "was tempted"' },
      { q: 'Alzati e ___.', a: 'cammina', hint: 'camminare → tu imperative (walk)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Gesù fu tentato nel deserto per quaranta giorni.', en: 'Jesus was tempted in the desert for forty days.', answer: true },
      { type: 'mc', it: 'Sul lago Gesù disse ai pescatori di…', en: 'At the lake Jesus told the fishermen to…', options: ['riparare le barche', 'gettare le reti', 'tornare a casa'], answer: 1, explain: '"Gettate le reti" — cast the nets.' },
    ],
  },
  11: {
    passage: {
      ref: 'Luca 6,20-23.27-28',
      translation: 'CEI 2008',
      verses: [
        { n: 20, t: 'Alzando gli occhi verso i suoi discepoli, Gesù diceva: «Beati voi, poveri, perché vostro è il regno di Dio.' },
        { n: 21, t: 'Beati voi, che ora avete fame, perché sarete saziati. Beati voi, che ora piangete, perché riderete.' },
        { n: 22, t: 'Beati voi, quando gli uomini vi odieranno e quando vi metteranno al bando e vi insulteranno e disprezzeranno il vostro nome come infame, a causa del Figlio dell\'uomo.' },
        { n: 23, t: 'Rallegratevi in quel giorno ed esultate perché la vostra ricompensa è grande nel cielo.' },
        { n: 27, t: 'Ma a voi che ascoltate, io dico: amate i vostri nemici, fate del bene a quelli che vi odiano,' },
        { n: 28, t: 'benedite coloro che vi maledicono, pregate per coloro che vi maltrattano.' },
      ],
    },
    drill: [
      { q: 'Amate i vostri ___.', a: 'nemici', hint: 'enemies (i nemici) — love your enemies' },
      { q: 'Gesù ___ sulla montagna.', a: 'insegnava', hint: 'imperfetto — ongoing past (was teaching)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Gesù disse: «Beati voi poveri».', en: 'Jesus said: "Blessed are you who are poor."', answer: true },
      { type: 'tf', it: 'Gesù insegnò a odiare i nemici.', en: 'Jesus taught to hate one\'s enemies.', answer: false, explain: '"Amate i vostri nemici" — love your enemies.' },
    ],
  },
  12: {
    passage: {
      ref: 'Luca 9,18-22',
      translation: 'CEI 2008',
      verses: [
        { n: 18, t: 'Un giorno Gesù si trovava in un luogo solitario a pregare. I discepoli erano con lui ed egli pose loro questa domanda: «Le folle, chi dicono che io sia?».' },
        { n: 19, t: 'Essi risposero: «Giovanni il Battista; altri dicono Elìa; altri ancora che un antico profeta è risorto».' },
        { n: 20, t: 'Allora li interrogò: «Ma voi, chi dite che io sia?». Pietro rispose: «Il Cristo di Dio».' },
        { n: 21, t: 'Egli ordinò loro severamente di non riferirlo ad alcuno.' },
        { n: 22, t: '«Il Figlio dell\'uomo», disse, «deve soffrire molto, essere rifiutato dagli anziani, dai capi dei sacerdoti e dagli scribi, venire ucciso e risorgere il terzo giorno».' },
      ],
    },
    drill: [
      { q: 'Gesù ___ la tempesta.', a: 'calmò', hint: 'calmare → passato remoto (calmed)' },
      { q: 'La tua fede ti ___ salvata.', a: 'ha', hint: 'avere — passato prossimo "has saved you"' },
    ],
    comprehension: [
      { type: 'tf', it: 'Gesù calmò la tempesta sul lago.', en: 'Jesus calmed the storm on the lake.', answer: true },
      { type: 'tf', it: 'I discepoli non ebbero mai paura durante la tempesta.', en: 'The disciples were never afraid during the storm.', answer: false, explain: 'Avevano paura — they were afraid.' },
    ],
  },
  13: {
    passage: {
      ref: 'Luca 10,25-28.36-37',
      translation: 'CEI 2008',
      verses: [
        { n: 25, t: 'Ed ecco, un dottore della Legge si alzò per metterlo alla prova e chiese: «Maestro, che cosa devo fare per ereditare la vita eterna?».' },
        { n: 26, t: 'Gesù gli disse: «Che cosa sta scritto nella Legge? Come leggi?».' },
        { n: 27, t: 'Costui rispose: «Amerai il Signore tuo Dio con tutto il tuo cuore, con tutta la tua anima, con tutta la tua forza e con tutta la tua mente, e il tuo prossimo come te stesso».' },
        { n: 28, t: 'Gli disse: «Hai risposto bene; fa\' questo e vivrai».' },
        { n: 36, t: '«Chi di questi tre ti sembra sia stato il prossimo di colui che è caduto nelle mani dei briganti?».' },
        { n: 37, t: 'Quello rispose: «Chi ha avuto compassione di lui». Gesù gli disse: «Va\' e anche tu fa\' così».' },
      ],
    },
    drill: [
      { q: '___ e vi sarà dato.', a: 'Chiedete', hint: 'chiedere → voi imperative (ask)' },
      { q: 'Versò ___ e vino sulle ferite.', a: 'olio', hint: "l'olio (oil) — the Good Samaritan" },
    ],
    comprehension: [
      { type: 'tf', it: 'Il buon samaritano si fermò ad aiutare il ferito.', en: 'The Good Samaritan stopped to help the wounded man.', answer: true },
      { type: 'mc', it: 'I discepoli chiesero a Gesù di insegnare loro a…', en: 'The disciples asked Jesus to teach them to…', options: ['pregare', 'guarire', 'digiunare'], answer: 0, explain: '"Insegnateci a pregare" — teach us to pray.' },
    ],
  },
  14: {
    passage: {
      ref: 'Luca 12,22-25.31',
      translation: 'CEI 2008',
      verses: [
        { n: 22, t: 'Poi disse ai discepoli: «Per questo io vi dico: non preoccupatevi per la vita, di quello che mangerete; né per il corpo, di quello che indosserete.' },
        { n: 23, t: 'La vita vale più del cibo e il corpo vale più del vestito.' },
        { n: 24, t: 'Considerate i corvi: non seminano e non mietono, non hanno magazzino né granaio, eppure Dio li nutre. Quanto più valete voi degli uccelli!' },
        { n: 25, t: 'Chi di voi, per quanto si preoccupi, può aggiungere un\'ora sola alla sua vita?' },
        { n: 31, t: 'Cercate piuttosto il suo regno, e queste cose vi saranno date in aggiunta.' },
      ],
    },
    drill: [
      { q: 'Non ___ per la vita.', a: 'preoccupatevi', hint: 'preoccuparsi → voi imperative (do not worry)' },
      { q: '___ granai più grandi.', a: 'Costruirò', hint: 'costruire → futuro (I will build)' },
    ],
    comprehension: [
      { type: 'tf', it: "L'uomo ricco volle costruire granai più grandi.", en: 'The rich man wanted to build bigger barns.', answer: true },
      { type: 'tf', it: 'Gesù disse di entrare per la porta larga.', en: 'Jesus said to enter through the wide gate.', answer: false, explain: '"Entrate per la porta stretta" — the narrow gate.' },
    ],
  },
  15: {
    passage: {
      ref: 'Luca 15,11-13.20.22-24',
      translation: 'CEI 2008',
      verses: [
        { n: 11, t: 'Gesù disse ancora: «Un uomo aveva due figli.' },
        { n: 12, t: 'Il più giovane di loro disse al padre: "Padre, dammi la parte di patrimonio che mi spetta". Ed egli divise tra loro le sue sostanze.' },
        { n: 13, t: 'Pochi giorni dopo, il figlio più giovane, raccolte tutte le sue cose, partì per un paese lontano e là sperperò il suo patrimonio vivendo in modo dissoluto.' },
        { n: 20, t: 'Si alzò e tornò da suo padre. Quando era ancora lontano, suo padre lo vide, ebbe compassione, gli corse incontro, gli si gettò al collo e lo baciò.' },
        { n: 22, t: 'Il padre disse ai servi: "Presto, portate qui il vestito più bello e fateglielo indossare, mettetegli l\'anello al dito e i sandali ai piedi.' },
        { n: 23, t: 'Prendete il vitello grasso, ammazzatelo, mangiamo e facciamo festa,' },
        { n: 24, t: 'perché questo mio figlio era morto ed è tornato in vita, era perduto ed è stato ritrovato". E cominciarono a far festa.' },
      ],
    },
    drill: [
      { q: 'Il padre lo ___ e lo baciò.', a: 'abbracciò', hint: 'abbracciare → passato remoto (embraced)' },
      { q: '___ festa!', a: 'Facciamo', hint: 'fare → noi (let\'s celebrate)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Il padre corse incontro al figlio prodigo e lo abbracciò.', en: 'The father ran to meet the prodigal son and embraced him.', answer: true },
      { type: 'tf', it: 'Il padre rifiutò di accogliere il figlio tornato a casa.', en: 'The father refused to welcome the returning son.', answer: false, explain: 'Gli corse incontro e fece festa — he ran to him and celebrated.' },
    ],
  },
  16: {
    passage: {
      ref: 'Luca 18,10-14',
      translation: 'CEI 2008',
      verses: [
        { n: 10, t: '«Due uomini salirono al tempio a pregare: uno era fariseo e l\'altro pubblicano.' },
        { n: 11, t: 'Il fariseo, stando in piedi, pregava così tra sé: "O Dio, ti rendo grazie perché non sono come gli altri uomini, ladri, ingiusti, adùlteri, e neppure come questo pubblicano.' },
        { n: 12, t: 'Digiuno due volte alla settimana e pago le decime di tutto quello che possiedo".' },
        { n: 13, t: 'Il pubblicano invece, fermatosi a distanza, non osava nemmeno alzare gli occhi al cielo, ma si batteva il petto dicendo: "O Dio, abbi pietà di me peccatore".' },
        { n: 14, t: 'Io vi dico: questi, a differenza dell\'altro, tornò a casa sua giustificato, perché chiunque si esalta sarà umiliato, chi invece si umilia sarà esaltato».' },
      ],
    },
    drill: [
      { q: 'Chi si umilia ___ esaltato.', a: 'sarà', hint: 'essere → futuro (will be)' },
      { q: 'Lasciate che i ___ vengano a me.', a: 'bambini', hint: 'children (i bambini)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Il pubblicano pregò: «Dio, abbi pietà di me peccatore».', en: 'The tax collector prayed: "God, have mercy on me a sinner."', answer: true },
      { type: 'mc', it: 'Chi tornò a casa giustificato?', en: 'Who went home justified?', options: ['il fariseo', 'il pubblicano', 'nessuno dei due'], answer: 1, explain: 'Il pubblicano, perché si umiliò.' },
    ],
  },
  17: {
    passage: {
      ref: 'Luca 19,1-5.9-10',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'Entrato in Gerico, attraversava la città.' },
        { n: 2, t: 'Ed ecco un uomo di nome Zaccheo, capo dei pubblicani e ricco,' },
        { n: 3, t: 'cercava di vedere chi fosse Gesù, ma non gli riusciva a causa della folla, perché era piccolo di statura.' },
        { n: 4, t: 'Allora corse avanti e, per poterlo vedere, salì su un sicomoro, perché doveva passare di là.' },
        { n: 5, t: 'Quando giunse sul luogo, Gesù alzò lo sguardo e gli disse: «Zaccheo, scendi subito, perché oggi devo fermarmi a casa tua».' },
        { n: 9, t: 'Gesù gli disse: «Oggi la salvezza è entrata in questa casa, perché anch\'egli è figlio di Abramo;' },
        { n: 10, t: 'il Figlio dell\'uomo infatti è venuto a cercare e a salvare ciò che era perduto».' },
      ],
    },
    drill: [
      { q: 'Oggi la ___ è entrata in questa casa.', a: 'salvezza', hint: 'salvation (la salvezza)' },
      { q: '___ e pregate.', a: 'Vigilate', hint: 'vigilare → voi imperative (watch)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Zaccheo era un pubblicano ricco.', en: 'Zacchaeus was a rich tax collector.', answer: true },
      { type: 'tf', it: 'Zaccheo salì su un albero per vedere Gesù.', en: 'Zacchaeus climbed a tree to see Jesus.', answer: true },
    ],
  },
  18: {
    passage: {
      ref: 'Luca 24,1-6.34',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'Il primo giorno della settimana, al mattino presto, si recarono al sepolcro portando con sé gli aromi che avevano preparato.' },
        { n: 2, t: 'Trovarono la pietra rotolata via dal sepolcro;' },
        { n: 3, t: 'ma, entrate, non trovarono il corpo del Signore Gesù.' },
        { n: 4, t: 'Mentre erano ancora incerte, ecco due uomini apparire vicino a loro in abiti sfolgoranti.' },
        { n: 5, t: 'Le donne, impaurite, tenevano il viso chinato a terra, ed essi dissero loro: «Perché cercate tra i morti colui che è vivo?' },
        { n: 6, t: 'Non è qui, è risorto. Ricordatevi come vi parlò quando era ancora in Galilea».' },
        { n: 34, t: '«Davvero il Signore è risorto ed è apparso a Simone!».' },
      ],
    },
    drill: [
      { q: 'Questo calice è la nuova ___.', a: 'alleanza', hint: 'covenant (l\'alleanza)' },
      { q: 'I discepoli ___ tristi verso Emmaus.', a: 'camminavano', hint: 'imperfetto — were walking' },
    ],
    comprehension: [
      { type: 'tf', it: 'Giuda tradì Gesù.', en: 'Judas betrayed Jesus.', answer: true },
      { type: 'tf', it: 'I discepoli di Emmaus riconobbero subito Gesù.', en: 'The Emmaus disciples recognized Jesus immediately.', answer: false, explain: '"Non lo riconobbero" — they did not recognize him at first.' },
    ],
  },
  // ── Phase 3: Acts ─────────────────────────────────────────────────────────
  19: {
    passage: {
      ref: 'Atti 2,1-4.37-38',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'Quando venne il giorno di Pentecoste, si trovavano tutti insieme nello stesso luogo.' },
        { n: 2, t: 'Venne all\'improvviso dal cielo un fragore, quasi un vento che si abbatte impetuoso, e riempì tutta la casa dove stavano.' },
        { n: 3, t: 'Apparvero loro lingue come di fuoco, che si dividevano, e si posarono su ciascuno di loro,' },
        { n: 4, t: 'e tutti furono colmati di Spirito Santo e cominciarono a parlare in altre lingue, nel modo in cui lo Spirito dava loro il potere di esprimersi.' },
        { n: 37, t: 'All\'udire questo, si sentirono trafiggere il cuore e dissero a Pietro e agli altri apostoli: «Che cosa dobbiamo fare, fratelli?».' },
        { n: 38, t: 'Pietro disse loro: «Convertitevi e ciascuno di voi si faccia battezzare nel nome di Gesù Cristo, per il perdono dei vostri peccati, e riceverete il dono dello Spirito Santo.' },
      ],
    },
    drill: [
      { q: 'Furono tutti pieni di Spirito ___.', a: 'Santo', hint: 'agrees with Spirito — masculine singular' },
      { q: '___ e ognuno di voi sia battezzato.', a: 'Pentitevi', hint: 'pentirsi → voi imperative (repent)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Nel giorno di Pentecoste apparvero lingue come di fuoco.', en: 'On Pentecost tongues like fire appeared.', answer: true },
      { type: 'tf', it: 'Pietro rimase in silenzio davanti alla folla.', en: 'Peter stayed silent before the crowd.', answer: false, explain: 'Pietro si alzò e parlò alla folla — Peter stood and spoke.' },
    ],
  },
  20: {
    passage: {
      ref: 'Atti 4,11-12.31-33',
      translation: 'CEI 2008',
      verses: [
        { n: 11, t: 'È lui "la pietra che, scartata da voi costruttori, è diventata la pietra d\'angolo".' },
        { n: 12, t: 'In nessun altro c\'è salvezza; non vi è infatti, sotto il cielo, altro nome dato agli uomini nel quale è stabilito che noi siamo salvati».' },
        { n: 31, t: 'Mentre pregavano, il luogo in cui erano riuniti tremò e tutti furono colmati di Spirito Santo e annunciavano la parola di Dio con franchezza.' },
        { n: 32, t: 'La moltitudine di coloro che erano diventati credenti aveva un cuore solo e un\'anima sola e nessuno considerava sua proprietà quello che gli apparteneva, ma fra loro tutto era comune.' },
        { n: 33, t: 'Con grande forza gli apostoli davano testimonianza della risurrezione del Signore Gesù, e tutti godevano di grande favore.' },
      ],
    },
    drill: [
      { q: 'Hai ___ allo Spirito Santo.', a: 'mentito', hint: 'mentire → past participle (lied)' },
      { q: 'Scoppiò una grande ___.', a: 'persecuzione', hint: 'persecution (la persecuzione)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Anania e Saffira mentirono allo Spirito Santo.', en: 'Ananias and Sapphira lied to the Holy Spirit.', answer: true },
      { type: 'mc', it: 'La comunità scelse sette uomini come…', en: 'The community chose seven men as…', options: ['apostoli', 'diaconi', 'profeti'], answer: 1, explain: 'I diaconi — the deacons.' },
    ],
  },
  21: {
    passage: {
      ref: 'Atti 9,1-6.17-18',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'Saulo frattanto, sempre fremente minaccia e strage contro i discepoli del Signore, si presentò al sommo sacerdote' },
        { n: 2, t: 'e gli chiese lettere per le sinagoghe di Damasco, al fine di condurre in catene a Gerusalemme uomini e donne che seguivano questa Via, qualora ne avesse trovati.' },
        { n: 3, t: 'E mentre era in viaggio e stava per avvicinarsi a Damasco, all\'improvviso lo avvolse una luce dal cielo' },
        { n: 4, t: 'e cadde a terra e udì una voce che gli diceva: «Saulo, Saulo, perché mi perseguiti?».' },
        { n: 5, t: 'Rispose: «Chi sei, o Signore?». Ed egli: «Sono Gesù, che tu perseguiti.' },
        { n: 6, t: 'Ma àlzati ed entra nella città e ti sarà detto ciò che devi fare».' },
        { n: 17, t: 'Allora Ananìa andò, entrò nella casa, gli impose le mani e disse: «Saulo, fratello mio, mi ha mandato a te il Signore Gesù, che ti è apparso sulla strada che percorrevi, perché tu riacquisti la vista e sia colmato di Spirito Santo».' },
        { n: 18, t: 'E improvvisamente gli caddero dagli occhi come delle squame e riacquistò la vista; si alzò e fu battezzato.' },
      ],
    },
    drill: [
      { q: 'Saulo, Saulo, perché mi ___?', a: 'perseguiti', hint: 'perseguitare → tu present (persecute)' },
      { q: 'Per tre giorni non ___ nulla.', a: 'vide', hint: 'vedere → passato remoto (he saw)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Stefano fu lapidato.', en: 'Stephen was stoned.', answer: true },
      { type: 'tf', it: 'Saulo si convertì sulla via di Damasco.', en: 'Saul was converted on the road to Damascus.', answer: true },
    ],
  },
  22: {
    passage: {
      ref: 'Atti 10,34-36.44-45',
      translation: 'CEI 2008',
      verses: [
        { n: 34, t: 'Allora Pietro prese la parola e disse: «In verità sto rendendomi conto che Dio non fa preferenza di persone,' },
        { n: 35, t: 'ma accoglie chi lo teme e pratica la giustizia, a qualunque nazione appartenga.' },
        { n: 36, t: 'Questa è la parola che egli ha inviato ai figli d\'Israele, annunciando la pace per mezzo di Gesù Cristo: questi è il Signore di tutti.' },
        { n: 44, t: 'Pietro stava ancora dicendo queste cose, quando lo Spirito Santo scese su tutti coloro che ascoltavano la parola.' },
        { n: 45, t: 'E i fedeli circoncisi che erano venuti con Pietro furono meravigliati che anche sui pagani si fosse effuso il dono dello Spirito Santo.' },
      ],
    },
    drill: [
      { q: 'Mentre Pietro ___ dormendo, apparve un angelo.', a: 'stava', hint: 'stare + gerundio — was sleeping' },
      { q: 'Il vangelo anche ai ___.', a: 'pagani', hint: 'the Gentiles (i pagani)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Pietro ebbe una visione prima di incontrare Cornelio.', en: 'Peter had a vision before meeting Cornelius.', answer: true },
      { type: 'tf', it: 'Un angelo liberò Pietro dal carcere.', en: 'An angel freed Peter from prison.', answer: true },
    ],
  },
  23: {
    passage: {
      ref: 'Atti 13,38-39.46-47',
      translation: 'CEI 2008',
      verses: [
        { n: 38, t: 'Sia dunque noto a voi, fratelli, che per mezzo di lui vi è annunciata la remissione dei peccati e che, per quanto riguarda tutte le cose di cui non potevate essere giustificati dalla legge di Mosè,' },
        { n: 39, t: 'in lui è giustificato chiunque crede.' },
        { n: 46, t: 'Paolo e Barnaba con franchezza dichiararono: «Era necessario che fosse annunciata prima di tutto a voi la parola di Dio, ma poiché la respingete e non vi giudicate degni della vita eterna, ecco: noi ci rivolgiamo ai pagani.' },
        { n: 47, t: 'Così infatti ci ha comandato il Signore: "Io ti ho posto come luce per le genti, perché tu porti la salvezza sino all\'estremità della terra"».' },
      ],
    },
    drill: [
      { q: 'Annunciarono la ___ di Dio.', a: 'parola', hint: 'the word (la parola)' },
      { q: 'Il concilio di ___.', a: 'Gerusalemme', hint: 'Jerusalem — the council location' },
    ],
    comprehension: [
      { type: 'tf', it: 'Barnaba e Paolo partirono per un viaggio missionario.', en: 'Barnabas and Paul set out on a missionary journey.', answer: true },
      { type: 'mc', it: 'Il concilio di Gerusalemme discusse la questione…', en: 'The Jerusalem council discussed the question of…', options: ['della circoncisione', 'del battesimo', 'del digiuno'], answer: 0, explain: 'La circoncisione dei pagani — circumcision of the Gentiles.' },
    ],
  },
  24: {
    passage: {
      ref: 'Atti 16,25-30.34',
      translation: 'CEI 2008',
      verses: [
        { n: 25, t: 'Verso mezzanotte Paolo e Sila stavano pregando e cantando inni a Dio, mentre i prigionieri li ascoltavano.' },
        { n: 26, t: 'Improvvisamente si verificò un terremoto così forte che furono scosse le fondamenta della prigione; in un istante tutte le porte si aprirono e le catene di tutti si sciolsero.' },
        { n: 27, t: 'Il carceriere si svegliò e, vedendo aperte le porte della prigione, tirò fuori la spada e stava per uccidersi, pensando che i prigionieri fossero fuggiti.' },
        { n: 28, t: 'Ma Paolo gridò a gran voce: «Non farti del male, siamo tutti qui!».' },
        { n: 29, t: 'Il carceriere allora chiese la luce, si precipitò dentro e, tremante, si gettò ai piedi di Paolo e di Sila;' },
        { n: 30, t: 'poi li condusse fuori e disse: «Signori, che cosa devo fare per essere salvato?».' },
        { n: 34, t: 'Li condusse a casa sua, apparecchiò la mensa e fu pieno di gioia con tutta la sua famiglia, per aver creduto in Dio.' },
      ],
    },
    drill: [
      { q: 'Paolo si alzò in mezzo ___ Areopago.', a: "all'", hint: 'a + l\' (preposizione articolata)' },
      { q: 'Giunsero a ___.', a: 'Corinto', hint: 'Corinth' },
    ],
    comprehension: [
      { type: 'tf', it: 'Lidia aprì il cuore al messaggio di Paolo.', en: "Lydia opened her heart to Paul's message.", answer: true },
      { type: 'tf', it: "Paolo parlò all'Areopago di Atene.", en: 'Paul spoke at the Areopagus in Athens.', answer: true },
    ],
  },
  25: {
    passage: {
      ref: 'Atti 20,24.28.35',
      translation: 'CEI 2008',
      verses: [
        { n: 24, t: 'Ma non ritengo la mia vita meritevole di nulla, purché conduca a termine la mia corsa e il ministero che ho ricevuto dal Signore Gesù: rendere testimonianza al vangelo della grazia di Dio.' },
        { n: 28, t: 'Vegliate su voi stessi e su tutto il gregge, in mezzo al quale lo Spirito Santo vi ha posti come vescovi a pascere la Chiesa di Dio, che egli ha acquistato con il suo sangue.' },
        { n: 35, t: 'In tutte le maniere vi ho dimostrato che lavorando così si deve soccorrere i deboli, ricordandosi delle parole del Signore Gesù, che disse: "Vi è più gioia nel dare che nel ricevere".' },
      ],
    },
    drill: [
      { q: 'Bruciarono i libri di ___.', a: 'magia', hint: 'magic (la magia)' },
      { q: 'Non ho cercato né argento né ___.', a: 'oro', hint: 'gold (l\'oro) — né… né (neither… nor)' },
    ],
    comprehension: [
      { type: 'tf', it: 'A Efeso scoppiò un tumulto a causa degli artigiani.', en: 'In Ephesus a riot broke out because of the craftsmen.', answer: true },
      { type: 'tf', it: 'Paolo cercò argento e oro per sé.', en: 'Paul sought silver and gold for himself.', answer: false, explain: '"Non ho cercato né argento né oro" — he sought neither.' },
    ],
  },
  26: {
    passage: {
      ref: 'Atti 22,6-10.14-16',
      translation: 'CEI 2008',
      verses: [
        { n: 6, t: 'Mentre ero in cammino e mi avvicinavo a Damasco, verso mezzogiorno, all\'improvviso una grande luce dal cielo mi avvolse di splendore.' },
        { n: 7, t: 'Caddi a terra e udii una voce che mi diceva: "Saulo, Saulo, perché mi perseguiti?".' },
        { n: 8, t: 'Io risposi: "Chi sei, o Signore?". Mi disse: "Sono Gesù il Nazareno, che tu perseguiti".' },
        { n: 9, t: 'Quelli che erano con me videro la luce, ma non udirono la voce di colui che mi parlava.' },
        { n: 10, t: 'E io dissi: "Che cosa devo fare, Signore?". Il Signore mi disse: "Àlzati, va\' a Damasco e là ti sarà detto di tutto ciò che è stabilito che tu faccia".' },
        { n: 14, t: 'Egli disse: "Il Dio dei nostri padri ti ha predestinato perché tu conoscessi la sua volontà, vedessi il Giusto e udissi la sua voce.' },
        { n: 15, t: 'Sarai suo testimone davanti a tutti gli uomini di ciò che hai visto e udito.' },
        { n: 16, t: 'E ora perché esiti? Àlzati, fatti battezzare e lava via i tuoi peccati, invocando il suo nome".' },
      ],
    },
    drill: [
      { q: 'Sono ___ romano.', a: 'cittadino', hint: 'citizen (il cittadino)' },
      { q: 'Le ___ contro Paolo.', a: 'accuse', hint: 'accusations (le accuse, plural)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Paolo dichiarò di essere cittadino romano.', en: 'Paul declared he was a Roman citizen.', answer: true },
      { type: 'tf', it: 'Paolo fu processato davanti al governatore Felice.', en: 'Paul was tried before governor Felix.', answer: true },
    ],
  },
  27: {
    passage: {
      ref: 'Atti 26,12-15.17-18',
      translation: 'CEI 2008',
      verses: [
        { n: 12, t: '«Con questi poteri mi recai a Damasco con l\'autorizzazione e il mandato dei capi dei sacerdoti.' },
        { n: 13, t: 'E mentre ero in cammino, in pieno giorno, vidi, o re, una luce, più splendente del sole, che veniva dal cielo e avvolse me e i miei compagni di viaggio.' },
        { n: 14, t: 'Caduti tutti a terra, udii una voce che mi diceva in lingua ebraica: "Saulo, Saulo, perché mi perseguiti? È duro per te recalcitrare contro il pungolo".' },
        { n: 15, t: 'Io risposi: "Chi sei, Signore?". Il Signore disse: "Sono Gesù, che tu perseguiti.' },
        { n: 17, t: 'liberandoti dal popolo e dai pagani, verso i quali ora ti mando,' },
        { n: 18, t: 'per aprir loro gli occhi, perché si convertano dalle tenebre alla luce e dal potere di Satana a Dio, e ottengano il perdono dei peccati e l\'eredità in mezzo a coloro che sono stati santificati per la fede in me».' },
      ],
    },
    drill: [
      { q: 'Ho fatto ___ a Cesare.', a: 'appello', hint: "l'appello — I have appealed to Caesar" },
      { q: 'Una ___ dal cielo.', a: 'luce', hint: 'a light (la luce) — Paul\'s testimony' },
    ],
    comprehension: [
      { type: 'tf', it: 'Paolo si appellò a Cesare.', en: 'Paul appealed to Caesar.', answer: true },
      { type: 'mc', it: 'Davanti a chi Paolo rese la sua testimonianza?', en: 'Before whom did Paul give his testimony?', options: ['il re Agrippa', 'Pilato', 'il sommo sacerdote'], answer: 0, explain: 'Il re Agrippa e il governatore Festo.' },
    ],
  },
  28: {
    passage: {
      ref: 'Atti 28,23-24.28.30-31',
      translation: 'CEI 2008',
      verses: [
        { n: 23, t: 'Fissato un giorno, molti vennero da lui nel suo alloggio. Dal mattino fino alla sera egli espose loro il regno di Dio, testimoniando e cercando di convincerli riguardo a Gesù, in base alla legge di Mosè e ai Profeti.' },
        { n: 24, t: 'Gli uni si lasciarono convincere dalle sue parole, gli altri invece non credettero.' },
        { n: 28, t: 'Sia dunque noto a voi che questa salvezza di Dio viene inviata ai pagani ed essi la ascolteranno!».' },
        { n: 30, t: 'Rimase due anni interi nel suo alloggio in affitto, e accoglieva tutti quelli che venivano da lui,' },
        { n: 31, t: 'annunciando il regno di Dio e insegnando le cose riguardanti il Signore Gesù Cristo, con tutta franchezza e senza impedimento.' },
      ],
    },
    drill: [
      { q: 'Finalmente ___ a Roma.', a: 'arrivammo', hint: 'arrivare → passato remoto, noi (we arrived)' },
      { q: 'La nave si ___.', a: 'incagliò', hint: 'incagliarsi → ran aground (reflexive)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Paolo fece naufragio sull\'isola di Malta.', en: 'Paul was shipwrecked on the island of Malta.', answer: true },
      { type: 'tf', it: 'Paolo morì durante il naufragio.', en: 'Paul died during the shipwreck.', answer: false, explain: 'Tutti si salvarono; Paolo arrivò a Roma.' },
    ],
  },
  // ── Phase 4: Romans + Psalms ──────────────────────────────────────────────
  29: {
    passage: {
      ref: 'Romani 1,1-4.16-17',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'Paolo, servo di Cristo Gesù, apostolo per vocazione, scelto per il vangelo di Dio,' },
        { n: 2, t: 'che egli aveva promesso per mezzo dei suoi profeti nelle sacre Scritture,' },
        { n: 3, t: 'riguardo al Figlio suo — nato dalla stirpe di Davide secondo la carne,' },
        { n: 4, t: 'costituito Figlio di Dio con potenza secondo lo Spirito di santità in virtù della risurrezione dai morti, Gesù Cristo nostro Signore —' },
        { n: 16, t: 'Io infatti non mi vergogno del vangelo, perché è potenza di Dio per la salvezza di chiunque crede, del Giudeo prima e del Greco.' },
        { n: 17, t: 'In esso infatti si rivela la giustizia di Dio da fede a fede, come sta scritto: «Il giusto per fede vivrà».' },
      ],
    },
    drill: [
      { q: 'Il giusto per fede ___.', a: 'vivrà', hint: 'vivere → futuro (will live)' },
      { q: "Beato l'uomo che non ___ il consiglio degli empi.", a: 'segue', hint: 'seguire → present (follows)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Paolo scrive che il giusto vivrà per fede.', en: 'Paul writes that the righteous will live by faith.', answer: true },
      { type: 'tf', it: 'Il Salmo 1 paragona il giusto a un albero piantato.', en: 'Psalm 1 compares the righteous person to a planted tree.', answer: true },
    ],
  },
  30: {
    passage: {
      ref: 'Romani 3,23-26',
      translation: 'CEI 2008',
      verses: [
        { n: 23, t: 'tutti infatti hanno peccato e sono privi della gloria di Dio,' },
        { n: 24, t: 'ma sono giustificati gratuitamente per la sua grazia, in virtù della redenzione che è in Cristo Gesù.' },
        { n: 25, t: 'È lui che Dio ha stabilito come strumento di espiazione per mezzo della fede, nel suo sangue.' },
        { n: 26, t: 'Egli ha così manifestato la sua giustizia nel tempo presente, per essere lui giusto e per giustificare chi ha fede in Gesù.' },
      ],
    },
    drill: [
      { q: 'Giustificati per ___.', a: 'fede', hint: 'by faith (la fede)' },
      { q: 'Il Signore è il mio ___.', a: 'pastore', hint: 'shepherd (Psalm 23)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Secondo Paolo siamo giustificati per fede, non per le opere della legge.', en: 'According to Paul we are justified by faith, not by works of the law.', answer: true },
      { type: 'tf', it: 'Il Salmo 23 dice: «Il Signore è il mio pastore, non manco di nulla».', en: 'Psalm 23 says: "The Lord is my shepherd, I lack nothing."', answer: true },
    ],
  },
  31: {
    passage: {
      ref: 'Romani 5,1-5.8',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'Giustificati dunque per fede, noi siamo in pace con Dio per mezzo del Signore nostro Gesù Cristo.' },
        { n: 2, t: 'Per mezzo di lui abbiamo anche, mediante la fede, l\'accesso a questa grazia nella quale ci troviamo e ci vantiamo nella speranza della gloria di Dio.' },
        { n: 3, t: 'Non solo questo, ma ci vantiamo anche nelle tribolazioni, sapendo che la tribolazione produce pazienza,' },
        { n: 4, t: 'la pazienza una virtù provata e la virtù provata la speranza.' },
        { n: 5, t: 'La speranza poi non delude, perché l\'amore di Dio è stato riversato nei nostri cuori per mezzo dello Spirito Santo che ci è stato dato.' },
        { n: 8, t: 'Ma Dio dimostra il suo amore verso di noi perché, mentre eravamo ancora peccatori, Cristo è morto per noi.' },
      ],
    },
    drill: [
      { q: 'Abbiamo ___ con Dio.', a: 'pace', hint: 'peace (la pace)' },
      { q: 'La speranza non ___.', a: 'delude', hint: 'deludere → present (does not disappoint)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Paolo dice che la speranza non delude.', en: 'Paul says that hope does not disappoint.', answer: true },
      { type: 'tf', it: 'Il Salmo 46 chiama Dio nostro rifugio e forza.', en: 'Psalm 46 calls God our refuge and strength.', answer: true },
    ],
  },
  32: {
    passage: {
      ref: 'Romani 8,1-2.28.38-39',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'Non vi è dunque nessuna condanna per quelli che sono in Cristo Gesù.' },
        { n: 2, t: 'La legge dello Spirito, che dà vita in Cristo Gesù, ti ha liberato dalla legge del peccato e della morte.' },
        { n: 28, t: 'Noi sappiamo inoltre che tutto concorre al bene di coloro che amano Dio, che sono stati chiamati secondo il suo disegno.' },
        { n: 38, t: 'Io sono infatti persuaso che né morte né vita, né angeli né principati, né presente né avvenire,' },
        { n: 39, t: 'né potenze, né altezza né profondità, né alcun\'altra creatura potrà mai separarci dall\'amore di Dio, che è in Cristo Gesù, nostro Signore.' },
      ],
    },
    drill: [
      { q: 'Nessuna ___ per quelli che sono in Cristo.', a: 'condanna', hint: 'condemnation (la condanna)' },
      { q: 'Crea in me un ___ puro.', a: 'cuore', hint: 'heart (Psalm 51)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Paolo dice che non c\'è più condanna per chi è in Cristo.', en: 'Paul says there is no more condemnation for those in Christ.', answer: true },
      { type: 'tf', it: 'Il Salmo 51 chiede a Dio un cuore puro.', en: 'Psalm 51 asks God for a pure heart.', answer: true },
    ],
  },
  33: {
    passage: {
      ref: 'Romani 10,9-10.13-15',
      translation: 'CEI 2008',
      verses: [
        { n: 9, t: 'Perché se confesserai con la tua bocca che Gesù è il Signore e crederai con il tuo cuore che Dio lo ha risuscitato dai morti, sarai salvato.' },
        { n: 10, t: 'Con il cuore infatti si crede per ottenere la giustizia e con la bocca si fa la professione di fede per avere la salvezza.' },
        { n: 13, t: 'Chiunque invocherà il nome del Signore sarà salvato.' },
        { n: 14, t: 'Ora, come potranno invocarlo senza aver prima creduto in lui? Come potranno credere senza averne sentito parlare? Come potranno sentirne parlare senza uno che lo annunci?' },
        { n: 15, t: 'E come lo annunceranno senza essere prima inviati? Come sta scritto: «Come sono belli i piedi di coloro che recano un lieto annuncio di bene!».' },
      ],
    },
    drill: [
      { q: '___ con la tua bocca.', a: 'Confessa', hint: 'confessare → tu imperative (confess)' },
      { q: 'Chiunque ___ il nome del Signore sarà salvato.', a: 'invoca', hint: 'invocare → present (calls on)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Chiunque invoca il nome del Signore sarà salvato.', en: 'Whoever calls on the name of the Lord will be saved.', answer: true },
      { type: 'tf', it: 'Il Salmo 91 parla della protezione di Dio.', en: "Psalm 91 speaks of God's protection.", answer: true },
    ],
  },
  34: {
    passage: {
      ref: 'Romani 12,1-2.9-10',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'Vi esorto dunque, fratelli, per la misericordia di Dio, ad offrire i vostri corpi come sacrificio vivente, santo e gradito a Dio; è questo il vostro culto spirituale.' },
        { n: 2, t: 'Non conformatevi a questo mondo, ma lasciatevi trasformare rinnovando il vostro modo di pensare, per poter discernere la volontà di Dio, ciò che è buono, a lui gradito e perfetto.' },
        { n: 9, t: 'La carità non sia ipocrita: detestate il male, attaccatevi al bene.' },
        { n: 10, t: 'Amatevi gli uni gli altri con affetto fraterno, gareggiate nello stimarvi a vicenda.' },
      ],
    },
    drill: [
      { q: 'Non ___ a questo mondo.', a: 'conformatevi', hint: 'conformarsi → voi imperative (do not conform)' },
      { q: 'La tua Parola è una ___ per i miei passi.', a: 'lampada', hint: 'a lamp (Psalm 119)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Paolo esorta a trasformarsi rinnovando la mente.', en: 'Paul urges transformation by renewing the mind.', answer: true },
      { type: 'tf', it: 'Il Salmo 119 chiama la Parola di Dio una lampada per i passi.', en: "Psalm 119 calls God's Word a lamp for one's steps.", answer: true },
    ],
  },
  35: {
    passage: {
      ref: 'Romani 13,8-10',
      translation: 'CEI 2008',
      verses: [
        { n: 8, t: 'Non abbiate alcun debito con nessuno, se non quello di un amore vicendevole; perché chi ama l\'altro ha adempiuto la Legge.' },
        { n: 9, t: 'Infatti il precetto: Non commettere adulterio, non uccidere, non rubare, non desiderare e qualsiasi altro comandamento, si ricapitola in queste parole: Amerai il prossimo tuo come te stesso.' },
        { n: 10, t: 'La carità non fa alcun male al prossimo: pienezza della Legge è la carità.' },
      ],
    },
    drill: [
      { q: 'Amerai il ___ tuo.', a: 'prossimo', hint: 'your neighbor (il prossimo)' },
      { q: 'Il mio ___ viene dal Signore.', a: 'soccorso', hint: 'my help (Psalm 121)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Paolo riassume la legge nell\'amore del prossimo.', en: 'Paul sums up the law in love of neighbor.', answer: true },
      { type: 'tf', it: 'Il Salmo 121 dice che il custode di Israele non dorme.', en: "Psalm 121 says Israel's keeper does not sleep.", answer: true },
    ],
  },
  36: {
    passage: {
      ref: 'Romani 15,5-6.13',
      translation: 'CEI 2008',
      verses: [
        { n: 5, t: 'Il Dio della perseveranza e della consolazione vi conceda di avere gli uni verso gli altri gli stessi sentimenti ad imitazione di Cristo Gesù,' },
        { n: 6, t: 'perché con un solo animo e una voce sola rendiate gloria a Dio, Padre del Signore nostro Gesù Cristo.' },
        { n: 13, t: 'Il Dio della speranza vi riempia di ogni gioia e pace nella fede, perché abbondiate nella speranza per la virtù dello Spirito Santo.' },
      ],
    },
    drill: [
      { q: 'Il Dio della ___.', a: 'speranza', hint: 'of hope (la speranza)' },
      { q: 'Signore, tu mi ___.', a: 'conosci', hint: 'conoscere → tu present (you know me — Psalm 139)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Il Salmo 139 dice che Dio ci conosce completamente.', en: 'Psalm 139 says God knows us completely.', answer: true },
      { type: 'tf', it: 'Paolo termina la lettera ai Romani senza alcun saluto.', en: 'Paul ends Romans with no greetings.', answer: false, explain: 'Romani 16 è pieno di saluti finali.' },
    ],
  },
  37: {
    passage: {
      ref: 'Salmo 150,1-6',
      translation: 'CEI 2008',
      verses: [
        { n: 1, t: 'Alleluia. Lodate Dio nel suo santuario, lodatelo nel firmamento della sua potenza.' },
        { n: 2, t: 'Lodatelo per le sue opere potenti, lodatelo per la sua grandezza immensa.' },
        { n: 3, t: 'Lodatelo con il suono della tromba, lodatelo con arpa e cetra.' },
        { n: 4, t: 'Lodatelo con timpani e danze, lodatelo con corde e flauto.' },
        { n: 5, t: 'Lodatelo con cimbali sonori, lodatelo con cimbali squillanti.' },
        { n: 6, t: 'Ogni essere che respira lodi il Signore. Alleluia.' },
      ],
    },
    drill: [
      { q: '___ il Signore.', a: 'Lodate', hint: 'lodare → voi imperative (praise — Psalm 150)' },
      { q: 'Tutto ciò che respira ___ il Signore.', a: 'lodi', hint: 'lodare → subjunctive/imperative wish (let it praise)' },
    ],
    comprehension: [
      { type: 'tf', it: 'Il Salmo 150 è un salmo di lode a Dio.', en: 'Psalm 150 is a psalm of praise to God.', answer: true },
      { type: 'tf', it: 'Hai completato 37 settimane di lettura della Bibbia in italiano.', en: 'You have completed 37 weeks of reading the Bible in Italian.', answer: true },
    ],
  },
};

// ── Speaking layer (plan-speaking.md P3) ──────────────────────────────────────
// phrases / transform / questions per week, anchored to each week's vetted
// passage and example sentences so the Italian is correct. Merged onto
// BASE_EXERCISES below.
const SPEAKING = {
  1: {
    phrases: [
      { it: 'in principio', en: 'in the beginning' },
      { it: 'il Verbo si fece carne', en: 'the Word became flesh', lit: 'the Word made itself flesh' },
      { it: 'per mezzo di lui', en: 'through him', lit: 'by means of him' },
    ],
    transform: [
      { instruction: 'Metti al plurale', base: 'La luce splende.', answer: 'Le luci splendono.' },
      { instruction: 'Rendi negativa', base: 'Le tenebre hanno vinto la luce.', answer: 'Le tenebre non hanno vinto la luce.' },
    ],
    questions: [
      { q: 'Che cosa era in principio?', answers: ['il Verbo', 'il verbo'], model: 'In principio era il Verbo.' },
      { q: 'Che cosa si fece il Verbo?', answers: ['carne', 'si fece carne'], model: 'Il Verbo si fece carne.' },
    ],
  },
  2: {
    phrases: [
      { it: 'in verità, in verità ti dico', en: 'truly, truly I say to you' },
      { it: 'di nuovo', en: 'again', lit: 'of new' },
      { it: "dall'alto", en: 'from above' },
    ],
    transform: [
      { instruction: 'Rendi negativa', base: 'Chi crede in lui ha la vita eterna.', answer: 'Chi crede in lui non ha la vita eterna.' },
      { instruction: 'Metti al futuro', base: 'Dio ama il mondo.', answer: 'Dio amerà il mondo.' },
    ],
    questions: [
      { q: 'Che cosa soffia dove vuole?', answers: ['lo Spirito', 'lo spirito', 'il vento'], model: 'Lo Spirito soffia dove vuole.' },
      { q: 'Chi ha tanto amato il mondo?', answers: ['Dio'], model: 'Dio ha tanto amato il mondo.' },
    ],
  },
  3: {
    phrases: [
      { it: 'il pane della vita', en: 'the bread of life' },
      { it: 'non... più', en: 'no longer', lit: 'not... more' },
    ],
    transform: [
      { instruction: 'Metti al plurale', base: 'Il padre ha mangiato la manna.', answer: 'I padri hanno mangiato la manna.' },
      { instruction: 'Metti al futuro', base: 'Chi viene a me non ha fame.', answer: 'Chi viene a me non avrà fame.' },
    ],
    questions: [
      { q: 'Chi è il pane della vita?', answers: ['Gesù', 'io'], model: 'Gesù è il pane della vita.' },
      { q: 'Dove mangiarono la manna i padri?', answers: ['nel deserto', 'il deserto', 'deserto'], model: 'I padri mangiarono la manna nel deserto.' },
    ],
  },
  4: {
    phrases: [
      { it: 'la luce del mondo', en: 'the light of the world' },
      { it: 'davvero', en: 'truly, really' },
    ],
    transform: [
      { instruction: 'Rendi negativa', base: 'Chi segue me camminerà nelle tenebre.', answer: 'Chi segue me non camminerà nelle tenebre.' },
      { instruction: 'Metti al plurale', base: 'Il discepolo conosce la verità.', answer: 'I discepoli conoscono la verità.' },
    ],
    questions: [
      { q: 'Che cosa vi farà liberi?', answers: ['la verità', 'la verita', 'verità'], model: 'La verità vi farà liberi.' },
      { q: 'Chi è la luce del mondo?', answers: ['Gesù', 'io'], model: 'Io sono la luce del mondo.' },
    ],
  },
  5: {
    phrases: [
      { it: 'vieni fuori', en: 'come out' },
      { it: 'anche se', en: 'even if' },
      { it: 'a gran voce', en: 'in a loud voice' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'Gesù piange.', answer: 'Gesù ha pianto.' },
      { instruction: 'Rendi negativa', base: 'Chi crede in me morirà in eterno.', answer: 'Chi crede in me non morirà in eterno.' },
    ],
    questions: [
      { q: 'Chi chiamò Gesù dal sepolcro?', answers: ['Lazzaro'], model: 'Gesù chiamò Lazzaro: «Vieni fuori!».' },
      { q: 'Chi è la risurrezione e la vita?', answers: ['Gesù', 'io'], model: 'Io sono la risurrezione e la vita.' },
    ],
  },
  6: {
    phrases: [
      { it: 'la via, la verità e la vita', en: 'the way, the truth and the life' },
      { it: 'per mezzo di me', en: 'through me', lit: 'by means of me' },
      { it: 'abbiate fede', en: 'have faith' },
    ],
    transform: [
      { instruction: 'Metti al plurale', base: 'Il discepolo va al Padre.', answer: 'I discepoli vanno al Padre.' },
      { instruction: 'Metti al passato prossimo', base: 'Gesù lava i piedi ai discepoli.', answer: 'Gesù ha lavato i piedi ai discepoli.' },
    ],
    questions: [
      { q: 'Chi è la via, la verità e la vita?', answers: ['Gesù', 'io'], model: 'Io sono la via, la verità e la vita.' },
      { q: 'Come si viene al Padre?', answers: ['per mezzo di Gesù', 'per mezzo di me', 'per mezzo di lui'], model: 'Nessuno viene al Padre se non per mezzo di me.' },
    ],
  },
  7: {
    phrases: [
      { it: 'la vite vera', en: 'the true vine' },
      { it: 'gli uni gli altri', en: 'one another' },
      { it: 'senza di me', en: 'without me' },
    ],
    transform: [
      { instruction: 'Rendi negativa', base: 'Il tralcio può portare frutto da se stesso.', answer: 'Il tralcio non può portare frutto da se stesso.' },
      { instruction: 'Metti al plurale', base: 'Il tralcio rimane nella vite.', answer: 'I tralci rimangono nella vite.' },
    ],
    questions: [
      { q: 'Chi è la vite vera?', answers: ['Gesù', 'io'], model: 'Io sono la vite vera.' },
      { q: 'Che cosa non potete fare senza Gesù?', answers: ['nulla', 'niente'], model: 'Senza di me non potete far nulla.' },
    ],
  },
  8: {
    phrases: [
      { it: 'Pace a voi', en: 'Peace be with you' },
      { it: 'Mio Signore e mio Dio', en: 'My Lord and my God' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'Vediamo il Signore.', answer: 'Abbiamo visto il Signore.' },
      { instruction: 'Rendi negativa', base: 'Tommaso era con loro.', answer: 'Tommaso non era con loro.' },
    ],
    questions: [
      { q: 'Che cosa disse Gesù ai discepoli?', answers: ['Pace a voi', 'pace a voi'], model: 'Gesù disse: «Pace a voi!».' },
      { q: 'Chi non era con i discepoli quando venne Gesù?', answers: ['Tommaso'], model: 'Tommaso non era con loro.' },
    ],
  },
  9: {
    phrases: [
      { it: 'Non temete', en: 'Do not be afraid' },
      { it: 'Gloria a Dio', en: 'Glory to God' },
      { it: 'per voi', en: 'for you' },
    ],
    transform: [
      { instruction: 'Metti al futuro', base: 'Trovate un bambino.', answer: 'Troverete un bambino.' },
      { instruction: 'Metti al plurale', base: 'Il pastore veglia sul gregge.', answer: 'I pastori vegliano sul gregge.' },
    ],
    questions: [
      { q: "Che cosa disse l'angelo ai pastori?", answers: ['Non temete', 'non temete'], model: "L'angelo disse: «Non temete»." },
      { q: 'Chi è nato nella città di Davide?', answers: ['un Salvatore', 'il Salvatore', 'un salvatore'], model: 'È nato per voi un Salvatore.' },
    ],
  },
  10: {
    phrases: [
      { it: 'Sta scritto', en: 'It is written' },
      { it: 'di solo pane', en: 'on bread alone' },
    ],
    transform: [
      { instruction: 'Rendi negativa', base: "L'uomo vivrà di solo pane.", answer: "L'uomo non vivrà di solo pane." },
      { instruction: 'Metti al passato prossimo', base: 'Gesù ha fame.', answer: 'Gesù ha avuto fame.' },
    ],
    questions: [
      { q: 'Di che cosa non vive solo l\'uomo?', answers: ['di solo pane', 'pane', 'di pane'], model: 'Non di solo pane vivrà l\'uomo.' },
      { q: 'Chi fu tentato nel deserto?', answers: ['Gesù'], model: 'Gesù fu tentato nel deserto.' },
    ],
  },
  11: {
    phrases: [
      { it: 'Beati voi', en: 'Blessed are you' },
      { it: 'fate del bene', en: 'do good' },
    ],
    transform: [
      { instruction: 'Metti al plurale', base: 'Il povero è beato.', answer: 'I poveri sono beati.' },
      { instruction: 'Metti al futuro', base: 'Chi piange ride.', answer: 'Chi piange riderà.' },
    ],
    questions: [
      { q: 'Chi dobbiamo amare secondo Gesù?', answers: ['i nemici', 'i nostri nemici', 'i vostri nemici'], model: 'Amate i vostri nemici.' },
      { q: 'Chi è beato secondo Gesù?', answers: ['i poveri', 'voi poveri'], model: 'Beati voi, poveri.' },
    ],
  },
  12: {
    phrases: [
      { it: 'chi dite che io sia?', en: 'who do you say I am?' },
      { it: 'il Cristo di Dio', en: 'the Christ of God' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'Pietro risponde a Gesù.', answer: 'Pietro ha risposto a Gesù.' },
      { instruction: 'Metti al plurale', base: 'Il discepolo è con lui.', answer: 'I discepoli sono con lui.' },
    ],
    questions: [
      { q: 'Che cosa rispose Pietro?', answers: ['il Cristo di Dio', 'il Cristo', 'il cristo di Dio'], model: 'Pietro rispose: «Il Cristo di Dio».' },
      { q: 'Chi deve soffrire molto?', answers: ["il Figlio dell'uomo", 'Gesù'], model: "Il Figlio dell'uomo deve soffrire molto." },
    ],
  },
  13: {
    phrases: [
      { it: 'come te stesso', en: 'as yourself' },
      { it: 'con tutto il cuore', en: 'with all your heart' },
    ],
    transform: [
      { instruction: 'Metti al futuro', base: 'Ami il Signore.', answer: 'Amerai il Signore.' },
      { instruction: 'Rendi negativa', base: 'Il samaritano si fermò ad aiutare.', answer: 'Il samaritano non si fermò ad aiutare.' },
    ],
    questions: [
      { q: 'Come dobbiamo amare il prossimo?', answers: ['come te stesso', 'come me stesso', 'come noi stessi'], model: 'Amerai il prossimo tuo come te stesso.' },
      { q: 'Chi ebbe compassione del ferito?', answers: ['il samaritano', 'il buon samaritano'], model: 'Il samaritano ebbe compassione di lui.' },
    ],
  },
  14: {
    phrases: [
      { it: 'non preoccupatevi', en: 'do not worry' },
      { it: 'più di', en: 'more than' },
    ],
    transform: [
      { instruction: 'Metti al futuro', base: 'Costruisco granai più grandi.', answer: 'Costruirò granai più grandi.' },
      { instruction: 'Rendi negativa', base: 'La vita dipende dalla ricchezza.', answer: 'La vita non dipende dalla ricchezza.' },
    ],
    questions: [
      { q: 'Che cosa dobbiamo cercare?', answers: ['il regno di Dio', 'il suo regno', 'il regno'], model: 'Cercate il suo regno.' },
      { q: 'Che cosa vale più del cibo?', answers: ['la vita'], model: 'La vita vale più del cibo.' },
    ],
  },
  15: {
    phrases: [
      { it: 'facciamo festa', en: "let's celebrate", lit: 'let us make feast' },
      { it: 'gli corse incontro', en: 'ran to meet him' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'Il padre abbraccia il figlio.', answer: 'Il padre ha abbracciato il figlio.' },
      { instruction: 'Metti al plurale', base: 'Il figlio torna dal padre.', answer: 'I figli tornano dal padre.' },
    ],
    questions: [
      { q: "Quanti figli aveva l'uomo?", answers: ['due', 'due figli'], model: 'Un uomo aveva due figli.' },
      { q: 'Che cosa fece il padre quando vide il figlio?', answers: ['gli corse incontro', 'lo abbracciò', 'corse incontro'], model: 'Il padre gli corse incontro e lo abbracciò.' },
    ],
  },
  16: {
    phrases: [
      { it: 'abbi pietà di me', en: 'have mercy on me' },
      { it: 'a differenza di', en: 'unlike' },
    ],
    transform: [
      { instruction: 'Metti al futuro', base: 'Chi si umilia è esaltato.', answer: 'Chi si umilia sarà esaltato.' },
      { instruction: 'Metti al plurale', base: "L'uomo salì al tempio a pregare.", answer: 'Gli uomini salirono al tempio a pregare.' },
    ],
    questions: [
      { q: 'Che cosa disse il pubblicano?', answers: ['abbi pietà di me', 'abbi pietà di me peccatore', 'Dio abbi pietà di me'], model: 'Il pubblicano disse: «O Dio, abbi pietà di me peccatore».' },
      { q: 'Chi sarà esaltato?', answers: ['chi si umilia', "l'umile"], model: 'Chi si umilia sarà esaltato.' },
    ],
  },
  17: {
    phrases: [
      { it: 'scendi subito', en: 'come down at once' },
      { it: 'oggi', en: 'today' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'La salvezza entra in questa casa.', answer: 'La salvezza è entrata in questa casa.' },
      { instruction: 'Rendi negativa', base: 'Zaccheo riusciva a vedere Gesù.', answer: 'Zaccheo non riusciva a vedere Gesù.' },
    ],
    questions: [
      { q: 'Chi salì sul sicomoro per vedere Gesù?', answers: ['Zaccheo'], model: 'Zaccheo salì sul sicomoro.' },
      { q: 'Che cosa è entrato oggi in questa casa?', answers: ['la salvezza'], model: 'Oggi la salvezza è entrata in questa casa.' },
    ],
  },
  18: {
    phrases: [
      { it: 'è risorto', en: 'he is risen' },
      { it: 'il primo giorno della settimana', en: 'the first day of the week' },
    ],
    transform: [
      { instruction: 'Metti al plurale', base: 'La donna andò al sepolcro.', answer: 'Le donne andarono al sepolcro.' },
      { instruction: 'Rendi negativa', base: 'Gesù è qui.', answer: 'Gesù non è qui.' },
    ],
    questions: [
      { q: "Dov'è Gesù secondo l'angelo?", answers: ['non è qui', 'è risorto'], model: 'Non è qui, è risorto.' },
      { q: 'Che cosa trovarono le donne al sepolcro?', answers: ['la pietra rotolata via', 'il sepolcro vuoto', 'la pietra'], model: 'Trovarono la pietra rotolata via dal sepolcro.' },
    ],
  },
  19: {
    phrases: [
      { it: 'Che cosa dobbiamo fare?', en: 'What must we do?' },
      { it: 'nel nome di Gesù', en: 'in the name of Jesus' },
    ],
    transform: [
      { instruction: 'Metti al futuro', base: 'Ricevete il dono dello Spirito Santo.', answer: 'Riceverete il dono dello Spirito Santo.' },
      { instruction: 'Metti al plurale', base: "L'apostolo parla in altre lingue.", answer: 'Gli apostoli parlano in altre lingue.' },
    ],
    questions: [
      { q: 'Che cosa chiese la folla a Pietro?', answers: ['che cosa dobbiamo fare', 'cosa dobbiamo fare'], model: 'Chiesero: «Che cosa dobbiamo fare, fratelli?».' },
      { q: 'Che cosa riceveranno i battezzati?', answers: ['il dono dello Spirito Santo', 'lo Spirito Santo', 'il dono dello spirito santo'], model: 'Riceverete il dono dello Spirito Santo.' },
    ],
  },
  20: {
    phrases: [
      { it: 'con franchezza', en: 'boldly', lit: 'with frankness' },
      { it: "un cuore solo e un'anima sola", en: 'one heart and one soul' },
    ],
    transform: [
      { instruction: 'Rendi negativa', base: "In lui c'è salvezza.", answer: "In lui non c'è salvezza." },
      { instruction: 'Metti al plurale', base: 'Il credente annunciava la parola.', answer: 'I credenti annunciavano la parola.' },
    ],
    questions: [
      { q: "Dove non c'è salvezza?", answers: ['in nessun altro', 'in nessun altro nome'], model: "In nessun altro c'è salvezza." },
      { q: 'Come annunciavano la parola di Dio?', answers: ['con franchezza'], model: 'Annunciavano la parola di Dio con franchezza.' },
    ],
  },
  21: {
    phrases: [
      { it: 'perché mi perseguiti?', en: 'why do you persecute me?' },
      { it: 'Chi sei, o Signore?', en: 'Who are you, Lord?' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'Saulo cade a terra.', answer: 'Saulo è caduto a terra.' },
      { instruction: 'Rendi negativa', base: 'Saulo vede la luce.', answer: 'Saulo non vede la luce.' },
    ],
    questions: [
      { q: 'Chi parlò a Saulo sulla via di Damasco?', answers: ['Gesù', 'il Signore'], model: 'Era Gesù che gli parlava.' },
      { q: 'Che cosa disse la voce a Saulo?', answers: ['perché mi perseguiti', 'Saulo perché mi perseguiti'], model: '«Saulo, Saulo, perché mi perseguiti?».' },
    ],
  },
  22: {
    phrases: [
      { it: 'in verità', en: 'truly' },
      { it: 'per mezzo di Gesù Cristo', en: 'through Jesus Christ' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'Lo Spirito Santo scende su tutti.', answer: 'Lo Spirito Santo è sceso su tutti.' },
      { instruction: 'Rendi negativa', base: 'Dio fa preferenza di persone.', answer: 'Dio non fa preferenza di persone.' },
    ],
    questions: [
      { q: 'Dio fa preferenza di persone?', answers: ['no', 'no non fa preferenza', 'Dio non fa preferenza di persone'], model: 'No, Dio non fa preferenza di persone.' },
      { q: 'Su chi scese lo Spirito Santo?', answers: ['su tutti', 'sui pagani', 'su tutti coloro che ascoltavano'], model: 'Lo Spirito Santo scese su tutti coloro che ascoltavano.' },
    ],
  },
  23: {
    phrases: [
      { it: 'la remissione dei peccati', en: 'the forgiveness of sins' },
      { it: 'chiunque crede', en: 'whoever believes' },
    ],
    transform: [
      { instruction: 'Metti al plurale', base: 'Il pagano ascolta la parola.', answer: 'I pagani ascoltano la parola.' },
      { instruction: 'Rendi negativa', base: 'Voi vi giudicate degni della vita eterna.', answer: 'Voi non vi giudicate degni della vita eterna.' },
    ],
    questions: [
      { q: 'Chi è giustificato in Cristo?', answers: ['chiunque crede', 'chi crede'], model: 'In lui è giustificato chiunque crede.' },
      { q: 'A chi si rivolgono ora Paolo e Barnaba?', answers: ['ai pagani', 'i pagani'], model: 'Noi ci rivolgiamo ai pagani.' },
    ],
  },
  24: {
    phrases: [
      { it: 'che cosa devo fare?', en: 'what must I do?' },
      { it: 'stavano pregando', en: 'they were praying' },
    ],
    transform: [
      { instruction: 'Rendi negativa', base: 'Il carceriere si fece del male.', answer: 'Il carceriere non si fece del male.' },
      { instruction: 'Metti al passato prossimo', base: 'Le porte si aprono.', answer: 'Le porte si sono aperte.' },
    ],
    questions: [
      { q: 'Che cosa chiese il carceriere?', answers: ['che cosa devo fare per essere salvato', 'cosa devo fare per essere salvato', 'che cosa devo fare'], model: 'Chiese: «Che cosa devo fare per essere salvato?».' },
      { q: 'Che cosa facevano Paolo e Sila in prigione?', answers: ['pregavano e cantavano', 'pregavano', 'cantavano inni'], model: 'Pregavano e cantavano inni a Dio.' },
    ],
  },
  25: {
    phrases: [
      { it: 'più... che', en: 'more... than' },
      { it: 'Vegliate', en: 'Keep watch' },
    ],
    transform: [
      { instruction: 'Metti al plurale', base: 'Il vescovo veglia sul gregge.', answer: 'I vescovi vegliano sul gregge.' },
      { instruction: 'Metti al passato prossimo', base: 'Ricevo il ministero dal Signore.', answer: 'Ho ricevuto il ministero dal Signore.' },
    ],
    questions: [
      { q: "Dove c'è più gioia, nel dare o nel ricevere?", answers: ['nel dare', 'dare'], model: 'Vi è più gioia nel dare che nel ricevere.' },
      { q: 'Su che cosa dovevano vegliare gli anziani?', answers: ['sul gregge', 'su tutto il gregge', 'su voi stessi'], model: 'Vegliate su tutto il gregge.' },
    ],
  },
  26: {
    phrases: [
      { it: 'che cosa devo fare?', en: 'what must I do?' },
      { it: 'lava via i tuoi peccati', en: 'wash away your sins' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'Cado a terra.', answer: 'Sono caduto a terra.' },
      { instruction: 'Metti al plurale', base: 'Il compagno vide la luce.', answer: 'I compagni videro la luce.' },
    ],
    questions: [
      { q: 'Che cosa avvolse Paolo sulla via di Damasco?', answers: ['una grande luce', 'una luce', 'la luce'], model: 'Una grande luce dal cielo mi avvolse.' },
      { q: 'Chi rispose «Sono Gesù»?', answers: ['il Signore', 'Gesù'], model: 'Mi disse: «Sono Gesù il Nazareno».' },
    ],
  },
  27: {
    phrases: [
      { it: 'dalle tenebre alla luce', en: 'from darkness to light' },
      { it: 'più splendente del sole', en: 'brighter than the sun' },
    ],
    transform: [
      { instruction: 'Rendi negativa', base: 'Paolo si appellò a Cesare.', answer: 'Paolo non si appellò a Cesare.' },
      { instruction: 'Metti al futuro', base: 'Sei mio testimone.', answer: 'Sarai mio testimone.' },
    ],
    questions: [
      { q: 'A chi si appellò Paolo?', answers: ['a Cesare', 'Cesare'], model: 'Paolo si appellò a Cesare.' },
      { q: 'Verso che cosa si convertono i pagani?', answers: ['alla luce', 'dalle tenebre alla luce'], model: 'Si convertano dalle tenebre alla luce.' },
    ],
  },
  28: {
    phrases: [
      { it: 'senza impedimento', en: 'without hindrance' },
      { it: 'il regno di Dio', en: 'the kingdom of God' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'Paolo arriva a Roma.', answer: 'Paolo è arrivato a Roma.' },
      { instruction: 'Metti al plurale', base: 'Il pagano ascolta la salvezza.', answer: 'I pagani ascoltano la salvezza.' },
    ],
    questions: [
      { q: 'A chi viene inviata la salvezza di Dio?', answers: ['ai pagani', 'i pagani'], model: 'Questa salvezza di Dio viene inviata ai pagani.' },
      { q: 'Quanto tempo rimase Paolo nel suo alloggio?', answers: ['due anni', 'due anni interi'], model: 'Rimase due anni interi.' },
    ],
  },
  29: {
    phrases: [
      { it: 'per fede', en: 'by faith' },
      { it: 'non mi vergogno', en: 'I am not ashamed' },
    ],
    transform: [
      { instruction: 'Metti al futuro', base: 'Il giusto per fede vive.', answer: 'Il giusto per fede vivrà.' },
      { instruction: 'Rendi negativa', base: "L'uomo segue il consiglio degli empi.", answer: "L'uomo non segue il consiglio degli empi." },
    ],
    questions: [
      { q: 'Come vivrà il giusto?', answers: ['per fede', 'per la fede'], model: 'Il giusto per fede vivrà.' },
      { q: 'Di che cosa non si vergogna Paolo?', answers: ['del vangelo', 'il vangelo'], model: 'Non mi vergogno del vangelo.' },
    ],
  },
  30: {
    phrases: [
      { it: 'per la sua grazia', en: 'by his grace' },
      { it: 'non manco di nulla', en: 'I lack nothing', lit: 'I do not lack of nothing' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'Tutti peccano.', answer: 'Tutti hanno peccato.' },
      { instruction: 'Rendi negativa', base: 'Siamo giustificati per le opere.', answer: 'Non siamo giustificati per le opere.' },
    ],
    questions: [
      { q: 'Chi ha peccato secondo Paolo?', answers: ['tutti'], model: 'Tutti hanno peccato.' },
      { q: 'Chi è il mio pastore?', answers: ['il Signore'], model: 'Il Signore è il mio pastore.' },
    ],
  },
  31: {
    phrases: [
      { it: 'in pace con Dio', en: 'at peace with God' },
      { it: 'per noi', en: 'for us' },
    ],
    transform: [
      { instruction: 'Rendi negativa', base: 'La speranza delude.', answer: 'La speranza non delude.' },
      { instruction: 'Metti al passato prossimo', base: 'Cristo muore per noi.', answer: 'Cristo è morto per noi.' },
    ],
    questions: [
      { q: 'Che cosa non fa la speranza?', answers: ['non delude', 'deludere'], model: 'La speranza non delude.' },
      { q: 'Per chi è morto Cristo?', answers: ['per noi', 'per i peccatori'], model: 'Cristo è morto per noi.' },
    ],
  },
  32: {
    phrases: [
      { it: 'nessuna condanna', en: 'no condemnation' },
      { it: 'né... né', en: 'neither... nor' },
    ],
    transform: [
      { instruction: 'Rendi negativa', base: "C'è condanna per quelli in Cristo.", answer: "Non c'è condanna per quelli in Cristo." },
      { instruction: 'Metti al plurale', base: 'Colui che ama Dio è chiamato.', answer: 'Coloro che amano Dio sono chiamati.' },
    ],
    questions: [
      { q: 'Quanta condanna c\'è per quelli in Cristo?', answers: ['nessuna', 'nessuna condanna'], model: 'Non vi è nessuna condanna per quelli che sono in Cristo Gesù.' },
      { q: 'Che cosa chiede il salmista a Dio?', answers: ['un cuore puro', 'crea in me un cuore puro'], model: 'Crea in me un cuore puro.' },
    ],
  },
  33: {
    phrases: [
      { it: 'con la tua bocca', en: 'with your mouth' },
      { it: 'chiunque', en: 'whoever' },
    ],
    transform: [
      { instruction: 'Metti al futuro', base: 'Chi crede è salvato.', answer: 'Chi crede sarà salvato.' },
      { instruction: 'Rendi negativa', base: 'Confessi con la tua bocca.', answer: 'Non confessi con la tua bocca.' },
    ],
    questions: [
      { q: 'Chi sarà salvato?', answers: ['chiunque invoca il nome del Signore', 'chi invoca il nome del Signore', 'chiunque invocherà il nome del Signore'], model: 'Chiunque invocherà il nome del Signore sarà salvato.' },
      { q: 'Con che cosa si confessa la fede?', answers: ['con la bocca', 'con la tua bocca'], model: 'Con la bocca si fa la professione di fede.' },
    ],
  },
  34: {
    phrases: [
      { it: 'gli uni gli altri', en: 'one another' },
      { it: 'non conformatevi', en: 'do not conform' },
    ],
    transform: [
      { instruction: 'Rendi negativa', base: 'Conformatevi a questo mondo.', answer: 'Non conformatevi a questo mondo.' },
      { instruction: 'Metti al voi', base: 'Offri il tuo corpo come sacrificio.', answer: 'Offrite i vostri corpi come sacrificio.' },
    ],
    questions: [
      { q: 'A che cosa non dobbiamo conformarci?', answers: ['a questo mondo', 'al mondo', 'questo mondo'], model: 'Non conformatevi a questo mondo.' },
      { q: 'Come dobbiamo offrire i nostri corpi?', answers: ['come sacrificio vivente', 'come sacrificio', 'un sacrificio vivente'], model: 'Offrite i vostri corpi come sacrificio vivente.' },
    ],
  },
  35: {
    phrases: [
      { it: 'come te stesso', en: 'as yourself' },
      { it: 'il prossimo tuo', en: 'your neighbor' },
    ],
    transform: [
      { instruction: 'Metti al futuro', base: 'Ami il prossimo tuo.', answer: 'Amerai il prossimo tuo.' },
      { instruction: 'Rendi negativa', base: 'La carità fa male al prossimo.', answer: 'La carità non fa male al prossimo.' },
    ],
    questions: [
      { q: 'Chi dobbiamo amare come noi stessi?', answers: ['il prossimo', 'il nostro prossimo', 'il prossimo nostro'], model: 'Amerai il prossimo tuo come te stesso.' },
      { q: 'Da dove viene il mio soccorso?', answers: ['dal Signore', 'viene dal Signore'], model: 'Il mio soccorso viene dal Signore.' },
    ],
  },
  36: {
    phrases: [
      { it: 'il Dio della speranza', en: 'the God of hope' },
      { it: 'un solo animo', en: 'one mind', lit: 'a single soul' },
    ],
    transform: [
      { instruction: 'Metti al passato prossimo', base: 'Tu mi tessi nel seno di mia madre.', answer: 'Tu mi hai tessuto nel seno di mia madre.' },
      { instruction: 'Rendi negativa', base: 'Dio mi conosce.', answer: 'Dio non mi conosce.' },
    ],
    questions: [
      { q: 'Chi è il Dio che ci riempie di gioia e pace?', answers: ['il Dio della speranza', 'Dio della speranza'], model: 'Il Dio della speranza vi riempia di gioia e pace.' },
      { q: 'Chi ti conosce completamente?', answers: ['Dio', 'il Signore', 'tu Signore'], model: 'Dio mi conosce completamente.' },
    ],
  },
  37: {
    phrases: [
      { it: 'Alleluia', en: 'Alleluia (praise the Lord)' },
      { it: 'ogni essere che respira', en: 'everything that breathes' },
      { it: 'Buon Natale', en: 'Merry Christmas' },
    ],
    transform: [
      { instruction: 'Metti al plurale', base: 'Lo strumento loda il Signore.', answer: 'Gli strumenti lodano il Signore.' },
      { instruction: 'Metti al voi', base: 'Loda il Signore.', answer: 'Lodate il Signore.' },
    ],
    questions: [
      { q: 'Chi deve lodare il Signore?', answers: ['ogni essere che respira', 'tutto ciò che respira', 'ogni vivente'], model: 'Ogni essere che respira lodi il Signore.' },
      { q: 'Con quale strumento si loda Dio nel Salmo 150?', answers: ['la tromba', 'con la tromba', "l'arpa", 'la cetra'], model: 'Lodatelo con la tromba.' },
    ],
  },
};

// Merge the speaking layer onto the base exercises by week number.
export const EXERCISES = Object.fromEntries(
  Object.keys(BASE_EXERCISES).map((n) => [n, { ...BASE_EXERCISES[n], ...(SPEAKING[n] || {}) }])
);
