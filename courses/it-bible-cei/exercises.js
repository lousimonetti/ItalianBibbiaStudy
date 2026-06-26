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
//   passage (optional, not yet authored): {
//     ref: 'Giovanni 1,1-5', translation: 'Riveduta (PD)',
//     verses: [{ n: 1, t: '…' }, …]
//   }
//   When a `passage` is present the reader (O2), dictogloss (O4) and comprehension
//   (O5) use it; otherwise they fall back to the week's example sentences. Full
//   passages were left for a networked/authoring pass — the sandbox blocks Bible
//   APIs and bundling full CEI 2008 chapters is both copyrighted and too large
//   for the static free-tier build. Drop public-domain text in here to upgrade.

export const EXERCISES = {
  // ── Phase 1: John ─────────────────────────────────────────────────────────
  1: {
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
