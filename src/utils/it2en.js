// Common Italian → English word lookup for inline gloss support.
// Covers function words, high-frequency verb forms, and common biblical nouns/adjectives
// that don't appear in the 259-word vocab index. Used by WordGloss for non-vocab words.

const MAP = new Map(Object.entries({
  // --- definite articles ---
  il: 'the', lo: 'the', la: 'the', i: 'the', gli: 'the', le: 'the',

  // --- indefinite articles ---
  un: 'a', una: 'a',

  // --- prepositions ---
  di: 'of', da: 'from', in: 'in', con: 'with', su: 'on', per: 'for',
  tra: 'between', fra: 'between', a: 'to', ad: 'to', verso: 'toward',
  attraverso: 'through', dopo: 'after', prima: 'before', durante: 'during',
  senza: 'without', contro: 'against', circa: 'about', oltre: 'beyond',
  presso: 'near', secondo: 'according to', sopra: 'above', sotto: 'under',
  dentro: 'inside', fuori: 'outside', fino: 'until', tranne: 'except',
  davanti: 'before/in front of', dietro: 'behind', accanto: 'beside',
  lungo: 'along',

  // --- contracted prepositions (prep + article) ---
  del: 'of the', dello: 'of the', della: 'of the', dei: 'of the',
  degli: 'of the', delle: 'of the',
  dal: 'from the', dallo: 'from the', dalla: 'from the', dai: 'from the',
  dagli: 'from the', dalle: 'from the',
  nel: 'in the', nello: 'in the', nella: 'in the', nei: 'in the',
  negli: 'in the', nelle: 'in the',
  sul: 'on the', sullo: 'on the', sulla: 'on the', sui: 'on the',
  sugli: 'on the', sulle: 'on the',
  al: 'at the', allo: 'at the', alla: 'at the', ai: 'at the',
  agli: 'at the', alle: 'at the',
  col: 'with the', coi: 'with the',

  // --- conjunctions ---
  e: 'and', ed: 'and', o: 'or', ma: 'but', però: 'but',
  quindi: 'therefore', perché: 'because', che: 'that', se: 'if',
  quando: 'when', come: 'as', mentre: 'while', affinché: 'so that',
  sebbene: 'although', benché: 'although', poiché: 'since', dunque: 'therefore',
  allora: 'then', tuttavia: 'however', oppure: 'or else', né: 'neither',
  anche: 'also', pure: 'also', perfino: 'even', persino: 'even',
  anzi: 'rather', cioè: 'that is', ossia: 'namely', ovvero: 'or rather',
  altrimenti: 'otherwise', nonostante: 'despite',
  giacché: 'since', sicché: 'so that', eppure: 'and yet',
  cosicché: 'so that', purché: 'provided that',

  // --- personal pronouns (lo/gli/le kept as articles above) ---
  io: 'I', tu: 'you', lui: 'he', lei: 'she', esso: 'it', essa: 'it',
  egli: 'he', ella: 'she',
  noi: 'we', voi: 'you', loro: 'they', essi: 'they', esse: 'they',
  me: 'me', te: 'you',
  mi: 'me', ti: 'you', si: 'himself', ci: 'us', vi: 'you',
  li: 'them', ne: 'of it',

  // --- possessive adjectives ---
  mio: 'my', mia: 'my', miei: 'my', mie: 'my',
  tuo: 'your', tua: 'your', tuoi: 'your', tue: 'your',
  suo: 'his/her', sua: 'his/her', suoi: 'his/her', sue: 'his/her',
  nostro: 'our', nostra: 'our', nostri: 'our', nostre: 'our',
  vostro: 'your (pl)', vostra: 'your (pl)', vostri: 'your (pl)', vostre: 'your (pl)',

  // --- demonstratives ---
  questo: 'this', questa: 'this', questi: 'these', queste: 'these',
  quello: 'that', quella: 'that', quelli: 'those', quelle: 'those',
  codesto: 'that', codesta: 'that',

  // --- relative / interrogative ---
  cui: 'which', quale: 'which', quali: 'which',
  chi: 'who', cosa: 'what', dove: 'where', quanto: 'how much', quanta: 'how much',

  // --- indefinite pronouns / adjectives ---
  tutto: 'all', tutta: 'all', tutti: 'all', tutte: 'all',
  ogni: 'every', ognuno: 'everyone', ognuna: 'everyone',
  nessuno: 'no one', nessuna: 'no',
  qualcuno: 'someone', qualcosa: 'something',
  chiunque: 'whoever', qualunque: 'whichever',
  altro: 'other', altra: 'other', altri: 'others', altre: 'others',
  stesso: 'same', stessa: 'same', stessi: 'same', stesse: 'same',
  tale: 'such', tali: 'such', tanto: 'so much', tanta: 'so much',
  tanti: 'so many', tante: 'so many', molto: 'much', molta: 'much',
  molti: 'many', molte: 'many', poco: 'little', poca: 'little',
  pochi: 'few', poche: 'few', troppo: 'too much', troppa: 'too much',
  troppi: 'too many', troppe: 'too many', alcuno: 'some', alcuna: 'any',
  alcuni: 'some', alcune: 'some', certo: 'certain', certa: 'certain',
  certi: 'certain', certe: 'certain', ciascuno: 'each', ciascuna: 'each',
  nessun: 'no', qualsiasi: 'any',

  // --- adverbs ---
  non: 'not', no: 'no', sì: 'yes', già: 'already',
  ancora: 'still', mai: 'never', sempre: 'always', spesso: 'often',
  qui: 'here', qua: 'here', là: 'there', lì: 'there',
  adesso: 'now', poi: 'then', subito: 'immediately',
  presto: 'soon', tardi: 'late', bene: 'well', male: 'badly',
  così: 'thus', davvero: 'truly', proprio: 'really', forse: 'perhaps',
  insieme: 'together', soltanto: 'only', solo: 'only', appena: 'just',
  quasi: 'almost', abbastanza: 'enough',
  naturalmente: 'naturally', certamente: 'certainly',
  sicuramente: 'surely', veramente: 'truly', finalmente: 'finally',
  principalmente: 'mainly', soprattutto: 'above all',
  particolarmente: 'particularly', specialmente: 'especially',
  volentieri: 'gladly', piuttosto: 'rather', invece: 'instead',
  neanche: 'not even', nemmeno: 'not even', neppure: 'not even',
  infatti: 'in fact',
  improvvisamente: 'suddenly', immediatamente: 'immediately',
  gradualmente: 'gradually', recentemente: 'recently',
  oggi: 'today', ieri: 'yesterday', domani: 'tomorrow',

  // --- numbers (sei/secondo handled in verb/preposition sections) ---
  uno: 'one', due: 'two', tre: 'three', quattro: 'four', cinque: 'five',
  sette: 'seven', otto: 'eight', nove: 'nine', dieci: 'ten',
  undici: 'eleven', dodici: 'twelve', quaranta: 'forty',
  venti: 'twenty', trenta: 'thirty',
  cento: 'one hundred', mille: 'one thousand', primo: 'first',
  terzo: 'third', quarto: 'fourth', quinto: 'fifth',

  // --- essere (to be) ---
  sono: 'am/are', sei: 'are', è: 'is', siamo: 'we are', siete: 'you are',
  era: 'was', eri: 'were', eravamo: 'we were', eravate: 'you were',
  erano: 'were', sarà: 'will be', saranno: 'will be', sarei: 'would be',
  sarò: 'I will be', sarai: 'you will be', sarete: 'you will be',
  fu: 'was', fui: 'was', furono: 'were', fosse: 'were', sia: 'be',
  siano: 'be', siate: 'be', essendo: 'being', stato: 'been', stata: 'been',
  stati: 'been', state: 'been', essere: 'to be',

  // --- avere (to have) ---
  ho: 'I have', hai: 'you have', ha: 'has', abbiamo: 'we have',
  avete: 'you have', hanno: 'they have', aveva: 'had', avevo: 'had',
  avevi: 'had', avevamo: 'had', avevano: 'had', avrà: 'will have',
  avranno: 'will have', avrò: 'I will have', avrai: 'you will have',
  ebbe: 'had', ebbero: 'had', avrebbe: 'would have', avrei: 'would have',
  abbia: 'have', abbiano: 'have', abbiate: 'have',
  avendo: 'having', avuto: 'had', avere: 'to have', aver: 'to have',

  // --- fare (to do/make) ---
  faccio: 'I do', fai: 'you do', fa: 'does', facciamo: 'we do',
  fate: 'you do', fanno: 'they do', fece: 'did', fecero: 'did',
  faceva: 'was doing', facevano: 'were doing', farà: 'will do',
  faranno: 'will do', farò: 'I will do', farebbe: 'would do',
  faccia: 'do', facciano: 'do', facendo: 'doing', fatto: 'done', fare: 'to do',

  // --- dire (to say) ---
  dico: 'I say', dici: 'you say', dice: 'says', diciamo: 'we say',
  dite: 'you say', dicono: 'they say', disse: 'said', dissero: 'said',
  diceva: 'was saying', dicevano: 'were saying', dirà: 'will say',
  dirò: 'I will say', direbbe: 'would say', dica: 'say', dicano: 'say',
  dicendo: 'saying', detto: 'said', dire: 'to say', dissi: 'I said',

  // --- andare (to go) ---
  vado: 'I go', vai: 'you go', va: 'goes', andiamo: 'we go',
  andate: 'you go', vanno: 'they go', andò: 'went', andarono: 'went',
  andava: 'was going', andavano: 'were going', andrà: 'will go',
  andranno: 'will go', andrei: 'would go', andrebbe: 'would go', vada: 'go',
  andando: 'going', andato: 'gone', andare: 'to go',

  // --- venire (to come) ---
  vengo: 'I come', vieni: 'you come', viene: 'comes', veniamo: 'we come',
  venite: 'you come', vengono: 'they come', venne: 'came', vennero: 'came',
  veniva: 'was coming', venivano: 'were coming', verrà: 'will come',
  verranno: 'will come', venga: 'come', venendo: 'coming',
  venuto: 'come', venire: 'to come', venuti: 'come',

  // --- dare (to give; dai = from the, conflicts as contracted prep) ---
  do: 'I give', dà: 'gives', diamo: 'we give',
  danno: 'they give', diede: 'gave', diedero: 'gave',
  dava: 'was giving', davano: 'were giving', darà: 'will give',
  darò: 'I will give', daranno: 'will give', darebbe: 'would give', dia: 'give',
  dando: 'giving', dato: 'given', dare: 'to give',

  // --- potere (can/be able; 'potere' as noun is in nouns below) ---
  posso: 'I can', puoi: 'you can', può: 'can', possiamo: 'we can',
  potete: 'you can', possono: 'they can', poteva: 'could', potevo: 'could',
  potevano: 'could', potrà: 'will be able', potrò: 'will be able',
  potrebbe: 'could', possa: 'can', potendo: 'being able', potuto: 'been able',
  potevate: 'you could', potranno: 'they will be able',

  // --- volere (to want) ---
  voglio: 'I want', vuoi: 'you want', vuole: 'wants', vogliamo: 'we want',
  volete: 'you want', vogliono: 'they want', voleva: 'wanted', volevo: 'wanted',
  volevano: 'wanted', vorrà: 'will want', vorrò: 'I will want',
  vorrebbe: 'would want', voglia: 'want', volendo: 'wanting',
  voluto: 'wanted', volere: 'to want',

  // --- dovere (must/have to) ---
  devo: 'I must', devi: 'you must', deve: 'must', dobbiamo: 'we must',
  dovete: 'you must', devono: 'they must', doveva: 'had to', dovevo: 'had to',
  dovevano: 'had to', dovrà: 'will have to', dovrò: 'will have to',
  dovrebbe: 'should', debba: 'must', dovendo: 'having to',
  dovuto: 'had to', dovere: 'to have to',

  // --- sapere (to know) ---
  so: 'I know', sai: 'you know', sa: 'knows', sappiamo: 'we know',
  sapete: 'you know', sanno: 'they know', sapeva: 'knew', sapevo: 'knew',
  sapevano: 'knew', saprà: 'will know', saprò: 'I will know',
  saprebbe: 'would know', sappia: 'know', sapendo: 'knowing',
  saputo: 'known', sapere: 'to know',

  // --- stare (to stay/be; 'state' already in essere above) ---
  sto: 'I am', stai: 'you are', sta: 'is', stiamo: 'we are',
  stanno: 'they are', stava: 'was', stavo: 'was',
  stavano: 'were', starà: 'will be',
  stia: 'be', stando: 'being', rimasto: 'stayed', stare: 'to be',

  // --- vedere (to see) ---
  vedo: 'I see', vedi: 'you see', vede: 'sees', vediamo: 'we see',
  vedete: 'you see', vedono: 'they see', vide: 'saw', videro: 'saw',
  vedeva: 'was seeing', vedevano: 'were seeing', vedrà: 'will see',
  vedrò: 'I will see', vedrebbe: 'would see', veda: 'see',
  vedendo: 'seeing', visto: 'seen', vedere: 'to see', vedessi: 'you saw',

  // --- parlare (to speak) ---
  parlo: 'I speak', parli: 'you speak', parla: 'speaks', parliamo: 'we speak',
  parlate: 'you speak', parlano: 'they speak', parlò: 'spoke', parlarono: 'spoke',
  parlava: 'spoke', parlavano: 'spoke', parlerà: 'will speak',
  parlando: 'speaking', parlato: 'spoken', parlare: 'to speak',

  // --- chiamare (to call) ---
  chiamo: 'I call', chiami: 'you call', chiama: 'calls', chiamiamo: 'we call',
  chiamate: 'you call', chiamano: 'they call', chiamò: 'called', chiamarono: 'called',
  chiamava: 'called', chiamerà: 'will call', chiamando: 'calling',
  chiamato: 'called', chiamati: 'called', chiamare: 'to call',

  // --- trovare (to find) ---
  trovo: 'I find', trovi: 'you find', trova: 'finds', troviamo: 'we find',
  trovate: 'you find', trovano: 'they find', trovò: 'found', trovarono: 'found',
  trovava: 'was finding', troverà: 'will find', trovando: 'finding',
  trovato: 'found', trovare: 'to find',

  // --- amare (to love; amato/amate as 'beloved' are in adjectives below) ---
  amo: 'I love', ami: 'you love', ama: 'loves', amiamo: 'we love',
  amate: 'you love', amano: 'they love', amò: 'loved', amarono: 'loved',
  amava: 'loved', amerà: 'will love', amando: 'loving', amare: 'to love',
  amatevi: 'love one another', amerai: 'you shall love', amiate: 'you love',

  // --- credere (to believe) ---
  credo: 'I believe', credi: 'you believe', crede: 'believes', crediamo: 'we believe',
  credete: 'you believe', credono: 'they believe', credette: 'believed',
  credettero: 'believed', credevano: 'believed', crederà: 'will believe',
  credendo: 'believing', creduto: 'believed', credere: 'to believe',
  crederai: 'you will believe', credenti: 'believers',

  // --- sentire (to hear/feel) ---
  sento: 'I hear', senti: 'you hear', sente: 'hears', sentiamo: 'we hear',
  sentite: 'you hear', sentono: 'they hear', sentì: 'heard', sentirono: 'heard',
  sentiva: 'heard', sentirà: 'will hear', sentendo: 'hearing',
  sentito: 'heard', sentire: 'to hear',

  // --- seguire (to follow) ---
  seguo: 'I follow', segui: 'you follow', segue: 'follows', seguiamo: 'we follow',
  seguite: 'you follow', seguono: 'they follow', seguì: 'followed',
  seguiva: 'followed', seguivano: 'followed', seguirà: 'will follow',
  seguendo: 'following', seguito: 'followed', seguire: 'to follow',

  // --- entrare (to enter) ---
  entro: 'I enter', entri: 'you enter', entra: 'enters', entriamo: 'we enter',
  entrate: 'you enter', entrano: 'they enter', entrò: 'entered',
  entrava: 'was entering', entrerà: 'will enter', entrando: 'entering',
  entrato: 'entered', entrare: 'to enter', entrata: 'entrance',

  // --- uscire (to go out) ---
  esco: 'I go out', esci: 'you go out', esce: 'goes out', usciamo: 'we go out',
  uscite: 'you go out', escono: 'they go out', uscì: 'went out',
  usciva: 'was going out', uscirà: 'will go out', uscendo: 'going out',
  uscito: 'gone out', uscire: 'to go out',

  // --- mettere (to put) ---
  metto: 'I put', metti: 'you put', mette: 'puts', mettiamo: 'we put',
  mettete: 'you put', mettono: 'they put', mise: 'put', misero: 'put',
  metteva: 'was putting', metterà: 'will put', mettendo: 'putting',
  messo: 'put', mettere: 'to put',

  // --- prendere (to take) ---
  prendo: 'I take', prendi: 'you take', prende: 'takes', prendiamo: 'we take',
  prendete: 'you take', prendono: 'they take', prese: 'took', presero: 'took',
  presi: 'took', prendeva: 'was taking', prenderà: 'will take',
  prendendo: 'taking', preso: 'taken', prendere: 'to take',

  // --- portare (to bring/carry; porta as 'door' is in nouns below) ---
  porto: 'I bring', porti: 'you bring', portiamo: 'we bring',
  portate: 'you bring', portano: 'they bring', portò: 'brought', portarono: 'brought',
  portava: 'brought', porterà: 'will bring', portando: 'bringing',
  portato: 'brought', portare: 'to bring',

  // --- mandare (to send) ---
  mando: 'I send', mandi: 'you send', manda: 'sends', mandiamo: 'we send',
  mandate: 'you send', mandano: 'they send', mandò: 'sent', mandarono: 'sent',
  mandava: 'sent', manderà: 'will send', mandando: 'sending',
  mandato: 'sent', mandare: 'to send',

  // --- alzare (to rise/raise) ---
  alzò: 'rose', alzati: 'rise up', alzarsi: 'to rise', alzato: 'risen',
  alzando: 'raising', alzare: 'to raise', alzandosi: 'rising',

  // --- tornare (to return) ---
  torno: 'I return', torni: 'you return', torna: 'returns', torniamo: 'we return',
  tornate: 'you return', tornano: 'they return', tornò: 'returned',
  tornava: 'returned', tornerà: 'will return', tornando: 'returning',
  tornato: 'returned', tornare: 'to return',

  // --- ricevere (to receive) ---
  ricevo: 'I receive', ricevi: 'you receive', riceve: 'receives',
  riceviamo: 'we receive', ricevete: 'you receive', ricevono: 'they receive',
  ricevette: 'received', ricevevano: 'received', riceverà: 'will receive',
  riceverete: 'you will receive', ricevendo: 'receiving',
  ricevuto: 'received', ricevere: 'to receive',

  // --- pregare (to pray) ---
  prego: 'I pray', preghi: 'you pray', prega: 'prays', preghiamo: 'we pray',
  pregate: 'you pray', pregano: 'they pray', pregò: 'prayed', pregarono: 'prayed',
  pregava: 'was praying', pregavano: 'were praying', pregherà: 'will pray',
  pregando: 'praying', pregato: 'prayed', pregare: 'to pray',

  // --- piangere (to weep/cry) ---
  piango: 'I weep', piangi: 'you weep', piange: 'weeps', piangiamo: 'we weep',
  piangete: 'you weep', piangono: 'they weep', pianse: 'wept', piansero: 'wept',
  piangeva: 'was weeping', piangevano: 'were weeping', piangerà: 'will weep',
  piangendo: 'weeping', piangere: 'to weep',

  // --- salvare (to save) ---
  salvo: 'I save', salvi: 'you save', salva: 'saves', salviamo: 'we save',
  salvate: 'you save', salvano: 'they save', salvò: 'saved', salvarono: 'saved',
  salvava: 'saved', salverà: 'will save', salvando: 'saving',
  salvato: 'saved', salvati: 'saved', salvare: 'to save',

  // --- chiedere (to ask) ---
  chiedo: 'I ask', chiedi: 'you ask', chiede: 'asks', chiediamo: 'we ask',
  chiedete: 'you ask', chiedono: 'they ask', chiese: 'asked',
  chiesero: 'asked', chiedeva: 'was asking', chiedevano: 'were asking',
  chiederà: 'will ask', chiedendo: 'asking', chiesto: 'asked',
  chiedere: 'to ask',

  // --- rispondere (to answer) ---
  rispondo: 'I answer', rispondi: 'you answer', risponde: 'answers',
  rispondiamo: 'we answer', rispondete: 'you answer', rispondono: 'they answer',
  rispose: 'answered', risposero: 'answered', rispondeva: 'was answering',
  risponderà: 'will answer', rispondendo: 'answering',
  risposto: 'answered', rispondere: 'to answer', risposi: 'I answered',

  // --- morire (to die) ---
  muoio: 'I die', muori: 'you die', muore: 'dies', moriamo: 'we die',
  morite: 'you die', muoiono: 'they die', morì: 'died', morirono: 'died',
  moriva: 'was dying', morivano: 'were dying', morirà: 'will die',
  morendo: 'dying', muoia: 'die', morire: 'to die',

  // --- nascere (to be born) ---
  nasco: 'I am born', nasci: 'you are born', nasce: 'is born',
  nasciamo: 'we are born', nascete: 'you are born', nascono: 'they are born',
  nacque: 'was born', nacquero: 'were born', nasceva: 'was being born',
  nascerà: 'will be born', nascendo: 'being born', nato: 'born', nascere: 'to be born',

  // --- rimanere / restare (to remain/stay) ---
  rimango: 'I remain', rimani: 'you remain', rimane: 'remains',
  rimaniamo: 'we remain', rimanete: 'you remain', rimangono: 'they remain',
  rimase: 'remained', rimasero: 'remained', rimaneva: 'was remaining',
  rimarrà: 'will remain', rimanendo: 'remaining', rimanere: 'to remain',
  resto: 'I remain', resti: 'you remain', resta: 'remains', restiamo: 'we remain',
  restate: 'you remain', restano: 'they remain', restò: 'remained',
  restava: 'was remaining', resterà: 'will remain', restando: 'remaining',
  restato: 'remained', restare: 'to remain',

  // --- scendere (to go down/descend) ---
  scendo: 'I go down', scendi: 'you go down', scende: 'goes down',
  scendiamo: 'we go down', scendete: 'you go down', scendono: 'they go down',
  scese: 'went down', scesero: 'went down', scendeva: 'was going down',
  scenderà: 'will go down', scendendo: 'going down', sceso: 'gone down',
  discese: 'descended', discende: 'descends', disceso: 'descended',
  scendere: 'to go down',

  // --- salire (to go up/ascend) ---
  salgo: 'I go up', sali: 'you go up', sale: 'salt',
  saliamo: 'we go up', salite: 'you go up', salgono: 'they go up',
  salì: 'went up', salirono: 'went up', saliva: 'was going up',
  salirà: 'will go up', salendo: 'going up', salito: 'gone up',
  salire: 'to go up',

  // --- compiere (to fulfill/accomplish) ---
  compio: 'I fulfill', compi: 'you fulfill', compie: 'fulfills',
  compiamo: 'we fulfill', compiono: 'they fulfill',
  compì: 'fulfilled', compirono: 'fulfilled', compiva: 'was fulfilling',
  compirà: 'will fulfill', compiendo: 'fulfilling',
  compiuto: 'fulfilled', compiere: 'to fulfill', adempiuto: 'fulfilled',

  // --- guarire (to heal) ---
  guarisco: 'I heal', guarisci: 'you heal', guarisce: 'heals',
  guariamo: 'we heal', guarite: 'you heal', guariscono: 'they heal',
  guarì: 'healed', guarirono: 'healed', guariva: 'was healing',
  guarirà: 'will heal', guarendo: 'healing', guarito: 'healed', guarire: 'to heal',

  // --- temere (to fear) ---
  temo: 'I fear', temi: 'you fear', teme: 'fears', temiamo: 'we fear',
  temete: 'you fear', temono: 'they fear', temette: 'feared',
  temeva: 'feared', temevano: 'feared', temerà: 'will fear',
  temendo: 'fearing', temuto: 'feared', temere: 'to fear',

  // --- giudicare (to judge) ---
  giudico: 'I judge', giudichi: 'you judge', giudica: 'judges',
  giudichiamo: 'we judge', giudicate: 'you judge', giudicano: 'they judge',
  giudicò: 'judged', giudicarono: 'judged', giudicava: 'was judging',
  giudicherà: 'will judge', giudicando: 'judging', giudicato: 'judged',
  giudicare: 'to judge',

  // --- annunciare (to proclaim/announce) ---
  annuncio: 'I proclaim', annunci: 'you proclaim', annuncia: 'proclaims',
  annunciamo: 'we proclaim', annunciate: 'you proclaim', annunciano: 'they proclaim',
  annunciò: 'proclaimed', annunciarono: 'proclaimed',
  annunciava: 'was proclaiming', annunciavano: 'were proclaiming',
  annuncerà: 'will proclaim', annunciando: 'proclaiming',
  annunciato: 'proclaimed', annunciare: 'to proclaim', annunciata: 'proclaimed',

  // --- risorgere (to rise again) ---
  risorgo: 'I rise again', risorgi: 'you rise again', risorge: 'rises again',
  risorgono: 'they rise again', risorse: 'rose again', risorsero: 'rose again',
  risorgeva: 'was rising', risorgerà: 'will rise again',
  risorgendo: 'rising again', risorgere: 'to rise again',

  // --- perdonare (to forgive; perdono as 'forgiveness' is a noun) ---
  perdoni: 'you forgive', perdona: 'forgives', perdoniamo: 'we forgive',
  perdonate: 'you forgive', perdonano: 'they forgive', perdonò: 'forgave',
  perdonarono: 'forgave', perdonava: 'forgave', perdonerà: 'will forgive',
  perdonando: 'forgiving', perdonato: 'forgiven', perdonare: 'to forgive',

  // --- common adjectives ---
  grande: 'great', grandi: 'great', piccolo: 'small', piccola: 'small',
  buono: 'good', buona: 'good', buoni: 'good', buone: 'good',
  bello: 'beautiful', bella: 'beautiful', belli: 'beautiful', belle: 'beautiful',
  nuovo: 'new', nuova: 'new', nuovi: 'new', nuove: 'new',
  vecchio: 'old', vecchia: 'old', vecchi: 'old', vecchie: 'old',
  alto: 'high', alta: 'high', basso: 'low', bassa: 'low',
  breve: 'brief', brevi: 'brief',
  vero: 'true', vera: 'true', veri: 'true', vere: 'true',
  falso: 'false', falsa: 'false', giusto: 'right', giusta: 'right',
  giusti: 'righteous', giuste: 'righteous',
  santo: 'holy', santa: 'holy', santi: 'holy', sante: 'holy',
  eterno: 'eternal', eterna: 'eternal', eterni: 'eternal', eterne: 'eternal',
  divino: 'divine', divina: 'divine', umano: 'human', umana: 'human',
  forte: 'strong', forti: 'strong', debole: 'weak', deboli: 'weak',
  pieno: 'full', piena: 'full', pieni: 'full', piene: 'full',
  vuoto: 'empty', vuota: 'empty', aperto: 'open', aperta: 'open',
  chiuso: 'closed', chiusa: 'closed', pronto: 'ready', pronta: 'ready',
  fedele: 'faithful', fedeli: 'faithful', vivo: 'alive', viva: 'alive',
  morto: 'dead', morta: 'dead', morti: 'dead',
  sola: 'alone', soli: 'alone',
  libero: 'free', libera: 'free', liberi: 'free', libere: 'free',
  degno: 'worthy', degna: 'worthy', degni: 'worthy',
  misericordioso: 'merciful', misericordiosa: 'merciful',
  glorioso: 'glorious', gloriosa: 'glorious',
  benedetto: 'blessed', benedetta: 'blessed', benedetti: 'blessed',
  maledetto: 'cursed', maledetta: 'cursed',
  amato: 'beloved', amata: 'beloved', amati: 'beloved',
  // beatitudes & related
  beato: 'blessed', beata: 'blessed', beati: 'blessed', beate: 'blessed',
  povero: 'poor', povera: 'poor', poveri: 'poor', povere: 'poor',
  ricco: 'rich', ricca: 'rich', ricchi: 'rich', ricche: 'rich',
  puro: 'pure', pura: 'pure', puri: 'pure',
  mite: 'gentle/meek', miti: 'gentle/meek',
  umile: 'humble', umili: 'humble',
  affamato: 'hungry', affamata: 'hungry', affamati: 'hungry', affamate: 'hungry',
  assetato: 'thirsty', assetata: 'thirsty', assetati: 'thirsty', assetate: 'thirsty',
  saziato: 'satisfied', saziata: 'satisfied', saziati: 'satisfied',
  perduto: 'lost', perduta: 'lost', perduti: 'lost', perdute: 'lost',
  cieco: 'blind', cieca: 'blind', ciechi: 'blind', cieche: 'blind',
  lieto: 'glad', lieta: 'glad', lieti: 'glad', liete: 'glad',
  perfetto: 'perfect', perfetta: 'perfect', perfetti: 'perfect', perfette: 'perfect',
  spirituale: 'spiritual', spirituali: 'spiritual',
  celeste: 'heavenly', celesti: 'heavenly',
  risorto: 'risen', risortа: 'risen', risorti: 'risen',
  risuscitato: 'resurrected', risuscitata: 'resurrected', risuscitati: 'resurrected',
  necessario: 'necessary', necessaria: 'necessary', necessari: 'necessary',
  ingiusto: 'unjust', ingiusta: 'unjust', ingiusti: 'unjust',
  gradito: 'pleasing', gradita: 'pleasing',
  comune: 'common', comuni: 'common',
  antico: 'ancient/old', antica: 'ancient', antichi: 'ancient',
  lontano: 'far', lontana: 'far', lontani: 'far',
  vicino: 'near', vicina: 'near', vicini: 'near',
  sfolgorante: 'radiant', sfolgoranti: 'radiant',
  splendente: 'shining', tremante: 'trembling',
  grato: 'grateful', grata: 'grateful',

  // --- common nouns ---
  uomo: 'man', donna: 'woman', bambino: 'child', bambina: 'child',
  figlio: 'son', figlia: 'daughter', figli: 'children', padre: 'father',
  madre: 'mother', fratello: 'brother', sorella: 'sister', servo: 'servant',
  servi: 'servants', re: 're (king)', signore: 'lord', signori: 'lords',
  popolo: 'people', nazione: 'nation', nazioni: 'nations', terra: 'earth',
  cielo: 'heaven', acqua: 'water', fuoco: 'fire', pane: 'bread',
  vino: 'wine', olio: 'oil', pietra: 'stone', pietre: 'stones',
  porta: 'door', casa: 'house', città: 'city', tempio: 'temple',
  montagna: 'mountain', monte: 'mountain', deserto: 'desert',
  mare: 'sea', fiume: 'river', giorno: 'day', giorni: 'days',
  notte: 'night', anno: 'year', anni: 'years', tempo: 'time',
  momento: 'moment', modo: 'way', voce: 'voice',
  mano: 'hand', mani: 'hands', occhio: 'eye', occhi: 'eyes',
  piede: 'foot', piedi: 'feet', capo: 'head', cuore: 'heart',
  bocca: 'mouth', parola: 'word', parole: 'words', nome: 'name',
  nomi: 'names', opera: 'work', opere: 'works', via: 'way', vie: 'ways',
  luogo: 'place', luoghi: 'places', fine: 'end', inizio: 'beginning',
  principio: 'beginning', corpo: 'body', corpi: 'bodies',
  sangue: 'blood', ossa: 'bones', spirito: 'spirit', spiriti: 'spirits',
  anima: 'soul', anime: 'souls', carne: 'flesh', vita: 'life', vite: 'lives',
  morte: 'death', pace: 'peace', guerra: 'war', potere: 'power',
  gloria: 'glory', grazia: 'grace', verità: 'truth', luce: 'light',
  tenebre: 'darkness', buio: 'darkness', speranza: 'hope', fede: 'faith',
  amore: 'love', carità: 'charity', gioia: 'joy', dolore: 'pain',
  peccato: 'sin', peccati: 'sins', colpa: 'fault', perdono: 'forgiveness',
  misericordia: 'mercy', salvezza: 'salvation', regno: 'kingdom',
  legge: 'law', leggi: 'laws', promessa: 'promise', promesse: 'promises',
  patto: 'covenant', alleanza: 'covenant', benedizione: 'blessing',
  maledizione: 'curse', preghiera: 'prayer', preghiere: 'prayers',
  sacrificio: 'sacrifice', offerta: 'offering', altare: 'altar',
  sacerdote: 'priest', sacerdoti: 'priests', profeta: 'prophet',
  profeti: 'prophets', apostolo: 'apostle', apostoli: 'apostles',
  discepolo: 'disciple', discepoli: 'disciples', chiesa: 'church',
  sinagoga: 'synagogue', risurrezione: 'resurrection', battesimo: 'baptism',
  vangelo: 'gospel', scrittura: 'scripture', scritture: 'scriptures',
  angelo: 'angel', angeli: 'angels', demonio: 'demon', demoni: 'demons',
  diavolo: 'devil', satana: 'Satan', mondo: 'world', mondi: 'worlds',
  creazione: 'creation', cieli: 'heavens',
  // additional nouns
  giustizia: 'justice', peccatore: 'sinner', peccatori: 'sinners',
  peccatrice: 'sinner', pubblicano: 'tax collector', pubblicani: 'tax collectors',
  fariseo: 'Pharisee', farisei: 'Pharisees', scriba: 'scribe', scribi: 'scribes',
  centurione: 'centurion', centurioni: 'centurions',
  pastore: 'shepherd', pastori: 'shepherds',
  pecora: 'sheep', pecore: 'sheep', agnello: 'lamb', agnelli: 'lambs',
  gregge: 'flock', greggi: 'flocks',
  folla: 'crowd', folle: 'crowds', moltitudine: 'multitude',
  cibo: 'food', cibi: 'foods', dono: 'gift', doni: 'gifts',
  volontà: 'will', forza: 'strength', forze: 'strengths',
  potenza: 'power', potenze: 'powers', virtù: 'virtue',
  timore: 'fear', timori: 'fears',
  spada: 'sword', spade: 'swords',
  prigione: 'prison', prigioni: 'prisons',
  prigioniero: 'prisoner', prigionieri: 'prisoners',
  testimone: 'witness', testimoni: 'witnesses',
  testimonianza: 'testimony', testimonianze: 'testimonies',
  liberazione: 'liberation', libertà: 'freedom',
  redenzione: 'redemption', vocazione: 'calling',
  tribolazione: 'tribulation', tribolazioni: 'tribulations',
  perseveranza: 'perseverance', pianto: 'weeping',
  consolazione: 'consolation', nemico: 'enemy', nemici: 'enemies',
  strada: 'road', strade: 'roads', viaggio: 'journey',
  cammino: 'path', cammini: 'paths', prossimo: 'neighbor',
  sole: 'sun', luna: 'moon', stella: 'star', stelle: 'stars',
  vento: 'wind',
  nuvola: 'cloud', nuvole: 'clouds',
  tuono: 'thunder', folgore: 'lightning', terremoto: 'earthquake',
  sepolcro: 'tomb', sepolcri: 'tombs',
  lingua: 'tongue/language', lingue: 'tongues/languages',
  ministero: 'ministry', sandalo: 'sandal', sandali: 'sandals',
  patrimonio: 'inheritance', eredità: 'inheritance',
  donne: 'women', uomini: 'men', fratelli: 'brothers',
  padri: 'fathers', sorelle: 'sisters',
  tribù: 'tribe',
  genti: 'nations/peoples', pagani: 'pagans/Gentiles',
  servitore: 'servant', ministro: 'minister',
  guarigione: 'healing', salvatore: 'savior',
  giudizio: 'judgment',
  pietas: 'piety', pietà: 'compassion', grido: 'cry', grida: 'cries',
  odio: 'hatred', ingiustizia: 'injustice',
  pentimento: 'repentance', conversione: 'conversion',
  compassione: 'compassion', affetto: 'affection',
  giustificazione: 'justification', santità: 'holiness',
  umiltà: 'humility', orgoglio: 'pride',
  fondamenta: 'foundations',
  vigna: 'vineyard', vigne: 'vineyards',
  pescatore: 'fisherman', pescatori: 'fishermen',
  rete: 'net', reti: 'nets', lacrima: 'tear', lacrime: 'tears',
  ora: 'hour', settimana: 'week', istante: 'instant',
  mattino: 'morning', sera: 'evening', mezzanotte: 'midnight',
  paese: 'land/country', regione: 'region',

  // --- proper names (biblical) ---
  gesù: 'Jesus', cristo: 'Christ', dio: 'God',
  giovanni: 'John', pietro: 'Peter', paolo: 'Paul', giacomo: 'James',
  maria: 'Mary', giuseppe: 'Joseph', abramo: 'Abraham', mosè: 'Moses',
  davide: 'David', salomone: 'Solomon', isaia: 'Isaiah',
  geremia: 'Jeremiah', elia: 'Elijah', eliseo: 'Elisha',
  israele: 'Israel', giuda: 'Judah', gerusalemme: 'Jerusalem',
  betlemme: 'Bethlehem', nazaret: 'Nazareth', egitto: 'Egypt',
  babilonia: 'Babylon', roma: 'Rome', giordano: 'Jordan',
  galilea: 'Galilee', giudea: 'Judea', samaria: 'Samaria',
  nazareno: 'Nazarene', galileo: 'Galilean',
  nicodemo: 'Nicodemus', lazzaro: 'Lazarus', zaccheo: 'Zacchaeus',
  tommaso: 'Thomas', barnaba: 'Barnabas', sila: 'Silas',
  simone: 'Simon', saulo: 'Saul', damasco: 'Damascus',
  gerico: 'Jericho', battista: 'Baptist',

  // --- extended pronouns / determiners ---
  ciò: 'this/that', coloro: 'those who', colui: 'he who', costui: 'this man',
  costei: 'this woman', sé: 'himself/herself',
  niente: 'nothing', nulla: 'nothing',
  quel: 'that', quei: 'those', quell: 'that', quegli: 'those',
  più: 'more/no longer', meno: 'less',

  // --- missing avere / essere forms ---
  avesse: 'had', avessero: 'had', avessi: 'had', avessimo: 'had',
  fossero: 'were', fossi: 'were',
  stette: 'stood/stayed', stettero: 'stood/stayed',

  // --- missing mettere forms ---
  metteranno: 'will put', metterebbe: 'would put', metta: 'put',

  // --- missing trovare forms ---
  trovavano: 'were finding', troverete: 'you will find', troveranno: 'will find',
  trovino: 'find', troverei: 'I would find',

  // --- odiare (to hate; odio as 'hatred' is already a noun) ---
  odi: 'you hate', odia: 'hates', odiamo: 'we hate',
  odiate: 'you hate', odiano: 'they hate', odiò: 'hated', odiarono: 'hated',
  odiava: 'hated', odiavano: 'hated', odierà: 'will hate',
  odieranno: 'will hate', odiare: 'to hate', odiando: 'hating',
  odiato: 'hated', odiereste: 'you would hate',

  // --- abitare (to live/dwell) ---
  abito: 'I live', abiti: 'you live', abita: 'lives', abitiamo: 'we live',
  abitate: 'you live', abitano: 'they live', abitò: 'lived', abitarono: 'lived',
  abitava: 'lived', abitavano: 'lived', abiterà: 'will live',
  abiteranno: 'will live', abitando: 'living', abitato: 'inhabited',
  abitare: 'to live', abitante: 'inhabitant', abitanti: 'inhabitants',

  // --- ascoltare (to listen) ---
  ascolto: 'I listen', ascolti: 'you listen', ascolta: 'listens',
  ascoltiamo: 'we listen', ascoltate: 'you listen', ascoltano: 'they listen',
  ascoltò: 'listened', ascoltarono: 'listened', ascoltava: 'was listening',
  ascoltavano: 'were listening', ascolterà: 'will listen',
  ascolteranno: 'will listen', ascoltando: 'listening',
  ascoltato: 'listened', ascoltare: 'to listen',

  // --- cercare (to seek) ---
  cerco: 'I seek', cerchi: 'you seek', cerca: 'seeks', cerchiamo: 'we seek',
  cercate: 'you seek', cercano: 'they seek', cercò: 'sought', cercarono: 'sought',
  cercava: 'was seeking', cercavano: 'were seeking', cercherà: 'will seek',
  cercando: 'seeking', cercato: 'sought', cercare: 'to seek',

  // --- cantare (to sing) ---
  canto: 'I sing', canti: 'you sing', canta: 'sings', cantiamo: 'we sing',
  cantate: 'you sing', cantano: 'they sing', cantò: 'sang', cantarono: 'sang',
  cantava: 'was singing', cantavano: 'were singing', canterà: 'will sing',
  cantando: 'singing', cantato: 'sung', cantare: 'to sing',

  // --- mangiare (to eat) ---
  mangio: 'I eat', mangi: 'you eat', mangia: 'eats', mangiamo: 'we eat',
  mangiate: 'you eat', mangiano: 'they eat', mangiò: 'ate', mangiarono: 'ate',
  mangiava: 'was eating', mangiavano: 'were eating', mangerà: 'will eat',
  mangerete: 'you will eat', mangeranno: 'will eat', mangiando: 'eating',
  mangiato: 'eaten', mangiare: 'to eat',

  // --- cadere (to fall) ---
  cado: 'I fall', cadi: 'you fall', cade: 'falls', cadiamo: 'we fall',
  cadete: 'you fall', cadono: 'they fall', cadde: 'fell', caddero: 'fell',
  caddi: 'fell', cadeva: 'was falling', cadrà: 'will fall', cadranno: 'will fall',
  cadendo: 'falling', caduto: 'fallen', caduti: 'fallen', cadere: 'to fall',

  // --- udire (to hear) ---
  odo: 'I hear', ude: 'hears', udiamo: 'we hear', udite: 'you hear',
  odono: 'they hear', udì: 'heard', udirono: 'heard', udii: 'I heard',
  udiva: 'was hearing', udivano: 'were hearing', udirà: 'will hear',
  udendo: 'hearing', udito: 'heard', udire: 'to hear', udissi: 'heard',

  // --- vivere (to live; vivo as 'alive' is in adjectives) ---
  vivi: 'you live', vive: 'lives', viviamo: 'we live',
  vivete: 'you live', vivono: 'they live', visse: 'lived', vissero: 'lived',
  viveva: 'was living', vivevano: 'were living', vivrà: 'will live',
  vivranno: 'will live', vivendo: 'living', vissuto: 'lived',
  vivente: 'living/the living', viventi: 'the living', vivere: 'to live',
  vivrai: 'you will live',

  // --- camminare (to walk; cammino/cammini are nouns above) ---
  cammina: 'walks',
  camminiamo: 'we walk', camminate: 'you walk', camminano: 'they walk',
  camminò: 'walked', camminarono: 'walked', camminava: 'was walking',
  camminavano: 'were walking', camminerà: 'will walk', camminando: 'walking',
  camminato: 'walked', camminare: 'to walk',

  // --- gettare (to throw/cast) ---
  getto: 'I throw', getti: 'you throw', getta: 'throws', gettiamo: 'we throw',
  gettate: 'you throw', gettano: 'they throw', gettò: 'threw', gettarono: 'threw',
  gettava: 'threw', getterà: 'will throw', gettando: 'throwing',
  gettato: 'thrown', gettare: 'to throw',

  // --- partire (to leave/depart) ---
  parto: 'I leave', parti: 'you leave', parte: 'leaves', partiamo: 'we leave',
  partite: 'you leave', partono: 'they leave', partì: 'departed', partirono: 'departed',
  partiva: 'was leaving', partirà: 'will leave', partendo: 'leaving',
  partito: 'departed', partire: 'to leave',

  // --- passare (to pass) ---
  passo: 'I pass', passi: 'you pass', passa: 'passes', passiamo: 'we pass',
  passate: 'you pass', passano: 'they pass', passò: 'passed', passarono: 'passed',
  passava: 'was passing', passavano: 'were passing', passerà: 'will pass',
  passando: 'passing', passato: 'passed', passare: 'to pass',

  // --- aprire (to open) ---
  apro: 'I open', apri: 'you open', apre: 'opens', apriamo: 'we open',
  aprite: 'you open', aprono: 'they open', aprì: 'opened', aprirono: 'opened',
  apriva: 'was opening', aprirà: 'will open', aprendo: 'opening',
  aprire: 'to open', aperte: 'opened',

  // --- vegliare (to watch/keep vigil) ---
  veglio: 'I watch', vegli: 'you watch', veglia: 'watches',
  vegliamo: 'we watch', vegliate: 'you watch', vegliano: 'they watch',
  vegliò: 'watched', vegliava: 'was watching', vegliavano: 'were watching',
  veglierà: 'will watch', vegliando: 'watching', vegliare: 'to watch',

  // --- rallegrarsi (to rejoice) ---
  rallegro: 'I rejoice', rallegri: 'you rejoice', rallegra: 'rejoices',
  rallegriamo: 'we rejoice', rallegrino: 'they rejoice',
  rallegrò: 'rejoiced', rallegrava: 'rejoiced', rallegratevi: 'rejoice',
  rallegrando: 'rejoicing', rallegrarsi: 'to rejoice', rallegrate: 'rejoice',

  // --- convertire (to convert/turn) ---
  converto: 'I convert', converti: 'you convert', converte: 'converts',
  convertiamo: 'we convert', convertite: 'you convert', convertono: 'they convert',
  convertì: 'converted', convertirono: 'converted', convertiva: 'was converting',
  convertiranno: 'will convert', convertendo: 'converting',
  convertito: 'converted', convertire: 'to convert',
  convertano: 'they may convert', convertitevi: 'convert/turn',

  // --- giustificare (to justify) ---
  giustifico: 'I justify', giustifica: 'justifies', giustifichiamo: 'we justify',
  giustificò: 'justified', giustificarono: 'justified', giustificato: 'justified',
  giustificati: 'justified', giustificata: 'justified', giustificare: 'to justify',
  giustificandosi: 'justifying himself',

  // --- aggiungere (to add) ---
  aggiungo: 'I add', aggiungi: 'you add', aggiunge: 'adds', aggiungiamo: 'we add',
  aggiungete: 'you add', aggiungono: 'they add', aggiunse: 'added',
  aggiunsero: 'added', aggiungeva: 'was adding', aggiungendo: 'adding',
  aggiunto: 'added', aggiungere: 'to add', aggiunta: 'added',

  // --- svegliare (to wake up) ---
  sveglio: 'I wake', svegli: 'you wake', sveglia: 'wakes', svegliamo: 'we wake',
  svegliate: 'you wake', svegliano: 'they wake', svegliò: 'woke up',
  svegliava: 'was waking', svegliando: 'waking', svegliato: 'awakened',
  svegliare: 'to wake', svegliarsi: 'to wake up',

  // --- soffrire (to suffer) ---
  soffro: 'I suffer', soffri: 'you suffer', soffre: 'suffers',
  soffriamo: 'we suffer', soffrite: 'you suffer', soffrono: 'they suffer',
  soffrì: 'suffered', soffrirono: 'suffered', soffriva: 'was suffering',
  soffrirà: 'will suffer', soffrendo: 'suffering', sofferto: 'suffered',
  soffrire: 'to suffer',

  // --- more missing nouns ---
  fame: 'hunger', sete: 'thirst', famiglia: 'family', famiglie: 'families',
  giovane: 'young man', giovani: 'young people', fanciullo: 'child/boy',
  fanciulla: 'girl', fanciulli: 'children',
  vitello: 'calf', vitelli: 'calves',
  fasce: 'swaddling clothes', sudario: 'burial cloth',
  bende: 'wrappings', aromi: 'spices', profumo: 'perfume/fragrance',
  catene: 'chains', catena: 'chain', carceriere: 'jailer',
  debito: 'debt', debiti: 'debts', decima: 'tithe', decime: 'tithes',
  espiazione: 'atonement', remissione: 'remission', propiziatone: 'propitiation',
  anziani: 'elders', anziano: 'elder',
  sinagoghe: 'synagogues', tempi: 'times', epoche: 'ages',
  dimore: 'dwelling places', dimora: 'dwelling',
  digiuno: 'fasting', digiuni: 'fasts',
  incontro: 'encounter/meeting', mezzo: 'midst/middle',
  maestro: 'teacher', maestra: 'teacher',
  sommo: 'high/chief', creatura: 'creature', creature: 'creatures',
  brigante: 'robber', briganti: 'robbers', ladrone: 'thief', ladroni: 'thieves',
  vescovo: 'bishop', vescovi: 'bishops', diacono: 'deacon', diaconi: 'deacons',
  circoncisione: 'circumcision', incirconcisione: 'uncircumcision',
  giudeo: 'Jew', giudei: 'Jews', greco: 'Greek', greci: 'Greeks',
  schiavo: 'slave', schiavi: 'slaves', liberto: 'freed person',
  adulterio: 'adultery', adultero: 'adulterer', adulteri: 'adulterers',
  omicidio: 'murder', rapina: 'robbery',
  ebreo: 'Hebrew', ebraico: 'Hebrew',
  splendore: 'splendor', grandezza: 'greatness', immensità: 'immensity',
  franchezza: 'boldness', favore: 'favor',

  // --- important adjectives / participles ---
  scelto: 'chosen', scelta: 'chosen', scelti: 'chosen',
  consacrato: 'consecrated', consacrata: 'consecrated', consacrati: 'consecrated',
  predestinato: 'predestined', predestinati: 'predestined',
  stabilito: 'established/appointed', costituito: 'established',
  promesso: 'promised',
  riuniti: 'gathered', riunita: 'gathered',
  circoncisi: 'circumcised', incirconcisi: 'uncircumcised',
  propri: 'own', propria: 'own',
  impaurite: 'frightened', turbato: 'troubled', turbata: 'troubled',
  chinato: 'bowed', inginocchiato: 'kneeling',
  vestito: 'dressed/clothed', vestita: 'clothed', vestiti: 'clothed',
  avvolto: 'wrapped', avvolta: 'wrapped', avvolti: 'wrapped',
  adagiato: 'laid/placed', adagiata: 'laid',

  // --- important adverbs / fixed phrases ---
  avanti: 'forward/ahead', noto: 'known', grazie: 'thanks/thank you',
  alleluia: 'hallelujah', amen: 'amen', rabbi: 'rabbi', rabbuni: 'rabboni',
  osanna: 'hosanna',

  // --- gridare (to cry out/shout) ---
  gridi: 'you cry out', gridiamo: 'we cry out',
  gridano: 'they cry out', gridò: 'cried out', gridarono: 'cried out',
  gridava: 'cried out', griderà: 'will cry out', gridando: 'crying out',
  gridare: 'to cry out',

  // --- cominciare (to begin) ---
  comincio: 'I begin', cominci: 'you begin', comincia: 'begins',
  cominciamo: 'we begin', cominciate: 'you begin', cominciano: 'they begin',
  cominciò: 'began', cominciarono: 'began', cominciava: 'was beginning',
  comincerà: 'will begin', cominciando: 'beginning', cominciato: 'begun',
  cominciare: 'to begin',

  // --- conoscere (to know) ---
  conosco: 'I know', conosci: 'you know', conosce: 'knows', conosciamo: 'we know',
  conoscete: 'you know', conoscono: 'they know', conobbe: 'knew', conobbero: 'knew',
  conosceva: 'knew', conoscevano: 'knew', conoscerà: 'will know',
  conoscerete: 'you will know', conosceranno: 'will know',
  conoscendo: 'knowing', conosciuto: 'known', conoscere: 'to know',
  conoscessi: 'knew', conoscersi: 'to know each other',

  // --- lasciare (to let/leave) ---
  lascio: 'I let', lasci: 'you let', lascia: 'lets', lasciamo: 'we let',
  lasciate: 'you let', lasciano: 'they let', lasciò: 'left', lasciarono: 'left',
  lasciava: 'was leaving', lascerà: 'will leave', lasciando: 'leaving',
  lasciato: 'left', lasciare: 'to leave',
  lasciatelo: 'let him', lasciatevi: 'leave yourselves',

  // --- lavare (to wash) ---
  lavo: 'I wash', lavi: 'you wash', lava: 'washes', laviamo: 'we wash',
  lavate: 'you wash', lavano: 'they wash', lavò: 'washed', lavarono: 'washed',
  lavava: 'was washing', laverà: 'will wash', lavando: 'washing',
  lavato: 'washed', lavare: 'to wash',

  // --- tenere (to hold/keep) ---
  tengo: 'I hold', tieni: 'you hold', tiene: 'holds', teniamo: 'we hold',
  tenete: 'you hold', tengono: 'they hold', tenne: 'held', tennero: 'held',
  teneva: 'was holding', tenevano: 'were holding', terrà: 'will hold',
  tenendo: 'holding', tenuto: 'held', tenere: 'to hold',

  // --- uccidere (to kill) ---
  uccido: 'I kill', uccidi: 'you kill', uccide: 'kills', uccidiamo: 'we kill',
  uccidete: 'you kill', uccidono: 'they kill', uccise: 'killed', uccisero: 'killed',
  uccideva: 'was killing', ucciderà: 'will kill', uccidendo: 'killing',
  ucciso: 'killed', uccisi: 'killed', uccidere: 'to kill',

  // --- liberare (to free) ---
  liberiamo: 'we free',
  liberate: 'you free', liberano: 'they free', liberò: 'freed', liberarono: 'freed',
  liberava: 'was freeing', libererà: 'will free', liberando: 'freeing',
  liberato: 'freed', liberati: 'freed', liberare: 'to free',
  liberandoti: 'freeing you', liberatelo: 'free him',

  // --- lodare (to praise) ---
  lodo: 'I praise', lodi: 'you praise', loda: 'praises', lodiamo: 'we praise',
  lodate: 'you praise', lodano: 'they praise', lodò: 'praised', lodarono: 'praised',
  lodava: 'was praising', loderà: 'will praise', lodando: 'praising',
  lodato: 'praised', lodare: 'to praise', lodatelo: 'praise him',

  // --- proclamare (to proclaim) ---
  proclamo: 'I proclaim', proclama: 'proclaims', proclamiamo: 'we proclaim',
  proclamano: 'they proclaim', proclamò: 'proclaimed', proclamerà: 'will proclaim',
  proclamando: 'proclaiming', proclamato: 'proclaimed', proclamare: 'to proclaim',

  // --- ritornare (to return) ---
  ritorno: 'I return', ritorni: 'you return', ritorna: 'returns',
  ritorniamo: 'we return', ritornano: 'they return', ritornò: 'returned',
  ritornava: 'was returning', ritornerà: 'will return',
  ritornerò: 'I will return', ritornando: 'returning', ritornato: 'returned',
  ritornare: 'to return',

  // --- rivelare (to reveal) ---
  rivelo: 'I reveal', riveli: 'you reveal', rivela: 'reveals', riveliamo: 'we reveal',
  rivelano: 'they reveal', rivelò: 'revealed', rivelarono: 'revealed',
  rivelava: 'was revealing', rivelerà: 'will reveal', rivelando: 'revealing',
  rivelato: 'revealed', rivelare: 'to reveal',

  // --- tremare (to tremble) ---
  tremo: 'I tremble', tremi: 'you tremble', trema: 'trembles',
  tremiamo: 'we tremble', tremano: 'they tremble', tremò: 'trembled',
  tremarono: 'trembled', tremava: 'was trembling', tremerà: 'will tremble',
  tremando: 'trembling', tremato: 'trembled', tremare: 'to tremble',

  // --- trasformare (to transform) ---
  trasformo: 'I transform', trasforma: 'transforms', trasformiamo: 'we transform',
  trasformano: 'they transform', trasformò: 'transformed',
  trasformerà: 'will transform', trasformando: 'transforming',
  trasformato: 'transformed', trasformare: 'to transform',

  // --- battezzare (to baptize) ---
  battezzo: 'I baptize', battezzi: 'you baptize', battezza: 'baptizes',
  battezziamo: 'we baptize', battezzano: 'they baptize',
  battezzò: 'baptized', battezzarono: 'baptized', battezzerà: 'will baptize',
  battezzando: 'baptizing', battezzato: 'baptized', battezzare: 'to baptize',

  // --- imporre (to impose/lay on) ---
  impongo: 'I impose', imponi: 'you impose', impone: 'imposes',
  imponiamo: 'we impose', impongono: 'they impose', impose: 'imposed',
  imposero: 'imposed', imponeva: 'was imposing', imporrà: 'will impose',
  imponendo: 'imposing', imposto: 'imposed', imporre: 'to impose',

  // --- invocare (to invoke/call upon) ---
  invoco: 'I invoke', invochi: 'you invoke', invoca: 'invokes',
  invochiamo: 'we invoke', invocano: 'they invoke', invocò: 'invoked',
  invocavano: 'were invoking', invocherà: 'will invoke',
  invocando: 'invoking', invocato: 'invoked', invocare: 'to invoke',
  invocarlo: 'to invoke him',

  // --- apparire (to appear) ---
  appaio: 'I appear', appari: 'you appear', appare: 'appears',
  appariamo: 'we appear', appaiono: 'they appear', apparve: 'appeared',
  apparvero: 'appeared', appariva: 'was appearing', apparirà: 'will appear',
  apparendo: 'appearing', apparso: 'appeared', apparire: 'to appear',
  apparsa: 'appeared',

  // --- mostrare (to show) ---
  mostro: 'I show', mostri: 'you show', mostra: 'shows', mostriamo: 'we show',
  mostrano: 'they show', mostrò: 'showed', mostrarono: 'showed',
  mostrava: 'showed', mostrerà: 'will show', mostrando: 'showing',
  mostrato: 'shown', mostrare: 'to show',

  // --- missing prendere forms ---
  prenderò: 'I will take', prenderemo: 'we will take', prenderanno: 'will take',

  // --- more missing nouns ---
  cose: 'things', porte: 'doors/gates', cuori: 'hearts', segni: 'signs',
  frutto: 'fruit', frutti: 'fruits',
  uccelli: 'birds', corvi: 'ravens', colomba: 'dove', colombe: 'doves',
  tromba: 'trumpet', trombe: 'trumpets', arpa: 'harp', arpe: 'harps',
  cetra: 'lyre', cetere: 'lyres', cimbali: 'cymbals', timpani: 'tambourines',
  flauto: 'flute', flauti: 'flutes', strumento: 'instrument',
  corde: 'strings/cords', suono: 'sound', danza: 'dance', danze: 'dances',
  inno: 'hymn', inni: 'hymns', salmo: 'psalm', salmi: 'psalms',
  magazzino: 'storehouse', santuario: 'sanctuary',
  sicomoro: 'sycamore',
  pienezza: 'fullness', statura: 'stature',
  capi: 'leaders/heads', fianco: 'side/flank', chiodi: 'nails', petto: 'chest',
  anello: 'ring', collo: 'neck', mensa: 'table/banquet', conto: 'account',
  tralci: 'branches/vines',
  pungolo: 'goad/sting', strage: 'massacre', stirpe: 'lineage',

  // --- key adjectives / participles still missing ---
  duro: 'hard', dura: 'hard', duri: 'hard',
  gran: 'great', grasso: 'fat', grassa: 'fat',
  esaltato: 'exalted', esaltata: 'exalted', esaltati: 'exalted',
  infame: 'infamous', solitario: 'solitary', solitaria: 'solitary',
  interi: 'whole', intera: 'whole',
  potenti: 'the powerful', oppressi: 'the oppressed',
  perseguiti: 'persecuted', legati: 'bound',
  sacro: 'sacred', sacra: 'sacred', sacri: 'sacred', sacre: 'sacred',
  scritto: 'written', scritta: 'written', scritti: 'written',
  tentato: 'tempted', tentata: 'tempted', tentati: 'tempted',
  manifestato: 'manifested', manifestata: 'manifested',
  santificato: 'sanctified', santificata: 'sanctified', santificati: 'sanctified',
  costruttori: 'builders', costruttore: 'builder',
  fuggiti: 'fled', fuggito: 'fled',
  dissoluto: 'prodigal', dissoluta: 'prodigal',
  scartato: 'rejected', scartata: 'rejected',
  unigenito: 'only begotten',

  // --- additional pronouns / adverbs ---
  alcun: 'some',
  persone: 'people', compagni: 'companions', amici: 'friends',
  causa: 'cause/reason', merito: 'merit',
  mediante: 'through/by means of', gratuitamente: 'freely/without cost',
  sino: 'up to/until', termine: 'end/term',
  dito: 'finger', dita: 'fingers',
  distanza: 'distance', altezza: 'height', profondità: 'depth',
  estremità: 'ends/extremities', firmamento: 'sky/firmament',
  splende: 'shines', esiste: 'exists', produce: 'produces',
  vale: 'is worth', respira: 'breathes', soffia: 'blows',

  // --- missing verb forms from existing paradigms ---
  annunceranno: 'will proclaim', annuncierà: 'will proclaim',
  vidi: 'I saw', trovati: 'found',
  posarono: 'placed', pose: 'placed', posato: 'placed',
  condotto: 'led', condusse: 'led', condussero: 'led', conduca: 'lead',
  condurre: 'to lead', conduceva: 'was leading',
  ordinò: 'ordered', ordinarono: 'ordered', ordina: 'orders', ordinare: 'to order',
  giunse: 'arrived', giunsero: 'arrived',
  interrogò: 'questioned', interrogarono: 'questioned', interrogare: 'to question',
  insegnando: 'teaching', insegnò: 'taught', insegnarono: 'taught',
  insegnava: 'was teaching', insegnerà: 'will teach',
  presentò: 'presented', presentarono: 'presented', presenta: 'presents',
  riversato: 'poured out', riversò: 'poured out',
  rinnovando: 'renewing', rinnova: 'renews', rinnovarsi: 'to renew',
  allontanò: 'moved away', allontanarsi: 'to move away',
  avvolse: 'wrapped', avvolgere: 'to wrap',
  baciò: 'kissed', baciare: 'to kiss', baciava: 'was kissing',
  chiuse: 'closed', chiusero: 'closed', chiudeva: 'was closing',
  chiudere: 'to close',
  dividevano: 'were dividing', divise: 'divided', dividere: 'to divide',
  conformatevi: 'conform yourselves', conformarsi: 'to conform',
  convincere: 'to convince', convinse: 'convinced', convinceva: 'was convincing',
  esalta: 'exalts', esaltò: 'exalted', esaltare: 'to exalt',
  batteva: 'was knocking/beating', battono: 'they knock', bussano: 'they knock',
  bussate: 'knock', bussò: 'knocked',
  attaccatevi: 'cling to', avvicinarsi: 'to draw near', avvicinò: 'drew near',
  riacquistò: 'recovered', riacquisti: 'recover', riacquistare: 'to recover',
  rubare: 'to steal', ruba: 'steals', rubò: 'stole', rubavano: 'were stealing',
  maledicono: 'they curse', maledire: 'to curse', maleducono: 'they curse',
  maltrattano: 'they mistreat', maltrattare: 'to mistreat',
  sciolsero: 'loosened/untied', scioglie: 'loosens', sciogliere: 'to untie',
  scoppiò: 'burst out', scoppiare: 'to burst',
  scosse: 'shook', scrollò: 'shook', scuotere: 'to shake',
  umilia: 'humbles', umiliò: 'humbled', umiliarsi: 'to humble oneself',
  umiliato: 'humiliated', umiliata: 'humiliated',
  benedite: 'bless/blessed', benedire: 'to bless', benedì: 'blessed',
  benedicono: 'they bless',
  corsa: 'running/race', corse: 'ran', correre: 'to run', correva: 'was running',
  lavorando: 'working', lavorò: 'worked', lavorare: 'to work', lavora: 'works',
  insultano: 'they insult', insulteranno: 'will insult', insultare: 'to insult',
  disprezzeranno: 'will despise', disprezza: 'despises', disprezzare: 'to despise',
  desiderare: 'to desire', desidera: 'desires', desiderava: 'desired',

  // --- more nouns ---
  dottore: 'teacher/doctor', dottori: 'teachers', ladri: 'thieves', ladro: 'thief',
  culto: 'worship', domanda: 'question/request', domande: 'questions',
  sostanze: 'possessions', proprietà: 'property', pascere: 'to graze/feed',
  sentimenti: 'feelings', sentimento: 'feeling', maniere: 'manners/ways',
  imitazione: 'imitation', differenza: 'difference', professione: 'confession/profession',
  precetto: 'commandment/precept', precetti: 'commandments',
  ricompensa: 'reward', ricompense: 'rewards', pratica: 'practice',
  discernere: 'to discern', disegno: 'design/plan',
  prova: 'test/trial', provata: 'tested/proven',
  minaccia: 'threat', minacce: 'threats', pericolo: 'danger',
  viso: 'face', vista: 'sight/vision', sguardo: 'gaze/glance',
  volte: 'times', vicenda: 'turn/event',

  // --- important adjectives still missing ---
  rifiutato: 'rejected', rifiutata: 'rejected', rifiutati: 'rejected',
  presente: 'present', presenti: 'present', preparato: 'prepared',
  inviato: 'sent', inviati: 'sent', inviata: 'sent',
  effuso: 'poured out', effusa: 'poured out',
  fraterno: 'brotherly/fraternal', vicendevole: 'mutual', vicendevoli: 'mutual',

  // --- discourse connectors ---
  ecco: 'behold', perciò: 'therefore', pertanto: 'therefore',
  anzitutto: 'first of all', infine: 'finally',
  frattanto: 'meanwhile',
  esorto: 'I exhort', gareggiate: 'strive',
}));

// Returns the English gloss for a common Italian word, or null if not found.
export function lookupCommon(word) {
  if (!word) return null;
  return MAP.get(word.toLowerCase()) || null;
}
