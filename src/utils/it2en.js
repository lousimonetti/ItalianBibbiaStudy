// Common Italian → English word lookup for inline gloss support.
// Covers function words, high-frequency verb forms, and common biblical nouns/adjectives
// that don't appear in the 259-word vocab index. Used by WordGloss for non-vocab words.

const MAP = new Map(Object.entries({
  // --- definite articles ---
  il: 'the', lo: 'the', la: 'the', i: 'the', gli: 'the', le: 'the',

  // --- indefinite articles ---
  un: 'a', uno: 'a', una: 'a',

  // --- prepositions ---
  di: 'of', da: 'from', in: 'in', con: 'with', su: 'on', per: 'for',
  tra: 'between', fra: 'between', a: 'to', ad: 'to', verso: 'toward',
  attraverso: 'through', dopo: 'after', prima: 'before', durante: 'during',
  senza: 'without', contro: 'against', circa: 'about', oltre: 'beyond',
  presso: 'near', secondo: 'according to', sopra: 'above', sotto: 'under',
  dentro: 'inside', fuori: 'outside', fino: 'until', tranne: 'except',

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
  altrimenti: 'otherwise', nonostante: 'despite', sebbene: 'although',
  giacché: 'since', sicché: 'so that',

  // --- personal pronouns (avoid duplicating article keys: lo/gli/le stay as articles) ---
  io: 'I', tu: 'you', lui: 'he', lei: 'she', esso: 'it', essa: 'it',
  noi: 'we', voi: 'you', loro: 'they', essi: 'they', esse: 'they',
  me: 'me', te: 'you',
  mi: 'me', ti: 'you', si: 'himself', ci: 'us', vi: 'you',
  li: 'them', ne: 'of it',

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
  certi: 'certain', certe: 'certain',

  // --- adverbs ---
  non: 'not', no: 'no', sì: 'yes', già: 'already',
  ancora: 'still', mai: 'never', sempre: 'always', spesso: 'often',
  qui: 'here', qua: 'here', là: 'there', lì: 'there',
  ora: 'now', adesso: 'now', poi: 'then', subito: 'immediately',
  presto: 'soon', tardi: 'late', bene: 'well', male: 'badly',
  così: 'thus', molto: 'very', poco: 'little', troppo: 'too',
  davvero: 'truly', proprio: 'really', forse: 'perhaps',
  insieme: 'together', soltanto: 'only', solo: 'only', appena: 'just',
  quasi: 'almost', abbastanza: 'enough', senza: 'without',
  naturalmente: 'naturally', certamente: 'certainly',
  sicuramente: 'surely', veramente: 'truly', finalmente: 'finally',
  principalmente: 'mainly', soprattutto: 'above all',
  particolarmente: 'particularly', specialmente: 'especially',
  volentieri: 'gladly',

  // --- numbers ---
  uno: 'one', due: 'two', tre: 'three', quattro: 'four', cinque: 'five',
  sei: 'six', sette: 'seven', otto: 'eight', nove: 'nine', dieci: 'ten',
  undici: 'eleven', dodici: 'twelve', venti: 'twenty', trenta: 'thirty',
  cento: 'one hundred', mille: 'one thousand', primo: 'first',
  secondo: 'second', terzo: 'third', quarto: 'fourth', quinto: 'fifth',

  // --- essere (to be) ---
  sono: 'am/are', sei: 'are', è: 'is', siamo: 'we are', siete: 'you are',
  era: 'was', eri: 'were', eravamo: 'we were', eravate: 'you were',
  erano: 'were', sarà: 'will be', saranno: 'will be', sarei: 'would be',
  fu: 'was', fui: 'was', furono: 'were', fosse: 'were', sia: 'be',
  siano: 'be', essendo: 'being', stato: 'been', stata: 'been',
  stati: 'been', state: 'been', essere: 'to be',

  // --- avere (to have) ---
  ho: 'I have', hai: 'you have', ha: 'has', abbiamo: 'we have',
  avete: 'you have', hanno: 'they have', aveva: 'had', avevo: 'had',
  avevi: 'had', avevamo: 'had', avevano: 'had', avrà: 'will have',
  avranno: 'will have', ebbe: 'had', ebbero: 'had', avrebbe: 'would have',
  abbia: 'have', abbiano: 'have', avendo: 'having', avuto: 'had',
  avere: 'to have',

  // --- fare (to do/make) ---
  faccio: 'I do', fai: 'you do', fa: 'does', facciamo: 'we do',
  fate: 'you do', fanno: 'they do', fece: 'did', fecero: 'did',
  faceva: 'was doing', facevano: 'were doing', farà: 'will do',
  faranno: 'will do', farebbe: 'would do', faccia: 'do', facciano: 'do',
  facendo: 'doing', fatto: 'done', fare: 'to do',

  // --- dire (to say) ---
  dico: 'I say', dici: 'you say', dice: 'says', diciamo: 'we say',
  dite: 'you say', dicono: 'they say', disse: 'said', dissero: 'said',
  diceva: 'was saying', dicevano: 'were saying', dirà: 'will say',
  direbbe: 'would say', dica: 'say', dicano: 'say', dicendo: 'saying',
  detto: 'said', dire: 'to say',

  // --- andare (to go) ---
  vado: 'I go', vai: 'you go', va: 'goes', andiamo: 'we go',
  andate: 'you go', vanno: 'they go', andò: 'went', andarono: 'went',
  andava: 'was going', andavano: 'were going', andrà: 'will go',
  andranno: 'will go', andrebbe: 'would go', vada: 'go',
  andando: 'going', andato: 'gone', andare: 'to go',

  // --- venire (to come) ---
  vengo: 'I come', vieni: 'you come', viene: 'comes', veniamo: 'we come',
  venite: 'you come', vengono: 'they come', venne: 'came', vennero: 'came',
  veniva: 'was coming', venivano: 'were coming', verrà: 'will come',
  verranno: 'will come', verrebbe: 'would come', venga: 'come',
  venendo: 'coming', venuto: 'come', venire: 'to come',

  // --- dare (to give) ---
  do: 'I give', dai: 'you give', dà: 'gives', diamo: 'we give',
  date: 'you give', danno: 'they give', diede: 'gave', diedero: 'gave',
  dava: 'was giving', davano: 'were giving', darà: 'will give',
  daranno: 'will give', darebbe: 'would give', dia: 'give',
  dando: 'giving', dato: 'given', dare: 'to give',

  // --- potere (can/be able) ---
  posso: 'I can', puoi: 'you can', può: 'can', possiamo: 'we can',
  potete: 'you can', possono: 'they can', poteva: 'could', potevo: 'could',
  potevano: 'could', potrà: 'will be able', potrebbe: 'could',
  possa: 'can', potendo: 'being able', potuto: 'been able', potere: 'to be able',

  // --- volere (to want) ---
  voglio: 'I want', vuoi: 'you want', vuole: 'wants', vogliamo: 'we want',
  volete: 'you want', vogliono: 'they want', voleva: 'wanted', volevo: 'wanted',
  volevano: 'wanted', vorrà: 'will want', vorrebbe: 'would want',
  voglia: 'want', volendo: 'wanting', voluto: 'wanted', volere: 'to want',

  // --- dovere (must/have to) ---
  devo: 'I must', devi: 'you must', deve: 'must', dobbiamo: 'we must',
  dovete: 'you must', devono: 'they must', doveva: 'had to', dovevo: 'had to',
  dovevano: 'had to', dovrà: 'will have to', dovrebbe: 'should',
  debba: 'must', dovendo: 'having to', dovuto: 'had to', dovere: 'to have to',

  // --- sapere (to know) ---
  so: 'I know', sai: 'you know', sa: 'knows', sappiamo: 'we know',
  sapete: 'you know', sanno: 'they know', sapeva: 'knew', sapevo: 'knew',
  sapevano: 'knew', saprà: 'will know', saprebbe: 'would know',
  sappia: 'know', sapendo: 'knowing', saputo: 'known', sapere: 'to know',

  // --- stare (to stay/be) ---
  sto: 'I am', stai: 'you are', sta: 'is', stiamo: 'we are',
  state: 'you are', stanno: 'they are', stava: 'was', stavo: 'was',
  stavano: 'were', starà: 'will be', rimarrà: 'will remain',
  stia: 'be', stando: 'being', rimasto: 'stayed', stare: 'to be',

  // --- vedere (to see) ---
  vedo: 'I see', vedi: 'you see', vede: 'sees', vediamo: 'we see',
  vedete: 'you see', vedono: 'they see', vide: 'saw', videro: 'saw',
  vedeva: 'was seeing', vedevano: 'were seeing', vedrà: 'will see',
  vedrebbe: 'would see', veda: 'see', vedendo: 'seeing',
  visto: 'seen', vedere: 'to see',

  // --- parlare (to speak) ---
  parlo: 'I speak', parli: 'you speak', parla: 'speaks', parliamo: 'we speak',
  parlate: 'you speak', parlano: 'they speak', parlò: 'spoke', parlarono: 'spoke',
  parlava: 'spoke', parlavano: 'spoke', parlerà: 'will speak',
  parlando: 'speaking', parlato: 'spoken', parlare: 'to speak',

  // --- chiamare (to call) ---
  chiamo: 'I call', chiami: 'you call', chiama: 'calls', chiamiamo: 'we call',
  chiamate: 'you call', chiamano: 'they call', chiamò: 'called', chiamarono: 'called',
  chiamava: 'called', chiamerà: 'will call', chiamando: 'calling',
  chiamato: 'called', chiamare: 'to call',

  // --- trovare (to find) ---
  trovo: 'I find', trovi: 'you find', trova: 'finds', troviamo: 'we find',
  trovate: 'you find', trovano: 'they find', trovò: 'found', trovarono: 'found',
  trovava: 'was finding', troverà: 'will find', trovando: 'finding',
  trovato: 'found', trovare: 'to find',

  // --- amare (to love) ---
  amo: 'I love', ami: 'you love', ama: 'loves', amiamo: 'we love',
  amate: 'you love', amano: 'they love', amò: 'loved', amarono: 'loved',
  amava: 'loved', amerà: 'will love', amando: 'loving',
  amato: 'loved', amare: 'to love',

  // --- credere (to believe) ---
  credo: 'I believe', credi: 'you believe', crede: 'believes', crediamo: 'we believe',
  credete: 'you believe', credono: 'they believe', credette: 'believed',
  credevano: 'believed', crederà: 'will believe', credendo: 'believing',
  creduto: 'believed', credere: 'to believe',

  // --- sentire (to hear/feel) ---
  sento: 'I hear', senti: 'you hear', sente: 'hears', sentiamo: 'we hear',
  sentite: 'you hear', sentono: 'they hear', sentì: 'heard', sentirono: 'heard',
  sentiva: 'heard', sentirà: 'will hear', sentendo: 'hearing',
  sentito: 'heard', sentire: 'to hear',

  // --- seguire (to follow) ---
  seguo: 'I follow', segui: 'you follow', segue: 'follows', seguiamo: 'we follow',
  seguite: 'you follow', seguono: 'they follow', seguì: 'followed',
  seguiva: 'followed', seguirà: 'will follow', seguendo: 'following',
  seguito: 'followed', seguire: 'to follow',

  // --- entrare (to enter) ---
  entro: 'I enter', entri: 'you enter', entra: 'enters', entriamo: 'we enter',
  entrate: 'you enter', entrano: 'they enter', entrò: 'entered',
  entrava: 'was entering', entrerà: 'will enter', entrando: 'entering',
  entrato: 'entered', entrare: 'to enter',

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
  prendeva: 'was taking', prenderà: 'will take', prendendo: 'taking',
  preso: 'taken', prendere: 'to take',

  // --- portare (to bring/carry) ---
  porto: 'I bring', porti: 'you bring', porta: 'brings', portiamo: 'we bring',
  portate: 'you bring', portano: 'they bring', portò: 'brought', portarono: 'brought',
  portava: 'brought', porterà: 'will bring', portando: 'bringing',
  portato: 'brought', portare: 'to bring',

  // --- mandare (to send) ---
  mando: 'I send', mandi: 'you send', manda: 'sends', mandiamo: 'we send',
  mandate: 'you send', mandano: 'they send', mandò: 'sent', mandarono: 'sent',
  mandava: 'sent', manderà: 'will send', mandando: 'sending',
  mandato: 'sent', mandare: 'to send',

  // --- alzare/alzarsi (to rise/raise) ---
  alzò: 'rose', alzati: 'rise up', alzarsi: 'to rise', alzato: 'risen',

  // --- tornare (to return) ---
  torno: 'I return', torni: 'you return', torna: 'returns', torniamo: 'we return',
  tornate: 'you return', tornano: 'they return', tornò: 'returned',
  tornava: 'returned', tornerà: 'will return', tornando: 'returning',
  tornato: 'returned', tornare: 'to return',

  // --- ricevere (to receive) ---
  ricevo: 'I receive', ricevi: 'you receive', riceve: 'receives',
  riceviamo: 'we receive', ricevete: 'you receive', ricevono: 'they receive',
  ricevette: 'received', ricevevano: 'received', riceverà: 'will receive',
  ricevendo: 'receiving', ricevuto: 'received', ricevere: 'to receive',

  // --- common adjectives ---
  grande: 'great', grandi: 'great', piccolo: 'small', piccola: 'small',
  buono: 'good', buona: 'good', buoni: 'good', buone: 'good',
  bello: 'beautiful', bella: 'beautiful', belli: 'beautiful', belle: 'beautiful',
  nuovo: 'new', nuova: 'new', nuovi: 'new', nuove: 'new',
  vecchio: 'old', vecchia: 'old', vecchi: 'old', vecchie: 'old',
  alto: 'high', alta: 'high', basso: 'low', bassa: 'low',
  lungo: 'long', lunga: 'long', breve: 'brief', brevi: 'brief',
  vero: 'true', vera: 'true', veri: 'true', vere: 'true',
  falso: 'false', falsa: 'false', giusto: 'right', giusta: 'right',
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
  maledetto: 'cursed', maledetta: 'cursed', amato: 'beloved', amata: 'beloved',
  amati: 'beloved', amate: 'beloved',

  // --- common nouns (general) ---
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
  creazione: 'creation', cielo: 'sky', cieli: 'heavens',

  // --- proper names (biblical) ---
  gesù: 'Jesus', cristo: 'Christ', dio: 'God', signore: 'Lord',
  padre: 'Father', figlio: 'Son', spirito: 'Spirit',
  giovanni: 'John', pietro: 'Peter', paolo: 'Paul', giacomo: 'James',
  maria: 'Mary', giuseppe: 'Joseph', abramo: 'Abraham', mosè: 'Moses',
  davide: 'David', salomone: 'Solomon', isaia: 'Isaiah',
  geremia: 'Jeremiah', elia: 'Elijah', eliseo: 'Elisha',
  israele: 'Israel', giuda: 'Judah', gerusalemme: 'Jerusalem',
  betlemme: 'Bethlehem', nazaret: 'Nazareth', egitto: 'Egypt',
  babilonia: 'Babylon', roma: 'Rome', giordano: 'Jordan',
  galilea: 'Galilee', giudea: 'Judea', samaria: 'Samaria',
  nazareno: 'Nazarene', galileo: 'Galilean',

  // --- common sentence connectors / phrases (single-word) ---
  ecco: 'behold', allora: 'then', perciò: 'therefore', pertanto: 'therefore',
  tuttavia: 'nevertheless', anzitutto: 'first of all', infine: 'finally',
  poi: 'then', subito: 'immediately', ancora: 'again',
}));

// Returns the English gloss for a common Italian word, or null if not found.
export function lookupCommon(word) {
  if (!word) return null;
  return MAP.get(word.toLowerCase()) || null;
}
