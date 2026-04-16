// scripts/generate-anki.cjs
// Run: node scripts/generate-anki.cjs
// Outputs .apkg files to public/anki/

'use strict';

const ApkgExport = require('anki-apkg-export').default;
const fs = require('fs');
const path = require('path');

// ── Study data (duplicated here to keep this script standalone) ──────────────

const PHASES = [
  {
    id: 'p1', label: 'Phase 1 — John', file: 'phase-1-john',
    weeks: [
      { n: 1, r: 'John 1-2', vocab: [['il Verbo','the Word','In principio era il Verbo'],['la luce','the light','La luce splende'],['le tenebre','the darkness','le tenebre non la vinsero'],['la vita','life','in lui era la vita'],['credere','to believe','ha creduto in lui'],['il miracolo','the miracle','primo dei suoi miracoli'],['il mondo','the world','il mondo è stato fatto per mezzo di lui']] },
      { n: 2, r: 'John 3-4', vocab: [['nascere','to be born','bisogna nascere di nuovo'],['lo Spirito','the Spirit','lo Spirito soffia dove vuole'],['il pozzo','the well','sedeva presso il pozzo'],['adorare','to worship','i veri adoratori'],['il Salvatore','the Savior','il Salvatore del mondo'],['credere','to believe','chi crede in lui'],['il dono','the gift','se conoscessi il dono di Dio']] },
      { n: 3, r: 'John 5-6', vocab: [['guarire','to heal','lo ha guarito'],['il pane','bread','sono io il pane della vita'],['la folla','the crowd','la folla grande lo seguiva'],['saziarsi','to be satisfied','mangiarono e si saziarono'],['la vita eterna','eternal life','ha la vita eterna'],['la manna','manna','i nostri padri mangiarono la manna'],['il segno','the sign','quale segno fai tu?']] },
      { n: 4, r: 'John 7-8', vocab: [['insegnare','to teach','insegnava nel tempio'],['la verità','the truth','la verità vi farà liberi'],['liberare','to set free','vi farà liberi'],['giudicare','to judge','non giudicate secondo l\'apparenza'],['il peccato','sin','chi di voi è senza peccato'],['scrivere','to write','scriveva per terra'],['luce del mondo','light of the world','sono la luce del mondo']] },
      { n: 5, r: 'John 9-11', vocab: [['il cieco','blind man','un uomo cieco dalla nascita'],['vedere','to see','ora vedo'],['il buon pastore','the good shepherd','io sono il buon pastore'],['la pecora','sheep','conosce le mie pecore'],['la tomba','tomb','dov\'è il sepolcro?'],['risuscitare','to raise from dead','io sono la risurrezione'],['piangere','to weep','Gesù scoppiò in pianto']] },
      { n: 6, r: 'John 12-14', vocab: [['l\'unzione','the anointing','l\'unzione a Betania'],['l\'asino','the donkey','seduto su un asino'],['lavare i piedi','wash feet','lavò i piedi ai discepoli'],['il tradimento','betrayal','annunciò il suo traditore'],['la casa del Padre','Father\'s house','nella casa del Padre'],['il Paraclito','the Paraclete','vi manderà il Paraclito'],['la via','the way','io sono la via']] },
      { n: 7, r: 'John 15-17', vocab: [['la vite','the vine','io sono la vite vera'],['il tralcio','the branch','ogni tralcio in me'],['portare frutto','to bear fruit','portiate molto frutto'],['il comandamento','commandment','questo è il mio comandamento'],['rimanere','to remain','rimanete nel mio amore'],['il mondo','the world','il mondo vi odierà'],['la preghiera','prayer','pregò per i suoi discepoli']] },
      { n: 8, r: 'John 18-21', vocab: [['l\'arresto','the arrest','l\'arresto nel Getsemani'],['il rinnegamento','the denial','il rinnegamento di Pietro'],['la crocifissione','crucifixion','portò la sua croce'],['il sepolcro vuoto','empty tomb','il sepolcro era vuoto'],['la resurrezione','the resurrection','sono risorto'],['la missione','the mission','come il Padre ha mandato me'],['la pace','peace','la pace sia con voi']] },
    ]
  },
  {
    id: 'p2', label: 'Phase 2 — Luke', file: 'phase-2-luke',
    weeks: [
      { n: 9,  r: 'Luke 1-2',   vocab: [['l\'annuncio','the announcement','l\'annunciazione a Maria'],['l\'angelo','the angel','l\'angelo Gabriele'],['benedetto','blessed','benedetta tu fra le donne'],['la nascita','birth','la nascita di Gesù'],['la mangiatoia','manger','lo depose nella mangiatoia'],['i pastori','shepherds','i pastori andarono a Betlemme'],['il Magnificat','Magnificat','l\'anima mia magnifica il Signore']] },
      { n: 10, r: 'Luke 3-5',   vocab: [['il battesimo','baptism','il battesimo di Gesù'],['il deserto','desert','quaranta giorni nel deserto'],['la tentazione','temptation','le tentazioni del diavolo'],['la rete','net','gettate le reti'],['il lebbroso','leper','un uomo pieno di lebbra'],['perdonare','to forgive','ti sono perdonati i peccati'],['camminare','to walk','alzati e cammina']] },
      { n: 11, r: 'Luke 6-7',   vocab: [['le beatitudini','the beatitudes','beati voi poveri'],['il nemico','the enemy','amate i vostri nemici'],['il centurione','centurion','il servo del centurione'],['la vedova','widow','la vedova di Naim'],['il fariseo','Pharisee','un fariseo lo invitò'],['perdonare','to forgive','le sue peccata le sono perdonate'],['il profeta','the prophet','un grande profeta è sorto']] },
      { n: 12, r: 'Luke 8-9',   vocab: [['la tempesta','storm','calmò la tempesta'],['i demoni','demons','i demoni lo supplicavano'],['la fede','faith','la tua fede ti ha salvata'],['guarire','to heal','aveva guarito molti'],['la trasfigurazione','transfiguration','la trasfigurazione sul monte'],['la croce','cross','prenda la sua croce'],['le provviste','provisions','non prendete nulla per il viaggio']] },
      { n: 13, r: 'Luke 10-11', vocab: [['il samaritano','Samaritan','il buon samaritano'],['il prossimo','neighbor','chi è il mio prossimo?'],['l\'olio','oil','versò olio e vino'],['pregare','to pray','insegnateci a pregare'],['il Padre Nostro','Lord\'s Prayer','Padre nostro, che sei nei cieli'],['chiedere','to ask','chiedete e vi sarà dato'],['il demonio','demon','scacciava un demonio']] },
      { n: 14, r: 'Luke 12-13', vocab: [['la ricchezza','wealth','la vita non dipende dalla ricchezza'],['il granaio','granary','costruirò granai più grandi'],['preoccuparsi','to worry','non preoccupatevi per la vita'],['il fico','fig tree','un uomo aveva un fico'],['la porta stretta','narrow gate','entrate per la porta stretta'],['l\'ipocrita','hypocrite','ipocriti!'],['il regno di Dio','kingdom of God','il regno di Dio è vicino']] },
      { n: 15, r: 'Luke 14-16', vocab: [['il banchetto','banquet','diede un grande banchetto'],['l\'invitato','guest','gli invitati non vennero'],['la pecora perduta','lost sheep','se perde una delle cento pecore'],['il figlio prodigo','prodigal son','il figlio minore'],['il padre misericordioso','merciful father','gli corse incontro'],['abbracciare','to embrace','lo abbracciò e lo baciò'],['la festa','the celebration','facciamo festa']] },
      { n: 16, r: 'Luke 17-18', vocab: [['la gratitudine','gratitude','il samaritano ha reso grazie'],['l\'umiltà','humility','chi si umilia sarà esaltato'],['il giudice','judge','il giudice ingiusto'],['la vedova','widow','la vedova veniva da lui'],['il pubblicano','tax collector','il pubblicano non osava'],['la fede','faith','la tua fede ti ha salvato'],['i bambini','children','lasciate che i bambini vengano']] },
      { n: 17, r: 'Luke 19-21', vocab: [['Zaccheo','Zacchaeus','Zaccheo era un pubblicano ricco'],['la salvezza','salvation','oggi la salvezza è entrata in questa casa'],['il tempio','temple','purificò il tempio'],['l\'asino','donkey','trovate un asino'],['la moneta','coin','la moneta della vedova'],['vigilare','to watch','vigilate e pregate'],['la distruzione','destruction','distruggeranno i tuoi nemici']] },
      { n: 18, r: 'Luke 22-24', vocab: [['il tradimento','betrayal','Giuda lo consegnò'],['l\'ultima cena','Last Supper','diede loro il pane'],['il calice','chalice/cup','questo calice è la nuova alleanza'],['la passione','passion/suffering','la passione di Cristo'],['Emmaus','Emmaus','la strada di Emmaus'],['l\'ascensione','ascension','fu portato in cielo'],['la benedizione','blessing','li benedì e si allontanò']] },
    ]
  },
  {
    id: 'p3', label: 'Phase 3 — Acts', file: 'phase-3-acts',
    weeks: [
      { n: 19, r: 'Acts 1-3',   vocab: [['l\'ascensione','ascension','fu elevato in alto'],['la Pentecoste','Pentecost','il giorno di Pentecoste'],['lo Spirito Santo','Holy Spirit','furono tutti pieni di Spirito Santo'],['le lingue di fuoco','tongues of fire','lingue come di fuoco'],['battezzarsi','to be baptized','battezzatevi'],['il peccato','sin','per la remissione dei peccati'],['la comunità','community','erano assidui nella comunione']] },
      { n: 20, r: 'Acts 4-6',   vocab: [['la guarigione','healing','la guarigione dello storpio'],['la prigione','prison','li gettarono in prigione'],['Anania','Ananias','Anania con Saffira sua moglie'],['mentire','to lie','hai mentito allo Spirito Santo'],['i diaconi','deacons','scelsero sette uomini'],['Stefano','Stephen','Stefano era pieno di grazia'],['la persecuzione','persecution','scoppiò una grande persecuzione']] },
      { n: 21, r: 'Acts 7-9',   vocab: [['il martirio','martyrdom','la morte di Stefano'],['la lapidazione','stoning','lo lapidavano'],['Saulo','Saul','Saulo approvava la sua uccisione'],['la conversione','conversion','la conversione di Paolo'],['la via di Damasco','road to Damascus','sulla via di Damasco'],['cieco','blind','per tre giorni non vide nulla'],['il battesimo','baptism','fu battezzato']] },
      { n: 22, r: 'Acts 10-12', vocab: [['la visione','vision','Pietro ebbe una visione'],['Cornelio','Cornelius','il centurione Cornelio'],['i pagani','Gentiles','il vangelo anche ai pagani'],['il battesimo','baptism','chi può impedire il battesimo?'],['l\'angelo','angel','un angelo del Signore apparve'],['il carcere','prison','Pietro era in carcere'],['Erode','Herod','Erode lo aveva arrestato']] },
      { n: 23, r: 'Acts 13-15', vocab: [['il viaggio missionario','missionary journey','il primo viaggio'],['Barnaba','Barnabas','Barnaba e Paolo'],['la sinagoga','synagogue','entrarono nella sinagoga'],['il concilio','council','il concilio di Gerusalemme'],['la circoncisione','circumcision','la questione della circoncisione'],['la grazia','grace','vivere nella grazia di Dio'],['annunciare','to announce','annunciarono la parola di Dio']] },
      { n: 24, r: 'Acts 16-18', vocab: [['Lidia','Lydia','Lidia apriva il cuore'],['il terremoto','earthquake','ci fu un gran terremoto'],['il carcere','prison','il custode del carcere'],['Corinto','Corinth','giunsero a Corinto'],['l\'Areopago','Areopagus','in mezzo all\'Areopago'],['il missionario','missionary','missionari instancabili'],['la sinagoga','synagogue','ogni sabato nella sinagoga']] },
      { n: 25, r: 'Acts 19-21', vocab: [['la magia','magic','bruciarono i libri di magia'],['il tumulto','riot','il tumulto degli artigiani'],['l\'argentiere','silversmith','Demetrio l\'argentiere'],['la profezia','prophecy','aveva quattro figlie profetesse'],['legare','to bind','lo legheranno e lo consegneranno'],['il viaggio','the journey','ci imbarcammo'],['lo Spirito','the Spirit','lo Spirito Santo mi attesta']] },
      { n: 26, r: 'Acts 22-24', vocab: [['la difesa','defense','la difesa di Paolo'],['il sinedrio','Sanhedrin','davanti al sinedrio'],['la congiura','conspiracy','una congiura contro Paolo'],['il governatore','governor','il governatore Felice'],['il processo','trial','durante il processo'],['il testimone','witness','sono testimone di queste cose'],['l\'accusa','accusation','le accuse contro Paolo']] },
      { n: 27, r: 'Acts 25-26', vocab: [['Festo','Festus','il governatore Festo'],['Agrippa','Agrippa','il re Agrippa'],['l\'appello','appeal','ho fatto appello a Cesare'],['la testimonianza','testimony','la mia testimonianza'],['convertirsi','to convert','perché si convertissero'],['la luce','light','una luce dal cielo'],['la grazia','grace','grazie alla grazia di Dio']] },
      { n: 28, r: 'Acts 27-28', vocab: [['il naufragio','shipwreck','il naufragio di Paolo'],['l\'isola','island','l\'isola di Malta'],['il serpente','snake','una vipera uscì dal fuoco'],['Roma','Rome','finalmente arrivammo a Roma'],['predicare','to preach','predicava il regno di Dio'],['l\'impedimento','hindrance','senza impedimento alcuno'],['la nave','ship','la nave si incagliò']] },
    ]
  },
  {
    id: 'p4', label: 'Phase 4 — Romans & Psalms', file: 'phase-4-romans-psalms',
    weeks: [
      { n: 29, r: 'Romans 1-2 + Psalm 1',              vocab: [['il vangelo','the gospel','il vangelo di Gesù Cristo'],['la giustizia','righteousness','la giustizia di Dio'],['il giudizio','judgment','il giudizio di Dio'],['l\'ira','wrath','l\'ira di Dio'],['l\'idolatria','idolatry','caduti nell\'idolatria'],['l\'albero','tree','come albero piantato'],['il cammino','the way/path','non cammina nel consiglio degli empi']] },
      { n: 30, r: 'Romans 3-4 + Psalm 23',             vocab: [['la fede','faith','giustificati per fede'],['la grazia','grace','per pura grazia'],['la redenzione','redemption','la redenzione in Cristo'],['il pastore','shepherd','il Signore è il mio pastore'],['l\'abbondanza','abundance','non manco di nulla'],['il calice','cup','il mio calice trabocca'],['la tenebrosa valle','dark valley','nella valle oscura']] },
      { n: 31, r: 'Romans 5-6 + Psalm 46',             vocab: [['la pace','peace','abbiamo pace con Dio'],['la sofferenza','suffering','glorificarci nelle sofferenze'],['la speranza','hope','la speranza non delude'],['il rifugio','refuge','Dio è il nostro rifugio'],['la forza','strength','la nostra forza'],['il battesimo','baptism','siamo stati battezzati in Cristo'],['la morte','death','morti al peccato']] },
      { n: 32, r: 'Romans 7-8 + Psalm 51',             vocab: [['la carne','flesh','la legge della carne'],['la condanna','condemnation','nessuna condanna per quelli in Cristo'],['la figliolanza','sonship','lo spirito di adozione filiale'],['la creazione','creation','tutta la creazione geme'],['la misericordia','mercy','abbi pietà di me'],['il cuore','heart','crea in me un cuore puro'],['il peccato','sin','mondami dalla mia colpa']] },
      { n: 33, r: 'Romans 9-10 + Psalm 91',            vocab: [['l\'elezione','election','l\'elezione per grazia'],['confessare','to confess','confessa con la tua bocca'],['credere nel cuore','believe in heart','credere nel cuore'],['la protezione','protection','sotto la sua protezione'],['il nome del Signore','name of the Lord','chiunque invoca il nome del Signore'],['essere salvato','to be saved','sarà salvato'],['il messaggero','messenger','come udranno senza un messaggero?']] },
      { n: 34, r: 'Romans 11-12 + Psalm 119 (excerpts)',vocab: [['il mistero','mystery','il mistero di Israele'],['il corpo di Cristo','body of Christ','un solo corpo in Cristo'],['i doni','gifts','doni diversi secondo la grazia'],['la Parola','the Word','la tua Parola è una lampada'],['il sentiero','path','luce sul mio sentiero'],['offrire','to offer','offrite i vostri corpi come sacrificio'],['rinnovarsi','to be renewed','rinnovatevi nella mente']] },
      { n: 35, r: 'Romans 13-14 + Psalm 121',          vocab: [['l\'autorità','authority','ogni persona sia sottomessa alle autorità'],['amare il prossimo','love neighbor','amerai il prossimo tuo'],['la coscienza','conscience','secondo la propria coscienza'],['il soccorso','help','il mio soccorso viene dal Signore'],['vegliare','to watch over','non si assopisce, non dorme'],['il custode','guardian','il Signore è il tuo custode'],['il viaggio','journey','il Signore protegge la tua vita']] },
      { n: 36, r: 'Romans 15-16 + Psalm 139',          vocab: [['la speranza','hope','il Dio della speranza'],['l\'unità','unity','l\'unità tra ebrei e pagani'],['i saluti','greetings','i saluti finali di Paolo'],['conoscere','to know','tu mi conosci'],['tessere','to weave','mi hai tessuto nel seno di mia madre'],['fuggire','to flee','dove fuggirò dalla tua presenza?'],['meraviglioso','wonderful','meravigliose sono le tue opere']] },
      { n: 37, r: 'Review + Psalm 150',                vocab: [['lodare','to praise','lodate il Signore'],['l\'alleluja','alleluia','alleluia!'],['gli strumenti','instruments','con la tromba, con l\'arpa'],['tutta la creazione','all creation','tutto ciò che respira'],['la gloria','glory','gloria a Dio'],['il Natale','Christmas','Buon Natale'],['la fine','the end','sei arrivato alla fine']] },
    ]
  },
];

// ── Pronunciations ─────────────────────────────────────────────────────────────
const PRON = {"il Verbo":"/il ˈvɛrbo/","la luce":"/la ˈluːtʃe/","le tenebre":"/le ˈtɛːnebɾe/","la vita":"/la ˈviːta/","credere":"/ˈkɾɛːdeɾe/","il miracolo":"/il miˈɾaːkolo/","il mondo":"/il ˈmondo/","nascere":"/ˈnaʃʃeɾe/","lo Spirito":"/lo ˈspiːɾito/","il pozzo":"/il ˈpɔttso/","adorare":"/adoˈɾaːɾe/","il Salvatore":"/il salvaˈtoːɾe/","il dono":"/il ˈdoːno/","guarire":"/ɡwaˈɾiːɾe/","il pane":"/il ˈpaːne/","la folla":"/la ˈfɔlla/","saziarsi":"/sattsˈjaɾsi/","la vita eterna":"/la ˈviːta eˈtɛɾna/","la manna":"/la ˈmanna/","il segno":"/il ˈseɲɲo/","insegnare":"/inseɲˈɲaːɾe/","la verità":"/la veɾiˈta/","liberare":"/libeˈɾaːɾe/","giudicare":"/dʒudiˈkaːɾe/","il peccato":"/il pekˈkaːto/","scrivere":"/ˈskɾiːveɾe/","luce del mondo":"/ˈluːtʃe del ˈmondo/","il cieco":"/il ˈtʃɛːko/","vedere":"/veˈdɛːɾe/","il buon pastore":"/il ˌbwɔn pasˈtoːɾe/","la pecora":"/la ˈpɛːkoɾa/","la tomba":"/la ˈtomba/","risuscitare":"/ɾizuʃʃiˈtaːɾe/","piangere":"/ˈpjandʒeɾe/","l'unzione":"/lunˈtsjone/","l'asino":"/ˈlaːzino/","lavare i piedi":"/laˈvaːɾe i ˈpjɛːdi/","il tradimento":"/il tɾadiˈmento/","la casa del Padre":"/la ˈkaːza del ˈpaːdɾe/","il Paraclito":"/il paˈɾaːklito/","la via":"/la ˈviːa/","la vite":"/la ˈviːte/","il tralcio":"/il ˈtɾaltʃo/","portare frutto":"/poɾˈtaːɾe ˈfɾutto/","il comandamento":"/il komandaˈmento/","rimanere":"/ɾimaˈnɛːɾe/","la preghiera":"/la pɾeˈɡjɛːɾa/","l'arresto":"/laɾˈɾɛsto/","il rinnegamento":"/il ɾinneɡaˈmento/","la crocifissione":"/la kɾotʃifisˈsjone/","il sepolcro vuoto":"/il seˈpɔlkɾo ˈvwɔto/","la resurrezione":"/la ɾezuɾɾetˈtsjone/","la missione":"/la misˈsjone/","la pace":"/la ˈpaːtʃe/","l'annuncio":"/lanˈnuntʃo/","l'angelo":"/ˈlandʒelo/","benedetto":"/beneˈdɛtto/","la nascita":"/la ˈnaʃʃita/","la mangiatoia":"/la mandʒaˈtɔːja/","i pastori":"/i pasˈtoːɾi/","il Magnificat":"/il maɲˈɲifikat/","il battesimo":"/il batˈtɛːzimo/","il deserto":"/il deˈzɛɾto/","la tentazione":"/la tentaˈtsjone/","la rete":"/la ˈɾɛːte/","il lebbroso":"/il lebˈbɾoːzo/","perdonare":"/peɾdoˈnaːɾe/","camminare":"/kammiˈnaːɾe/","le beatitudini":"/le beatituˈdiːni/","il nemico":"/il neˈmiːko/","il centurione":"/il tʃentuˈɾjone/","la vedova":"/la ˈvɛːdova/","il fariseo":"/il faɾiˈzɛːo/","la tempesta":"/la temˈpɛsta/","i demoni":"/i ˈdɛːmoni/","la fede":"/la ˈfɛːde/","la trasfigurazione":"/la tɾazfiɡuɾaˈtsjone/","la croce":"/la ˈkɾoːtʃe/","le provviste":"/le pɾovˈviste/","il samaritano":"/il samaɾiˈtaːno/","il prossimo":"/il ˈpɾɔssimo/","l'olio":"/ˈlɔːljo/","pregare":"/pɾeˈɡaːɾe/","il Padre Nostro":"/il ˈpaːdɾe ˈnɔstɾo/","chiedere":"/ˈkjɛːdeɾe/","il demonio":"/il deˈmɔːnjo/","la ricchezza":"/la ɾikˈkɛttsa/","il granaio":"/il ɡɾaˈnaːjo/","preoccuparsi":"/pɾeokkuˈpaɾsi/","il fico":"/il ˈfiːko/","la porta stretta":"/la ˈpɔɾta ˈstɾɛtta/","l'ipocrita":"/liˈpɔːkɾita/","il regno di Dio":"/il ˈɾeɲɲo di ˈdiːo/","il banchetto":"/il baŋˈkɛtto/","l'invitato":"/linviˈtaːto/","la pecora perduta":"/la ˈpɛːkoɾa peɾˈduːta/","il figlio prodigo":"/il ˈfiʎʎo ˈpɾɔːdiɡo/","il padre misericordioso":"/il ˈpaːdɾe mizeɾikoɾˈdjoːzo/","abbracciare":"/abbɾatˈtʃaːɾe/","la festa":"/la ˈfɛsta/","la gratitudine":"/la ɡɾatiˈtuːdine/","l'umiltà":"/lumiˈlta/","il giudice":"/il ˈdʒuːditʃe/","il pubblicano":"/il pubbliˈkaːno/","i bambini":"/i bamˈbiːni/","Zaccheo":"/zakˈkɛːo/","la salvezza":"/la salˈvɛttsa/","il tempio":"/il ˈtɛmpjo/","la moneta":"/la moˈnɛːta/","vigilare":"/vidʒiˈlaːɾe/","la distruzione":"/la distɾutˈtsjone/","l'ultima cena":"/ˈlultima ˈtʃɛːna/","il calice":"/il ˈkaːlitʃe/","la passione":"/la pasˈsjone/","Emmaus":"/emˈmaus/","l'ascensione":"/laʃʃenˈsjone/","la benedizione":"/la benediˈtsjone/","la Pentecoste":"/la penteˈkɔste/","lo Spirito Santo":"/lo ˈspiːɾito ˈsanto/","le lingue di fuoco":"/le ˈliŋɡwe di ˈfwɔːko/","battezzarsi":"/battedˈdzaɾsi/","la comunità":"/la komuniˈta/","la guarigione":"/la ɡwaɾiˈdʒone/","la prigione":"/la pɾiˈdʒone/","Anania":"/aˈnaːnja/","mentire":"/menˈtiːɾe/","i diaconi":"/i ˈdjaːkoni/","Stefano":"/ˈstɛːfano/","la persecuzione":"/la peɾsekutˈtsjone/","il martirio":"/il maɾˈtiːɾjo/","la lapidazione":"/la lapidaˈtsjone/","Saulo":"/ˈsaulo/","la conversione":"/la konveɾˈsjone/","la via di Damasco":"/la ˈviːa di daˈmasko/","cieco":"/ˈtʃɛːko/","la visione":"/la viˈzjone/","Cornelio":"/koɾˈnɛːljo/","i pagani":"/i paˈɡaːni/","il carcere":"/il ˈkaɾtʃeɾe/","Erode":"/eˈɾɔːde/","il viaggio missionario":"/il ˈvjaddʒo missjoˈnaːɾjo/","Barnaba":"/ˈbaɾnaba/","la sinagoga":"/la sinaˈɡɔːɡa/","il concilio":"/il konˈtʃiːljo/","la circoncisione":"/la tʃiɾkontʃiˈzjone/","la grazia":"/la ˈɡɾattsja/","annunciare":"/annuntˈtʃaːɾe/","Lidia":"/ˈliːdja/","il terremoto":"/il teɾɾeˈmɔːto/","l'Areopago":"/laɾeˈɔːpaɡo/","il missionario":"/il missjoˈnaːɾjo/","la magia":"/la ˈmaːdʒa/","il tumulto":"/il tuˈmulto/","l'argentiere":"/laɾdʒenˈtjɛːɾe/","la profezia":"/la pɾofeˈtsiːa/","legare":"/leˈɡaːɾe/","il viaggio":"/il ˈvjaddʒo/","la difesa":"/la diˈfeːza/","il sinedrio":"/il siˈnɛːdɾjo/","la congiura":"/la konˈdʒuːɾa/","il governatore":"/il ɡoveɾnaˈtoːɾe/","il processo":"/il pɾoˈtʃɛsso/","il testimone":"/il testiˈmoːne/","l'accusa":"/lakˈkuːza/","Festo":"/ˈfɛsto/","Agrippa":"/aˈɡɾippa/","l'appello":"/lapˈpɛllo/","la testimonianza":"/la testimonˈjantsa/","convertirsi":"/konveɾˈtiɾsi/","il naufragio":"/il nawˈfɾaːdʒo/","l'isola":"/ˈliːzola/","il serpente":"/il seɾˈpɛnte/","Roma":"/ˈɾɔːma/","predicare":"/pɾediˈkaːɾe/","l'impedimento":"/limpediˈmento/","la nave":"/la ˈnaːve/","il vangelo":"/il vanˈdʒɛːlo/","la giustizia":"/la dʒusˈtiːttsja/","il giudizio":"/il dʒuˈdiːttsjo/","l'ira":"/ˈliːɾa/","l'idolatria":"/lidolaˈtɾiːa/","l'albero":"/ˈlalbeɾo/","il cammino":"/il kamˈmiːno/","la redenzione":"/la ɾedenˈtsjone/","il pastore":"/il pasˈtoːɾe/","l'abbondanza":"/labbonˈdantsa/","la tenebrosa valle":"/la tenebˈɾoːza ˈvalle/","la sofferenza":"/la soffeˈɾɛntsa/","la speranza":"/la speˈɾantsa/","il rifugio":"/il ɾiˈfuːdʒo/","la forza":"/la ˈfoɾtsa/","la morte":"/la ˈmɔɾte/","la carne":"/la ˈkaɾne/","la condanna":"/la konˈdanna/","la figliolanza":"/la fiʎʎoˈlantsa/","la creazione":"/la kɾeaˈtsjone/","la misericordia":"/la mizeɾiˈkɔɾdja/","il cuore":"/il ˈkwɔːɾe/","l'elezione":"/leletˈtsjone/","confessare":"/konfesˈsaːɾe/","credere nel cuore":"/ˈkɾɛːdeɾe nel ˈkwɔːɾe/","la protezione":"/la pɾotetˈtsjone/","il nome del Signore":"/il ˈnoːme del siˈɲɲoːɾe/","essere salvato":"/ˈɛsseɾe salˈvaːto/","il messaggero":"/il messadˈdʒɛːɾo/","il mistero":"/il misˈtɛːɾo/","il corpo di Cristo":"/il ˈkɔɾpo di ˈkɾisto/","i doni":"/i ˈdoːni/","la Parola":"/la paˈɾɔːla/","il sentiero":"/il senˈtjɛːɾo/","offrire":"/ofˈfɾiːɾe/","rinnovarsi":"/ɾinnoˈvaɾsi/","l'autorità":"/lautoɾiˈta/","amare il prossimo":"/aˈmaːɾe il ˈpɾɔssimo/","la coscienza":"/la koˈʃʃɛntsa/","il soccorso":"/il sokˈkɔɾso/","vegliare":"/veʎˈʎaːɾe/","il custode":"/il kusˈtoːde/","l'unità":"/luniˈta/","i saluti":"/i saˈluːti/","conoscere":"/koˈnoʃʃeɾe/","tessere":"/ˈtɛsseɾe/","fuggire":"/fudˈdʒiːɾe/","meraviglioso":"/meɾaviʎˈʎoːzo/","lodare":"/loˈdaːɾe/","l'alleluja":"/lalleˈluːja/","gli strumenti":"/ʎi stɾuˈmenti/","tutta la creazione":"/ˈtutta la kɾeaˈtsjone/","la gloria":"/la ˈɡlɔːɾja/","il Natale":"/il naˈtaːle/","la fine":"/la ˈfiːne/","il profeta":"/il pɾoˈfɛːta/","Corinto":"/koˈɾinto/"};

// ── Card formatter ─────────────────────────────────────────────────────────────

function makeCardBack(italian, english, example, weekRef, pronunciation) {
  const pronHtml = pronunciation ? `<span style="color:#aaa;font-size:0.85em;">${pronunciation}</span><br>` : '';
  return `${pronHtml}<b>${english}</b><br><i style="color:#666;">${example}</i><br><small style="color:#999;">${weekRef}</small>`;
}

// ── Generator ──────────────────────────────────────────────────────────────────

async function generateDeck(name, cards, filename) {
  const deck = new ApkgExport(name);
  for (const [front, back] of cards) {
    deck.addCard(front, back);
  }
  const buf = await deck.save(filename);
  const outPath = path.join(__dirname, '..', 'public', 'anki', filename + '.apkg');
  fs.writeFileSync(outPath, buf);
  console.log(`  ✓ ${filename}.apkg  (${cards.length} cards, ${(buf.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('\nGenerating Anki decks...\n');
  const allCards = [];

  for (const phase of PHASES) {
    console.log(`${phase.label}`);
    const phaseCards = [];

    for (const week of phase.weeks) {
      const weekLabel = `Week ${week.n} — ${week.r}`;
      const weekCards = week.vocab.map(([it, en, ex]) => [
        it,
        makeCardBack(it, en, ex, weekLabel, PRON[it] || ''),
      ]);

      // Per-week deck
      await generateDeck(
        `Italian Bible: ${weekLabel}`,
        weekCards,
        `week-${String(week.n).padStart(2, '0')}`
      );

      phaseCards.push(...weekCards);
      allCards.push(...weekCards);
    }

    // Per-phase deck
    await generateDeck(
      `Italian Bible: ${phase.label}`,
      phaseCards,
      phase.file
    );
    console.log('');
  }

  // Complete deck
  console.log('Complete deck');
  await generateDeck(
    'Italian Bible Study — Complete (37 Weeks)',
    allCards,
    'complete'
  );

  console.log(`\nDone. ${allCards.length} cards total across ${PHASES.reduce((s, p) => s + p.weeks.length, 0)} weeks.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
