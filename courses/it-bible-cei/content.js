// Course content — the weeks/phases for this course. Edit this file (and
// course/config.js) to build your own course; the app reads it via course/index.js.
// (Was src/data/studyData.js's PHASES; tuple shape unchanged so the engines need
// no changes: [italian, english, example, ipa?].)

import { EXERCISES } from './exercises.js';

const rawPhases = [
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
          ['il Verbo', 'the Word', 'In principio era il Verbo', '/il ˈvɛrbo/', { exEn: "In the beginning was the Word" }],
          ['la luce', 'the light', 'La luce splende', '/la ˈluːtʃe/', { exEn: "The light shines" }],
          ['le tenebre', 'the darkness', 'le tenebre non la vinsero', '/le ˈtɛːnebɾe/', { exEn: "the darkness did not overcome it" }],
          ['la vita', 'life', 'in lui era la vita', '/la ˈviːta/', { exEn: "in him was life" }],
          ['credere', 'to believe', 'ha creduto in lui', '/ˈkɾɛːdeɾe/', { exEn: "he believed in him", form: "ha creduto" }],
          ['il miracolo', 'the miracle', 'primo dei suoi miracoli', '/il miˈɾaːkolo/', { exEn: "the first of his miracles", form: "miracoli" }],
          ['il mondo', 'the world', 'il mondo è stato fatto per mezzo di lui', '/il ˈmondo/', { exEn: "the world was made through him" }],
        ],
        grammar: {
          title: 'essere e avere — your two foundation verbs',
          body: 'Every Italian sentence runs on these. "Dio è amore" uses essere; "Gesù ha detto" uses avere. In John 1, you\'ll see "era" (was) and "aveva" (had) constantly. Spot them as you read and note whether they describe state (essere) or action/possession (avere).',
        },
        exegesis: {
          title: "Three pasts in fourteen verses",
          body: "The Prologue makes its central claim with tense, not vocabulary. \"Era\" is imperfetto: unbounded, no beginning, no endpoint — the Word does not start, it was already being. \"È stato fatto\" is passato prossimo passive: bounded, completed, done through an agent — creation is an event. \"Si fece\" is passato remoto: a single punctual act, historically distant — the Incarnation is a moment, not a state. English flattens all three into \"was / was made / became\" and the distinction disappears. Italian keeps it, so an Italian reader sees three different relationships to time where an English reader sees one.",
          forms: [
            { it: "era", gloss: "was (imperfetto)", note: "Unbounded state — the Word simply was." },
            { it: "è stato fatto", gloss: "was made (passato prossimo)", note: "A completed event with an agent." },
            { it: "si fece", gloss: "became (passato remoto)", note: "One punctual act, in the distant past." },
          ],
        },
        prompt: {
          it: 'In principio, Dio ha creato il mondo con la sua Parola.',
          en: 'Write about the opening of John 1 in your own words — what did the Word do?',
        },
      },
      {
        n: 2, d: 'Apr 20-26', r: 'John 3-4', b: 'Present tense verbs', review: false,
        vocab: [
          ['nascere', 'to be born', 'bisogna nascere di nuovo', '/ˈnaʃʃeɾe/', { exEn: "one must be born again" }],
          ['lo Spirito', 'the Spirit', 'lo Spirito soffia dove vuole', '/lo ˈspiːɾito/', { exEn: "the Spirit blows where it wills" }],
          ['il pozzo', 'the well', 'sedeva presso il pozzo', '/il ˈpɔttso/', { exEn: "he was sitting by the well" }],
          ['adorare', 'to worship', 'i veri adoratori', '/adoˈɾaːɾe/', { exEn: "the true worshippers", form: "adoratori" }],
          ['il Salvatore', 'the Savior', 'il Salvatore del mondo', '/il salvaˈtoːɾe/', { exEn: "the Savior of the world" }],
          ['credere', 'to believe', 'chi crede in lui', '/ˈkɾɛːdeɾe/', { exEn: "whoever believes in him", form: "crede" }],
          ['il dono', 'the gift', 'se conoscessi il dono di Dio', '/il ˈdoːno/', { exEn: "if you knew the gift of God" }],
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
          ['guarire', 'to heal', 'lo ha guarito', '/ɡwaˈɾiːɾe/', { exEn: "he healed him", form: "ha guarito" }],
          ['il pane', 'bread', 'sono io il pane della vita', '/il ˈpaːne/', { exEn: "I am the bread of life" }],
          ['la folla', 'the crowd', 'la folla grande lo seguiva', '/la ˈfɔlla/', { exEn: "the great crowd was following him" }],
          ['saziarsi', 'to be satisfied', 'mangiarono e si saziarono', '/sattsˈjaɾsi/', { exEn: "they ate and were satisfied", form: "si saziarono" }],
          ['la vita eterna', 'eternal life', 'ha la vita eterna', '/la ˈviːta eˈtɛɾna/', { exEn: "he has eternal life" }],
          ['la manna', 'manna', 'i nostri padri mangiarono la manna', '/la ˈmanna/', { exEn: "our fathers ate the manna" }],
          ['il segno', 'the sign', 'quale segno fai tu?', '/il ˈseɲɲo/', { exEn: "what sign do you perform?", form: "segno" }],
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
          ['insegnare', 'to teach', 'insegnava nel tempio', '/inseɲˈɲaːɾe/', { exEn: "he was teaching in the temple", form: "insegnava" }],
          ['la verità', 'the truth', 'la verità vi farà liberi', '/la veɾiˈta/', { exEn: "the truth will set you free" }],
          ['liberare', 'to set free', 'vi farà liberi', '/libeˈɾaːɾe/', { exEn: "he will make you free", form: "liberi" }],
          ['giudicare', 'to judge', "non giudicate secondo l'apparenza", '/dʒudiˈkaːɾe/', { exEn: "do not judge by appearances", form: "giudicate" }],
          ['il peccato', 'sin', 'chi di voi è senza peccato', '/il pekˈkaːto/', { exEn: "which of you is without sin" }],
          ['scrivere', 'to write', 'scriveva per terra', '/ˈskɾiːveɾe/', { exEn: "he was writing on the ground", form: "scriveva" }],
          ['luce del mondo', 'light of the world', 'sono la luce del mondo', '/ˈluːtʃe del ˈmondo/', { exEn: "I am the light of the world" }],
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
          ['il cieco', 'blind man', 'un uomo cieco dalla nascita', '/il ˈtʃɛːko/', { exEn: "a man blind from birth", form: "cieco" }],
          ['vedere', 'to see', 'ora vedo', '/veˈdɛːɾe/', { exEn: "now I see", form: "vedo" }],
          ['il buon pastore', 'the good shepherd', 'io sono il buon pastore', '/il ˌbwɔn pasˈtoːɾe/', { exEn: "I am the good shepherd" }],
          ['la pecora', 'sheep', 'conosce le mie pecore', '/la ˈpɛːkoɾa/', { exEn: "he knows my sheep", form: "pecore" }],
          ['la tomba', 'tomb', "dov'è il sepolcro?", '/la ˈtomba/', { exEn: "where is the tomb?" }],
          ['risuscitare', 'to raise from dead', 'io sono la risurrezione', '/ɾizuʃʃiˈtaːɾe/', { exEn: "I am the resurrection", form: "risurrezione" }],
          ['piangere', 'to weep', 'Gesù scoppiò in pianto', '/ˈpjandʒeɾe/', { exEn: "Jesus burst into tears", form: "pianto" }],
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
          ["l'unzione", 'the anointing', "l'unzione a Betania", '/lunˈtsjone/', { exEn: "the anointing at Bethany" }],
          ["l'asino", 'the donkey', 'seduto su un asino', '/ˈlaːzino/', { exEn: "seated on a donkey", form: "asino" }],
          ['lavare i piedi', 'wash feet', 'lavò i piedi ai discepoli', '/laˈvaːɾe i ˈpjɛːdi/', { exEn: "he washed the disciples’ feet", form: "lavò i piedi" }],
          ['il tradimento', 'betrayal', 'annunciò il suo traditore', '/il tɾadiˈmento/', { exEn: "he announced his betrayer", form: "traditore" }],
          ['la casa del Padre', "Father's house", 'nella casa del Padre', '/la ˈkaːza del ˈpaːdɾe/', { exEn: "in the Father’s house", form: "casa del Padre" }],
          ['il Paraclito', 'the Paraclete', 'vi manderà il Paraclito', '/il paˈɾaːklito/', { exEn: "he will send you the Paraclete" }],
          ['la via', 'the way', 'io sono la via', '/la ˈviːa/', { exEn: "I am the way" }],
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
          ['la vite', 'the vine', 'io sono la vite vera', '/la ˈviːte/', { exEn: "I am the true vine" }],
          ['il tralcio', 'the branch', 'ogni tralcio in me', '/il ˈtɾaltʃo/', { exEn: "every branch in me", form: "tralcio" }],
          ['portare frutto', 'to bear fruit', 'portiate molto frutto', '/poɾˈtaːɾe ˈfɾutto/', { exEn: "that you bear much fruit", form: "portiate molto frutto" }],
          ['il comandamento', 'commandment', 'questo è il mio comandamento', '/il komandaˈmento/', { exEn: "this is my commandment" }],
          ['rimanere', 'to remain', 'rimanete nel mio amore', '/ɾimaˈnɛːɾe/', { exEn: "remain in my love", form: "rimanete" }],
          ['il mondo', 'the world', 'il mondo vi odierà', '/il ˈmondo/', { exEn: "the world will hate you" }],
          ['la preghiera', 'prayer', 'pregò per i suoi discepoli', '/la pɾeˈɡjɛːɾa/', { exEn: "he prayed for his disciples", form: "pregò" }],
        ],
        grammar: {
          title: 'Modal verbs: potere, dovere, volere',
          body: '"Posso" (I can), "devo" (I must), "voglio" (I want). These always pair with an infinitive: "posso fare" (I can do), "devo partire" (I must leave), "volete rimanere?" (do you want to stay?)',
        },
        exegesis: {
          title: "The pronoun that should not be there",
          body: "Italian is a pro-drop language: \"sono la vite\" is complete and perfectly normal, because the verb ending already tells you the subject. So when the text says \"IO sono la vite\", the pronoun is marked — it is there to contrast and emphasize. Every one of John’s \"I am\" sayings does this: io sono il pane della vita, io sono la luce del mondo, io sono il buon pastore, io sono la risurrezione. The Italian preserves the emphatic weight of the Greek ego eimi, which English cannot mark at all because English requires the subject pronoun anyway. The claim is in a word that grammar says you could have left out.",
          forms: [
            { it: "sono la vite", gloss: "I am the vine", note: "Neutral — the ending -o already says \"I\"." },
            { it: "io sono la vite", gloss: "I am the vine", note: "Emphatic — the pronoun is a deliberate addition." },
          ],
        },
        prompt: {
          it: 'Gesù ha detto: "Rimanete nel mio amore. Senza di me non potete fare nulla."',
          en: 'Write about the vine and branches image — what does it mean to "remain" in Jesus?',
        },
      },
      {
        n: 8, d: 'Jun 1-7', r: 'John 18-21', b: 'Review week + first iTalki session', review: true,
        vocab: [
          ["l'arresto", 'the arrest', "l'arresto nel Getsemani", '/laɾˈɾɛsto/', { exEn: "the arrest in Gethsemane" }],
          ['il rinnegamento', 'the denial', 'il rinnegamento di Pietro', '/il ɾinneɡaˈmento/', { exEn: "Peter’s denial" }],
          ['la crocifissione', 'crucifixion', 'portò la sua croce', '/la kɾotʃifisˈsjone/', { exEn: "he carried his cross" }],
          ['il sepolcro vuoto', 'empty tomb', 'il sepolcro era vuoto', '/il seˈpɔlkɾo ˈvwɔto/', { exEn: "the tomb was empty" }],
          ['la resurrezione', 'the resurrection', 'sono risorto', '/la ɾezuɾɾetˈtsjone/', { exEn: "I have risen" }],
          ['la missione', 'the mission', 'come il Padre ha mandato me', '/la misˈsjone/', { exEn: "as the Father has sent me" }],
          ['la pace', 'peace', 'la pace sia con voi', '/la ˈpaːtʃe/', { exEn: "peace be with you" }],
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
          ["l'annuncio", 'the announcement', "l'annunciazione a Maria", '/lanˈnuntʃo/', { exEn: "the Annunciation to Mary", form: "annunciazione" }],
          ["l'angelo", 'the angel', "l'angelo Gabriele", '/ˈlandʒelo/', { exEn: "the angel Gabriel" }],
          ['benedetto', 'blessed', 'benedetta tu fra le donne', '/beneˈdɛtto/', { exEn: "blessed are you among women", form: "benedetta" }],
          ['la nascita', 'birth', 'la nascita di Gesù', '/la ˈnaʃʃita/', { exEn: "the birth of Jesus" }],
          ['la mangiatoia', 'manger', 'lo depose nella mangiatoia', '/la mandʒaˈtɔːja/', { exEn: "she laid him in the manger", form: "mangiatoia" }],
          ['i pastori', 'shepherds', 'i pastori andarono a Betlemme', '/i pasˈtoːɾi/', { exEn: "the shepherds went to Bethlehem" }],
          ['il Magnificat', 'Magnificat', "l'anima mia magnifica il Signore", '/il maɲˈɲifikat/', { exEn: "my soul magnifies the Lord", form: "magnifica" }],
        ],
        grammar: {
          title: 'Passato prossimo — building fluency',
          body: 'Focus on essere verbs: "è nato" (was born), "è venuto" (came), "sono andati" (they went), "è tornata" (she returned). Before reading, predict which verbs will use essere versus avere — then verify.',
        },
        exegesis: {
          title: "Mary’s subjunctive, and a future told in the past",
          body: "Luke 1 teaches two things at once. First the fiat: \"avvenga di me secondo la tua parola\" is a subjunctive of volition — not a prediction (\"it will happen\") and not a command, but consent to something not yet real. The whole theology of Mary’s answer sits in the mood of one verb. Then the Magnificat does something stranger. It opens in the present — \"l’anima mia magnifica il Signore\" — and immediately switches to the perfect: ha guardato, ha spiegato, ha rovesciato, ha innalzato. God has ALREADY thrown down the mighty and raised the lowly. This is the prophetic perfect: a future so certain it is narrated as accomplished. The tense is the claim.",
          forms: [
            { it: "avvenga", gloss: "may it be done (congiuntivo)", note: "Consent to a possibility, not a statement of fact." },
            { it: "magnifica", gloss: "magnifies (present)", note: "The song opens in the present." },
            { it: "ha rovesciato", gloss: "he has thrown down (passato prossimo)", note: "A future act stated as already finished." },
          ],
        },
        prompt: {
          it: 'L\'angelo ha detto a Maria: "Non temere, Maria. Darai alla luce un figlio e lo chiamerai Gesù."',
          en: 'Write the Annunciation scene. What did Mary say? How did she feel?',
        },
      },
      {
        n: 10, d: 'Jun 15-21', r: 'Luke 3-5', b: 'Irregular past tense verbs', review: false,
        vocab: [
          ['il battesimo', 'baptism', 'il battesimo di Gesù', '/il batˈtɛːzimo/', { exEn: "the baptism of Jesus" }],
          ['il deserto', 'desert', 'quaranta giorni nel deserto', '/il deˈzɛɾto/', { exEn: "forty days in the desert" }],
          ['la tentazione', 'temptation', 'le tentazioni del diavolo', '/la tentaˈtsjone/', { exEn: "the temptations of the devil", form: "tentazioni" }],
          ['la rete', 'net', 'gettate le reti', '/la ˈɾɛːte/', { exEn: "cast the nets", form: "reti" }],
          ['il lebbroso', 'leper', 'un uomo pieno di lebbra', '/il lebˈbɾoːzo/', { exEn: "a man full of leprosy" }],
          ['perdonare', 'to forgive', 'ti sono perdonati i peccati', '/peɾdoˈnaːɾe/', { exEn: "your sins are forgiven you", form: "perdonati" }],
          ['camminare', 'to walk', 'alzati e cammina', '/kammiˈnaːɾe/', { exEn: "get up and walk", form: "cammina" }],
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
          ['le beatitudini', 'the beatitudes', 'beati voi poveri', '/le beatituˈdiːni/', { exEn: "blessed are you who are poor" }],
          ['il nemico', 'the enemy', 'amate i vostri nemici', '/il neˈmiːko/', { exEn: "love your enemies", form: "nemici" }],
          ['il centurione', 'centurion', 'il servo del centurione', '/il tʃentuˈɾjone/', { exEn: "the centurion’s servant" }],
          ['la vedova', 'widow', 'la vedova di Naim', '/la ˈvɛːdova/', { exEn: "the widow of Nain" }],
          ['il fariseo', 'Pharisee', 'un fariseo lo invitò', '/il faɾiˈzɛːo/', { exEn: "a Pharisee invited him", form: "fariseo" }],
          ['perdonare', 'to forgive', 'le sue peccata le sono perdonate', '/peɾdoˈnaːɾe/', { exEn: "her sins are forgiven her", form: "perdonate" }],
          ['il profeta', 'the prophet', 'un grande profeta è sorto', '/il pɾoˈfɛːta/', { exEn: "a great prophet has arisen", form: "profeta" }],
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
          ['la tempesta', 'storm', 'calmò la tempesta', '/la temˈpɛsta/', { exEn: "he calmed the storm" }],
          ['i demoni', 'demons', 'i demoni lo supplicavano', '/i ˈdɛːmoni/', { exEn: "the demons begged him" }],
          ['la fede', 'faith', 'la tua fede ti ha salvata', '/la ˈfɛːde/', { exEn: "your faith has saved you" }],
          ['guarire', 'to heal', 'aveva guarito molti', '/ɡwaˈɾiːɾe/', { exEn: "he had healed many", form: "guarito" }],
          ['la trasfigurazione', 'transfiguration', 'la trasfigurazione sul monte', '/la tɾazfiɡuɾaˈtsjone/', { exEn: "the Transfiguration on the mountain" }],
          ['la croce', 'cross', 'prenda la sua croce', '/la ˈkɾoːtʃe/', { exEn: "let him take up his cross" }],
          ['le provviste', 'provisions', 'non prendete nulla per il viaggio', '/le pɾovˈviste/', { exEn: "take nothing for the journey" }],
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
          ['il samaritano', 'Samaritan', 'il buon samaritano', '/il samaɾiˈtaːno/', { exEn: "the good Samaritan" }],
          ['il prossimo', 'neighbor', "chi è il mio prossimo?", '/il ˈpɾɔssimo/', { exEn: "who is my neighbour?" }],
          ["l'olio", 'oil', 'versò olio e vino', '/ˈlɔːljo/', { exEn: "he poured oil and wine", form: "olio" }],
          ['pregare', 'to pray', 'insegnateci a pregare', '/pɾeˈɡaːɾe/', { exEn: "teach us to pray" }],
          ['il Padre Nostro', "Lord's Prayer", 'Padre nostro, che sei nei cieli', '/il ˈpaːdɾe ˈnɔstɾo/', { exEn: "Our Father, who art in heaven", form: "Padre nostro" }],
          ['chiedere', 'to ask', 'chiedete e vi sarà dato', '/ˈkjɛːdeɾe/', { exEn: "ask and it will be given to you", form: "chiedete" }],
          ['il demonio', 'demon', 'scacciava un demonio', '/il deˈmɔːnjo/', { exEn: "he was driving out a demon", form: "demonio" }],
        ],
        grammar: {
          title: 'Reflexive verbs — actions done to oneself',
          body: '"Alzarsi" (to get up), "chiamarsi" (to be called), "fermarsi" (to stop). The pronoun matches the subject: mi, ti, si, ci, vi, si. "Si è fermato" (he stopped himself).',
        },
        exegesis: {
          title: "Four jobs of one little word: si",
          body: "\"Si\" is the hardest small word in Italian for an English speaker, because English has no single reflex for it — English uses four different constructions where Italian uses one clitic. True reflexive: \"si lavò le mani\", he washed his own hands. Change of state (inchoative): \"mangiarono e si saziarono\" — they did not satisfy themselves, they BECAME satisfied. Middle voice: \"il Verbo si fece carne\" — became, with no external agent. Impersonal: \"si dice che…\", one says, it is said. Learn it as four jobs of one word rather than as \"reflexive verbs are actions done to oneself\" — that definition only covers the first job.",
          forms: [
            { it: "si lavò le mani", gloss: "he washed his hands", note: "True reflexive — the action returns to the doer." },
            { it: "si saziarono", gloss: "they were satisfied", note: "Change of state, not an action done to oneself." },
            { it: "si fece carne", gloss: "he became flesh", note: "Middle voice — a becoming, no agent." },
            { it: "si dice che", gloss: "it is said that", note: "Impersonal — the agent is deliberately nobody." },
          ],
        },
        prompt: {
          it: "Un uomo si è avvicinato a Gesù e ha chiesto: \"Chi è il mio prossimo?\" Gesù ha raccontato la storia del buon samaritano.",
          en: 'Retell the Good Samaritan parable in Italian. Who stopped? Who passed by?',
        },
      },
      {
        n: 14, d: 'Jul 13-19', r: 'Luke 12-13', b: 'Future tense', review: false,
        vocab: [
          ['la ricchezza', 'wealth', 'la vita non dipende dalla ricchezza', '/la ɾikˈkɛttsa/', { exEn: "life does not depend on wealth" }],
          ['il granaio', 'granary', 'costruirò granai più grandi', '/il ɡɾaˈnaːjo/', { exEn: "I will build bigger barns", form: "granai" }],
          ['preoccuparsi', 'to worry', 'non preoccupatevi per la vita', '/pɾeokkuˈpaɾsi/', { exEn: "do not worry about your life", form: "preoccupatevi" }],
          ['il fico', 'fig tree', 'un uomo aveva un fico', '/il ˈfiːko/', { exEn: "a man had a fig tree", form: "fico" }],
          ['la porta stretta', 'narrow gate', 'entrate per la porta stretta', '/la ˈpɔɾta ˈstɾɛtta/', { exEn: "enter through the narrow gate", form: "porta stretta" }],
          ["l'ipocrita", 'hypocrite', 'ipocriti!', '/liˈpɔːkɾita/', { exEn: "hypocrites!", form: "ipocriti" }],
          ['il regno di Dio', 'kingdom of God', 'il regno di Dio è vicino', '/il ˈɾeɲɲo di ˈdiːo/', { exEn: "the kingdom of God is near" }],
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
          ['il banchetto', 'banquet', 'diede un grande banchetto', '/il baŋˈkɛtto/', { exEn: "he gave a great banquet" }],
          ["l'invitato", 'guest', 'gli invitati non vennero', '/linviˈtaːto/', { exEn: "the guests did not come", form: "invitati" }],
          ['la pecora perduta', 'lost sheep', 'se perde una delle cento pecore', '/la ˈpɛːkoɾa peɾˈduːta/', { exEn: "if he loses one of the hundred sheep" }],
          ['il figlio prodigo', 'prodigal son', 'il figlio minore', '/il ˈfiʎʎo ˈpɾɔːdiɡo/', { exEn: "the younger son" }],
          ['il padre misericordioso', 'merciful father', 'gli corse incontro', '/il ˈpaːdɾe mizeɾikoɾˈdjoːzo/', { exEn: "he ran to meet him" }],
          ['abbracciare', 'to embrace', 'lo abbracciò e lo baciò', '/abbɾatˈtʃaːɾe/', { exEn: "he embraced him and kissed him", form: "abbracciò" }],
          ['la festa', 'the celebration', 'facciamo festa', '/la ˈfɛsta/', { exEn: "let us celebrate", form: "festa" }],
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
          ['la gratitudine', 'gratitude', 'il samaritano ha reso grazie', '/la ɡɾatiˈtuːdine/', { exEn: "the Samaritan gave thanks" }],
          ["l'umiltà", 'humility', 'chi si umilia sarà esaltato', '/lumiˈlta/', { exEn: "whoever humbles himself will be exalted" }],
          ['il giudice', 'judge', 'il giudice ingiusto', '/il ˈdʒuːditʃe/', { exEn: "the unjust judge" }],
          ['la vedova', 'widow', 'la vedova veniva da lui', '/la ˈvɛːdova/', { exEn: "the widow kept coming to him" }],
          ['il pubblicano', 'tax collector', 'il pubblicano non osava', '/il pubbliˈkaːno/', { exEn: "the tax collector did not dare" }],
          ['la fede', 'faith', 'la tua fede ti ha salvato', '/la ˈfɛːde/', { exEn: "your faith has saved you" }],
          ['i bambini', 'children', 'lasciate che i bambini vengano', '/i bamˈbiːni/', { exEn: "let the children come" }],
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
          ['Zaccheo', 'Zacchaeus', 'Zaccheo era un pubblicano ricco', '/zakˈkɛːo/', { exEn: "Zacchaeus was a rich tax collector" }],
          ['la salvezza', 'salvation', 'oggi la salvezza è entrata in questa casa', '/la salˈvɛttsa/', { exEn: "today salvation has come to this house" }],
          ['il tempio', 'temple', 'purificò il tempio', '/il ˈtɛmpjo/', { exEn: "he cleansed the temple", form: "tempio" }],
          ["l'asino", 'donkey', 'trovate un asino', '/ˈlaːzino/', { exEn: "you will find a donkey", form: "asino" }],
          ['la moneta', 'coin', 'la moneta della vedova', '/la moˈnɛːta/', { exEn: "the widow’s coin" }],
          ['vigilare', 'to watch', 'vigilate e pregate', '/vidʒiˈlaːɾe/', { exEn: "watch and pray", form: "vigilate" }],
          ['la distruzione', 'destruction', 'distruggeranno i tuoi nemici', '/la distɾutˈtsjone/', { exEn: "your enemies will destroy you" }],
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
          ['il tradimento', 'betrayal', 'Giuda lo consegnò', '/il tɾadiˈmento/', { exEn: "Judas handed him over" }],
          ["l'ultima cena", 'Last Supper', 'diede loro il pane', '/ˈlultima ˈtʃɛːna/', { exEn: "he gave them the bread" }],
          ['il calice', 'chalice/cup', 'questo calice è la nuova alleanza', '/il ˈkaːlitʃe/', { exEn: "this cup is the new covenant" }],
          ['la passione', 'passion/suffering', 'la passione di Cristo', '/la pasˈsjone/', { exEn: "the Passion of Christ" }],
          ['Emmaus', 'Emmaus', 'la strada di Emmaus', '/emˈmaus/', { exEn: "the road to Emmaus" }],
          ["l'ascensione", 'ascension', 'fu portato in cielo', '/laʃʃenˈsjone/', { exEn: "he was carried up into heaven" }],
          ['la benedizione', 'blessing', 'li benedì e si allontanò', '/la benediˈtsjone/', { exEn: "he blessed them and withdrew" }],
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
          ["l'ascensione", 'ascension', 'fu elevato in alto', '/laʃʃenˈsjone/', { exEn: "he was lifted up on high" }],
          ['la Pentecoste', 'Pentecost', 'il giorno di Pentecoste', '/la penteˈkɔste/', { exEn: "the day of Pentecost" }],
          ['lo Spirito Santo', 'Holy Spirit', 'furono tutti pieni di Spirito Santo', '/lo ˈspiːɾito ˈsanto/', { exEn: "they were all filled with the Holy Spirit", form: "Spirito Santo" }],
          ['le lingue di fuoco', 'tongues of fire', 'lingue come di fuoco', '/le ˈliŋɡwe di ˈfwɔːko/', { exEn: "tongues as of fire" }],
          ['battezzarsi', 'to be baptized', 'battezzatevi', '/battedˈdzaɾsi/', { exEn: "be baptized", form: "battezzatevi" }],
          ['il peccato', 'sin', 'per la remissione dei peccati', '/il pekˈkaːto/', { exEn: "for the forgiveness of sins", form: "peccati" }],
          ['la comunità', 'community', 'erano assidui nella comunione', '/la komuniˈta/', { exEn: "they devoted themselves to the fellowship" }],
        ],
        grammar: {
          title: 'Congiuntivo — the subjunctive mood',
          body: 'Used to express doubt, desire, emotion, or necessity after certain conjunctions: "affinché" (so that), "sebbene" (although), "prima che" (before). The goal this week is recognition — find three subjunctive constructions in Acts 1-3.',
        },
        exegesis: {
          title: "The mood you already pray in",
          body: "You have been saying the congiuntivo your whole life without knowing it. \"Sia santificato il tuo nome. Venga il tuo regno. Sia fatta la tua volontà.\" Three jussive subjunctives in a row. Notice what they are NOT: not futures (\"your kingdom will come\" — a prediction), and not imperatives (\"bring your kingdom\" — an order). They are petitions that something come to pass, spoken by someone with no power to bring it about. That is the exact semantic range of the Italian subjunctive: not what is, but what is wished, doubted, feared, or hoped. Every time the course asks you for a congiuntivo from here on, the Pater Noster is the paradigm you already have memorized.",
          forms: [
            { it: "sia santificato", gloss: "hallowed be", note: "A wish, not a statement of fact." },
            { it: "venga", gloss: "may it come", note: "Compare the indicative \"viene\" — it comes." },
            { it: "verrà", gloss: "it will come", note: "Future indicative — a prediction. Not what the prayer says." },
          ],
        },
        prompt: {
          it: 'Pietro si alzò e ha parlato alla folla: "Pentitevi e ognuno di voi sia battezzato nel nome di Gesù Cristo."',
          en: "Write Peter's Pentecost sermon in summary. What was his message? How did people respond?",
        },
      },
      {
        n: 20, d: 'Aug 24-30', r: 'Acts 4-6', b: 'Subjunctive with doubt and opinion', review: false,
        vocab: [
          ['la guarigione', 'healing', 'la guarigione dello storpio', '/la ɡwaɾiˈdʒone/', { exEn: "the healing of the lame man" }],
          ['la prigione', 'prison', 'li gettarono in prigione', '/la pɾiˈdʒone/', { exEn: "they threw them into prison", form: "prigione" }],
          ['Anania', 'Ananias', 'Anania con Saffira sua moglie', '/aˈnaːnja/', { exEn: "Ananias with Sapphira his wife" }],
          ['mentire', 'to lie', 'hai mentito allo Spirito Santo', '/menˈtiːɾe/', { exEn: "you have lied to the Holy Spirit", form: "mentito" }],
          ['i diaconi', 'deacons', 'scelsero sette uomini', '/i ˈdjaːkoni/', { exEn: "they chose seven men" }],
          ['Stefano', 'Stephen', 'Stefano era pieno di grazia', '/ˈstɛːfano/', { exEn: "Stephen was full of grace" }],
          ['la persecuzione', 'persecution', 'scoppiò una grande persecuzione', '/la peɾsekutˈtsjone/', { exEn: "a great persecution broke out", form: "persecuzione" }],
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
          ['il martirio', 'martyrdom', 'la morte di Stefano', '/il maɾˈtiːɾjo/', { exEn: "the death of Stephen" }],
          ['la lapidazione', 'stoning', 'lo lapidavano', '/la lapidaˈtsjone/', { exEn: "they were stoning him" }],
          ['Saulo', 'Saul', 'Saulo approvava la sua uccisione', '/ˈsaulo/', { exEn: "Saul approved of his killing" }],
          ['la conversione', 'conversion', 'la conversione di Paolo', '/la konveɾˈsjone/', { exEn: "the conversion of Paul" }],
          ['la via di Damasco', 'road to Damascus', 'sulla via di Damasco', '/la ˈviːa di daˈmasko/', { exEn: "on the road to Damascus", form: "via di Damasco" }],
          ['cieco', 'blind', 'per tre giorni non vide nulla', '/ˈtʃɛːko/', { exEn: "for three days he saw nothing" }],
          ['il battesimo', 'baptism', 'fu battezzato', '/il batˈtɛːzimo/', { exEn: "he was baptized" }],
        ],
        grammar: {
          title: 'Voce passiva — the passive voice',
          body: 'Active: "Pietro ha guarito il cieco." Passive: "Il cieco è stato guarito da Pietro." Formed with essere + past participle. The participle agrees with the subject in gender and number.',
        },
        exegesis: {
          title: "The passive that hides God on purpose",
          body: "Scripture is the reason the passive voice matters. The divine passive (passivum divinum) is a reverence idiom in which God is the deliberately unnamed agent: \"i vostri peccati sono perdonati\" — forgiven, by someone the sentence refuses to name. \"Sarà dato\" — it will be given. The grammar is doing theology: naming God directly is avoided, but the agent is unmistakable. Italian gives you two ways to build it, and choosing between them is a real lesson. \"Essere + participio\" allows an agent to be added with \"da\" but does not require one. The \"si passivante\" — \"si perdonano i peccati\" — makes stating an agent structurally impossible. The second construction has no English counterpart at all, which is why it is usually taught as a dry transformation exercise. Here it has a reason to exist.",
          forms: [
            { it: "sono perdonati", gloss: "they are forgiven", note: "Agent suppressible — the divine passive." },
            { it: "è stato guarito da Pietro", gloss: "he was healed by Peter", note: "Agent stated with \"da\"." },
            { it: "si perdonano i peccati", gloss: "sins are forgiven", note: "si passivante — no agent can be named." },
          ],
        },
        prompt: {
          it: 'Saulo cadde a terra e sentì una voce: "Saulo, Saulo, perché mi perseguiti?" Era Gesù che gli parlava.',
          en: "Write Paul's conversion on the road to Damascus from his own perspective.",
        },
      },
      {
        n: 22, d: 'Sep 7-13', r: 'Acts 10-12', b: 'Gerund: stare + gerundio', review: false,
        vocab: [
          ['la visione', 'vision', 'Pietro ebbe una visione', '/la viˈzjone/', { exEn: "Peter had a vision" }],
          ['Cornelio', 'Cornelius', 'il centurione Cornelio', '/koɾˈnɛːljo/', { exEn: "the centurion Cornelius" }],
          ['i pagani', 'Gentiles', 'il vangelo anche ai pagani', '/i paˈɡaːni/', { exEn: "the gospel to the Gentiles too" }],
          ['il battesimo', 'baptism', 'chi può impedire il battesimo?', '/il batˈtɛːzimo/', { exEn: "who can prevent the baptism?" }],
          ["l'angelo", 'angel', 'un angelo del Signore apparve', '/ˈlandʒelo/', { exEn: "an angel of the Lord appeared", form: "angelo" }],
          ['il carcere', 'prison', 'Pietro era in carcere', '/il ˈkaɾtʃeɾe/', { exEn: "Peter was in prison", form: "carcere" }],
          ['Erode', 'Herod', 'Erode lo aveva arrestato', '/eˈɾɔːde/', { exEn: "Herod had arrested him" }],
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
          ['il viaggio missionario', 'missionary journey', 'il primo viaggio', '/il ˈvjaddʒo missjoˈnaːɾjo/', { exEn: "the first journey" }],
          ['Barnaba', 'Barnabas', 'Barnaba e Paolo', '/ˈbaɾnaba/', { exEn: "Barnabas and Paul" }],
          ['la sinagoga', 'synagogue', 'entrarono nella sinagoga', '/la sinaˈɡɔːɡa/', { exEn: "they entered the synagogue", form: "sinagoga" }],
          ['il concilio', 'council', 'il concilio di Gerusalemme', '/il konˈtʃiːljo/', { exEn: "the Council of Jerusalem" }],
          ['la circoncisione', 'circumcision', 'la questione della circoncisione', '/la tʃiɾkontʃiˈzjone/', { exEn: "the question of circumcision", form: "circoncisione" }],
          ['la grazia', 'grace', 'vivere nella grazia di Dio', '/la ˈɡɾattsja/', { exEn: "to live in the grace of God", form: "grazia" }],
          ['annunciare', 'to announce', 'annunciarono la parola di Dio', '/annuntˈtʃaːɾe/', { exEn: "they proclaimed the word of God", form: "annunciarono" }],
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
          ['Lidia', 'Lydia', 'Lidia apriva il cuore', '/ˈliːdja/', { exEn: "Lydia opened her heart" }],
          ['il terremoto', 'earthquake', 'ci fu un gran terremoto', '/il teɾɾeˈmɔːto/', { exEn: "there was a great earthquake", form: "terremoto" }],
          ['il carcere', 'prison', 'il custode del carcere', '/il ˈkaɾtʃeɾe/', { exEn: "the keeper of the prison", form: "carcere" }],
          ['Corinto', 'Corinth', 'giunsero a Corinto', '/koˈɾinto/', { exEn: "they arrived at Corinth" }],
          ["l'Areopago", 'Areopagus', "in mezzo all'Areopago", '/laɾeˈɔːpaɡo/', { exEn: "in the middle of the Areopagus", form: "Areopago" }],
          ['il missionario', 'missionary', 'missionari instancabili', '/il missjoˈnaːɾjo/', { exEn: "tireless missionaries", form: "missionari" }],
          ['la sinagoga', 'synagogue', 'ogni sabato nella sinagoga', '/la sinaˈɡɔːɡa/', { exEn: "every Sabbath in the synagogue", form: "sinagoga" }],
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
          ['la magia', 'magic', 'bruciarono i libri di magia', '/la ˈmaːdʒa/', { exEn: "they burned the books of magic", form: "magia" }],
          ['il tumulto', 'riot', 'il tumulto degli artigiani', '/il tuˈmulto/', { exEn: "the riot of the craftsmen" }],
          ["l'argentiere", 'silversmith', "Demetrio l'argentiere", '/laɾdʒenˈtjɛːɾe/', { exEn: "Demetrius the silversmith" }],
          ['la profezia', 'prophecy', 'aveva quattro figlie profetesse', '/la pɾofeˈtsiːa/', { exEn: "he had four prophesying daughters" }],
          ['legare', 'to bind', 'lo legheranno e lo consegneranno', '/leˈɡaːɾe/', { exEn: "they will bind him and hand him over", form: "legheranno" }],
          ['il viaggio', 'the journey', 'ci imbarcammo', '/il ˈvjaddʒo/', { exEn: "we set sail" }],
          ['lo Spirito', 'the Spirit', 'lo Spirito Santo mi attesta', '/lo ˈspiːɾito/', { exEn: "the Holy Spirit testifies to me", form: "Spirito" }],
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
          ['la difesa', 'defense', 'la difesa di Paolo', '/la diˈfeːza/', { exEn: "Paul’s defense" }],
          ['il sinedrio', 'Sanhedrin', 'davanti al sinedrio', '/il siˈnɛːdɾjo/', { exEn: "before the Sanhedrin", form: "sinedrio" }],
          ['la congiura', 'conspiracy', 'una congiura contro Paolo', '/la konˈdʒuːɾa/', { exEn: "a conspiracy against Paul", form: "congiura" }],
          ['il governatore', 'governor', 'il governatore Felice', '/il ɡoveɾnaˈtoːɾe/', { exEn: "the governor Felix" }],
          ['il processo', 'trial', 'durante il processo', '/il pɾoˈtʃɛsso/', { exEn: "during the trial", form: "processo" }],
          ['il testimone', 'witness', 'sono testimone di queste cose', '/il testiˈmoːne/', { exEn: "I am a witness of these things", form: "testimone" }],
          ["l'accusa", 'accusation', 'le accuse contro Paolo', '/lakˈkuːza/', { exEn: "the charges against Paul", form: "accuse" }],
        ],
        grammar: {
          title: 'Registro formale vs informale',
          body: "Paul's speeches are formal public oratory — longer sentences, subjunctive, elevated vocabulary. Notice how Paul addresses different audiences (Jewish crowd vs Roman governor) and shifts his vocabulary accordingly.",
        },
        exegesis: {
          title: "Why God is always \"tu\"",
          body: "Italian has a formal register you must use with a stranger, a shopkeeper, a bank clerk, an official: \"Lei\", which is grammatically third person. Getting it wrong is a real social error. And yet Italian devotional language addresses God exclusively with the informal \"tu\". \"Padre nostro, che SEI nei cieli\" — second person singular, the form you use with a close friend or a child. \"Il Signore è con TE.\" \"Sia santificato il TUO nome.\" This is not archaism, it is a deliberate theological statement encoded in a pronoun: God is not addressed at the distance you would give a magistrate. Paul, meanwhile, shifts register constantly across Acts 22–26 depending on whether he faces a Jewish crowd or a Roman governor. Watch the pronouns and you can hear who he thinks he is talking to.",
          forms: [
            { it: "che sei nei cieli", gloss: "who art in heaven", note: "Informal tu — intimacy, not distance." },
            { it: "Lei è romano?", gloss: "Are you Roman? (formal)", note: "Third person singular used as polite address." },
          ],
        },
        prompt: {
          it: 'Paolo disse: "Sono cittadino romano." Il tribuno domandò: "Tu sei romano?" E Paolo rispose: "Sì."',
          en: "Write Paul's defense before Felix in Acts 24. What charges were made? How did Paul respond?",
        },
      },
      {
        n: 27, d: 'Oct 12-18', r: 'Acts 25-26', b: 'Complex sentence patterns', review: false,
        vocab: [
          ['Festo', 'Festus', 'il governatore Festo', '/ˈfɛsto/', { exEn: "the governor Festus" }],
          ['Agrippa', 'Agrippa', 'il re Agrippa', '/aˈɡɾippa/', { exEn: "King Agrippa" }],
          ["l'appello", 'appeal', 'ho fatto appello a Cesare', '/lapˈpɛllo/', { exEn: "I have appealed to Caesar", form: "appello" }],
          ['la testimonianza', 'testimony', 'la mia testimonianza', '/la testimonˈjantsa/', { exEn: "my testimony", form: "testimonianza" }],
          ['convertirsi', 'to convert', 'perché si convertissero', '/konveɾˈtiɾsi/', { exEn: "so that they might turn", form: "si convertissero" }],
          ['la luce', 'light', 'una luce dal cielo', '/la ˈluːtʃe/', { exEn: "a light from heaven", form: "luce" }],
          ['la grazia', 'grace', 'grazie alla grazia di Dio', '/la ˈɡɾattsja/', { exEn: "thanks to the grace of God", form: "grazia" }],
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
          ['il naufragio', 'shipwreck', 'il naufragio di Paolo', '/il nawˈfɾaːdʒo/', { exEn: "Paul’s shipwreck" }],
          ["l'isola", 'island', "l'isola di Malta", '/ˈliːzola/', { exEn: "the island of Malta" }],
          ['il serpente', 'snake', 'una vipera uscì dal fuoco', '/il seɾˈpɛnte/', { exEn: "a viper came out of the fire" }],
          ['Roma', 'Rome', 'finalmente arrivammo a Roma', '/ˈɾɔːma/', { exEn: "at last we arrived at Rome" }],
          ['predicare', 'to preach', 'predicava il regno di Dio', '/pɾediˈkaːɾe/', { exEn: "he was preaching the kingdom of God", form: "predicava" }],
          ["l'impedimento", 'hindrance', 'senza impedimento alcuno', '/limpediˈmento/', { exEn: "without any hindrance", form: "impedimento" }],
          ['la nave', 'ship', 'la nave si incagliò', '/la ˈnaːve/', { exEn: "the ship ran aground" }],
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
          ['il vangelo', 'the gospel', 'il vangelo di Gesù Cristo', '/il vanˈdʒɛːlo/', { exEn: "the gospel of Jesus Christ" }],
          ['la giustizia', 'righteousness', 'la giustizia di Dio', '/la dʒusˈtiːttsja/', { exEn: "the righteousness of God" }],
          ['il giudizio', 'judgment', 'il giudizio di Dio', '/il dʒuˈdiːttsjo/', { exEn: "the judgment of God" }],
          ["l'ira", 'wrath', "l'ira di Dio", '/ˈliːɾa/', { exEn: "the wrath of God" }],
          ["l'idolatria", 'idolatry', "caduti nell'idolatria", '/lidolaˈtɾiːa/', { exEn: "fallen into idolatry", form: "idolatria" }],
          ["l'albero", 'tree', 'come albero piantato', '/ˈlalbeɾo/', { exEn: "like a tree planted", form: "albero" }],
          ['il cammino', 'the way/path', 'non cammina nel consiglio degli empi', '/il kamˈmiːno/', { exEn: "he does not walk in the counsel of the wicked", form: "cammina" }],
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
          ['la fede', 'faith', 'giustificati per fede', '/la ˈfɛːde/', { exEn: "justified by faith", form: "fede" }],
          ['la grazia', 'grace', 'per pura grazia', '/la ˈɡɾattsja/', { exEn: "by grace alone", form: "grazia" }],
          ['la redenzione', 'redemption', 'la redenzione in Cristo', '/la ɾedenˈtsjone/', { exEn: "the redemption in Christ" }],
          ['il pastore', 'shepherd', 'il Signore è il mio pastore', '/il pasˈtoːɾe/', { exEn: "the Lord is my shepherd" }],
          ["l'abbondanza", 'abundance', 'non manco di nulla', '/labbonˈdantsa/', { exEn: "I shall not want" }],
          ['il calice', 'cup', 'il mio calice trabocca', '/il ˈkaːlitʃe/', { exEn: "my cup overflows" }],
          ['la tenebrosa valle', 'dark valley', 'nella valle oscura', '/la tenebˈɾoːza ˈvalle/', { exEn: "in the dark valley" }],
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
          ['la pace', 'peace', 'abbiamo pace con Dio', '/la ˈpaːtʃe/', { exEn: "we have peace with God", form: "pace" }],
          ['la sofferenza', 'suffering', 'glorificarci nelle sofferenze', '/la soffeˈɾɛntsa/', { exEn: "to boast in our sufferings", form: "sofferenze" }],
          ['la speranza', 'hope', 'la speranza non delude', '/la speˈɾantsa/', { exEn: "hope does not disappoint" }],
          ['il rifugio', 'refuge', 'Dio è il nostro rifugio', '/il ɾiˈfuːdʒo/', { exEn: "God is our refuge" }],
          ['la forza', 'strength', 'la nostra forza', '/la ˈfoɾtsa/', { exEn: "our strength" }],
          ['il battesimo', 'baptism', 'siamo stati battezzati in Cristo', '/il batˈtɛːzimo/', { exEn: "we were baptized into Christ" }],
          ['la morte', 'death', 'morti al peccato', '/la ˈmɔɾte/', { exEn: "dead to sin" }],
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
          ['la carne', 'flesh', 'la legge della carne', '/la ˈkaɾne/', { exEn: "the law of the flesh", form: "carne" }],
          ['la condanna', 'condemnation', 'nessuna condanna per quelli in Cristo', '/la konˈdanna/', { exEn: "no condemnation for those in Christ", form: "condanna" }],
          ['la figliolanza', 'sonship', 'lo spirito di adozione filiale', '/la fiʎʎoˈlantsa/', { exEn: "the spirit of adoption as sons" }],
          ['la creazione', 'creation', 'tutta la creazione geme', '/la kɾeaˈtsjone/', { exEn: "all creation groans", form: "creazione" }],
          ['la misericordia', 'mercy', 'abbi pietà di me', '/la mizeɾiˈkɔɾdja/', { exEn: "have mercy on me" }],
          ['il cuore', 'heart', 'crea in me un cuore puro', '/il ˈkwɔːɾe/', { exEn: "create in me a pure heart" }],
          ['il peccato', 'sin', 'mondami dalla mia colpa', '/il pekˈkaːto/', { exEn: "cleanse me from my guilt" }],
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
          ["l'elezione", 'election', "l'elezione per grazia", '/leletˈtsjone/', { exEn: "the election by grace", form: "elezione" }],
          ['confessare', 'to confess', 'confessa con la tua bocca', '/konfesˈsaːɾe/', { exEn: "confess with your mouth", form: "confessa" }],
          ['credere nel cuore', 'believe in heart', 'credere nel cuore', '/ˈkɾɛːdeɾe nel ˈkwɔːɾe/', { exEn: "to believe in the heart" }],
          ['la protezione', 'protection', 'sotto la sua protezione', '/la pɾotetˈtsjone/', { exEn: "under his protection", form: "protezione" }],
          ['il nome del Signore', 'name of the Lord', 'chiunque invoca il nome del Signore', '/il ˈnoːme del siˈɲɲoːɾe/', { exEn: "whoever calls on the name of the Lord", form: "nome del Signore" }],
          ['essere salvato', 'to be saved', 'sarà salvato', '/ˈɛsseɾe salˈvaːto/', { exEn: "he will be saved", form: "salvato" }],
          ['il messaggero', 'messenger', 'come udranno senza un messaggero?', '/il messadˈdʒɛːɾo/', { exEn: "how will they hear without a messenger?", form: "messaggero" }],
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
          ['il mistero', 'mystery', 'il mistero di Israele', '/il misˈtɛːɾo/', { exEn: "the mystery of Israel" }],
          ['il corpo di Cristo', 'body of Christ', 'un solo corpo in Cristo', '/il ˈkɔɾpo di ˈkɾisto/', { exEn: "one body in Christ" }],
          ['i doni', 'gifts', 'doni diversi secondo la grazia', '/i ˈdoːni/', { exEn: "different gifts according to grace", form: "doni" }],
          ['la Parola', 'the Word', 'la tua Parola è una lampada', '/la paˈɾɔːla/', { exEn: "your Word is a lamp", form: "Parola" }],
          ['il sentiero', 'path', 'luce sul mio sentiero', '/il senˈtjɛːɾo/', { exEn: "a light on my path", form: "sentiero" }],
          ['offrire', 'to offer', 'offrite i vostri corpi come sacrificio', '/ofˈfɾiːɾe/', { exEn: "offer your bodies as a sacrifice", form: "offrite" }],
          ['rinnovarsi', 'to be renewed', 'rinnovatevi nella mente', '/ɾinnoˈvaɾsi/', { exEn: "be renewed in your mind", form: "rinnovatevi" }],
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
          ["l'autorità", 'authority', "ogni persona sia sottomessa alle autorità", '/lautoɾiˈta/', { exEn: "let every person be subject to the authorities", form: "autorità" }],
          ['amare il prossimo', 'love neighbor', 'amerai il prossimo tuo', '/aˈmaːɾe il ˈpɾɔssimo/', { exEn: "you shall love your neighbour" }],
          ['la coscienza', 'conscience', 'secondo la propria coscienza', '/la koˈʃʃɛntsa/', { exEn: "according to one’s own conscience", form: "coscienza" }],
          ['il soccorso', 'help', 'il mio soccorso viene dal Signore', '/il sokˈkɔɾso/', { exEn: "my help comes from the Lord" }],
          ['vegliare', 'to watch over', 'non si assopisce, non dorme', '/veʎˈʎaːɾe/', { exEn: "he does not slumber, he does not sleep" }],
          ['il custode', 'guardian', 'il Signore è il tuo custode', '/il kusˈtoːde/', { exEn: "the Lord is your keeper" }],
          ['il viaggio', 'journey', 'il Signore protegge la tua vita', '/il ˈvjaddʒo/', { exEn: "the Lord protects your life" }],
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
          ['la speranza', 'hope', 'il Dio della speranza', '/la speˈɾantsa/', { exEn: "the God of hope", form: "speranza" }],
          ["l'unità", 'unity', "l'unità tra ebrei e pagani", '/luniˈta/', { exEn: "the unity between Jews and Gentiles" }],
          ['i saluti', 'greetings', 'i saluti finali di Paolo', '/i saˈluːti/', { exEn: "Paul’s closing greetings" }],
          ['conoscere', 'to know', 'tu mi conosci', '/koˈnoʃʃeɾe/', { exEn: "you know me", form: "conosci" }],
          ['tessere', 'to weave', 'mi hai tessuto nel seno di mia madre', '/ˈtɛsseɾe/', { exEn: "you knit me together in my mother’s womb", form: "tessuto" }],
          ['fuggire', 'to flee', 'dove fuggirò dalla tua presenza?', '/fudˈdʒiːɾe/', { exEn: "where shall I flee from your presence?", form: "fuggirò" }],
          ['meraviglioso', 'wonderful', 'meravigliose sono le tue opere', '/meɾaviʎˈʎoːzo/', { exEn: "wonderful are your works", form: "meravigliose" }],
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
          ['lodare', 'to praise', 'lodate il Signore', '/loˈdaːɾe/', { exEn: "praise the Lord", form: "lodate" }],
          ["l'alleluja", 'alleluia', 'alleluia!', '/lalleˈluːja/', { exEn: "alleluia!", form: "alleluia" }],
          ['gli strumenti', 'instruments', "con la tromba, con l'arpa", '/ʎi stɾuˈmenti/', { exEn: "with the trumpet, with the harp" }],
          ['tutta la creazione', 'all creation', 'tutto ciò che respira', '/ˈtutta la kɾeaˈtsjone/', { exEn: "everything that breathes" }],
          ['la gloria', 'glory', 'gloria a Dio', '/la ˈɡlɔːɾja/', { exEn: "glory to God", form: "gloria" }],
          ['il Natale', 'Christmas', 'Buon Natale', '/il naˈtaːle/', { exEn: "Merry Christmas", form: "Natale" }],
          ['la fine', 'the end', 'sei arrivato alla fine', '/la ˈfiːne/', { exEn: "you have reached the end", form: "fine" }],
        ],
        grammar: {
          title: 'Celebrazione — you made it',
          body: 'Psalm 150 is six verses of pure praise, all imperative verbs: lodate (praise), lodatelo (praise him). You have spent 37 weeks learning to read Scripture in Italian. Read Psalm 150 aloud today — slowly, deliberately, in Italian.',
        },
        exegesis: {
          title: "One tense you were never taught — and read every day",
          body: "A closing note on a gap worth naming. The narrative spine of the CEI Gospels is the passato remoto: vinsero, nacque, patì, discese, risuscitò, salì, scoppiò, mangiarono, disse, fece. This course taught you the passato prossimo (weeks 8–10) and the imperfetto (week 11) and never taught the passato remoto at all. That is defensible for speaking — modern spoken Italian, especially in the north, uses it rarely. It is not defensible for reading, which is what you have done six days a week for 37 weeks. You do not need to produce these forms. You need to recognise them and map them back to the infinitive, and you already own a compact paradigm of the whole thing: the Apostles’ Creed in the Devotions tab is passato remoto from beginning to end. Read it once more and notice that you have been conjugating a tense nobody taught you.",
          forms: [
            { it: "disse", gloss: "he said", note: "dire — compare passato prossimo \"ha detto\"." },
            { it: "fece", gloss: "he made", note: "fare — compare \"ha fatto\"." },
            { it: "nacque", gloss: "he was born", note: "nascere — compare \"è nato\"." },
            { it: "vennero", gloss: "they came", note: "venire — compare \"sono venuti\"." },
          ],
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

// Merge the per-week exercises (drills/comprehension/passage) from exercises.js
// onto each week by its number, so component code reads them off the week object
// (week.drill, week.comprehension, week.passage) with no extra plumbing.
export const phases = rawPhases.map((phase) => ({
  ...phase,
  weeks: phase.weeks.map((week) => ({ ...week, ...(EXERCISES[week.n] || {}) })),
}));
