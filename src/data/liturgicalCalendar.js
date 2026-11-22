// The liturgical calendar behind "Liturgia del giorno" in the Saints tab: the
// solemnities and feasts of the General Roman Calendar, the ones that move with
// Easter, and Italy's holy days of obligation. The rules that place them on a
// date (seasons, Sundays, precedence, transfers) live in src/utils/liturgy.js.
//
// `prec` is the row of the Table of Liturgical Days (Norme generali per
// l'ordinamento dell'anno liturgico, n. 59), simplified: a lower number wins.
//   1 Easter Triduum and Easter Sunday
//   2 Christmas, Epiphany, Ascension, Pentecost; Sundays of Advent, Lent and
//     Easter; Ash Wednesday; Monday to Wednesday of Holy Week; the Easter Octave
//   3 solemnities of the general calendar; All Souls
//   5 feasts of the Lord
//   6 Sundays of the Christmas season and of Ordinary Time
//   7 feasts of Mary and the saints
//   9 Advent weekdays from 17 December; the Christmas Octave; Lent weekdays
//  10 obligatory memorials
//  13 other weekdays
//
// Colours are the Missal's: viola, bianco, rosso, verde, rosaceo. `null` means
// no Mass is celebrated (Holy Saturday).
//
// Fixed entries take their Wikipedia titles from src/data/saintsCalendar.js,
// whose entry for the same date is the same celebration (liturgy.test.js checks
// this). Movable entries carry their own.

// ── Fixed dates ─────────────────────────────────────────────────────────────
// kind: 'lord' | 'mary' | 'saint'. A feast of the Lord on a Sunday in Ordinary
// Time replaces the Sunday; a feast of Mary or a saint gives way to it.
export const FIXED = [
  // Solemnities
  { md: '01-01', name: 'Maria Santissima Madre di Dio', en: 'Mary, the Holy Mother of God', rank: 'solemnity', prec: 3, colour: 'bianco', kind: 'mary' },
  { md: '01-06', name: 'Epifania del Signore', en: 'The Epiphany of the Lord', rank: 'solemnity', prec: 2, colour: 'bianco', kind: 'lord' },
  { md: '03-19', name: 'San Giuseppe, sposo della Beata Vergine Maria', en: 'Saint Joseph, Spouse of the Blessed Virgin Mary', rank: 'solemnity', prec: 3, colour: 'bianco', kind: 'saint' },
  { md: '03-25', name: 'Annunciazione del Signore', en: 'The Annunciation of the Lord', rank: 'solemnity', prec: 3, colour: 'bianco', kind: 'lord' },
  { md: '06-24', name: 'Natività di San Giovanni Battista', en: 'The Nativity of Saint John the Baptist', rank: 'solemnity', prec: 3, colour: 'bianco', kind: 'saint' },
  { md: '06-29', name: 'Santi Pietro e Paolo, apostoli', en: 'Saints Peter and Paul, Apostles', rank: 'solemnity', prec: 3, colour: 'rosso', kind: 'saint' },
  { md: '08-15', name: 'Assunzione della Beata Vergine Maria', en: 'The Assumption of the Blessed Virgin Mary', rank: 'solemnity', prec: 3, colour: 'bianco', kind: 'mary' },
  { md: '11-01', name: 'Tutti i Santi', en: 'All Saints', rank: 'solemnity', prec: 3, colour: 'bianco', kind: 'saint' },
  { md: '11-02', name: 'Commemorazione di tutti i fedeli defunti', en: 'The Commemoration of All the Faithful Departed (All Souls)', rank: 'commemoration', prec: 3, colour: 'viola', kind: 'saint' },
  { md: '12-08', name: 'Immacolata Concezione della Beata Vergine Maria', en: 'The Immaculate Conception of the Blessed Virgin Mary', rank: 'solemnity', prec: 3, colour: 'bianco', kind: 'mary' },
  { md: '12-25', name: 'Natale del Signore', en: 'The Nativity of the Lord (Christmas)', rank: 'solemnity', prec: 2, colour: 'bianco', kind: 'lord' },

  // Feasts
  { md: '01-25', name: 'Conversione di San Paolo apostolo', en: 'The Conversion of Saint Paul the Apostle', rank: 'feast', prec: 7, colour: 'bianco', kind: 'saint' },
  { md: '02-02', name: 'Presentazione del Signore', en: 'The Presentation of the Lord', rank: 'feast', prec: 5, colour: 'bianco', kind: 'lord' },
  { md: '02-14', name: "Santi Cirillo e Metodio, patroni d'Europa", en: 'Saints Cyril and Methodius, Patrons of Europe', rank: 'feast', prec: 7, colour: 'bianco', kind: 'saint' },
  { md: '02-22', name: 'Cattedra di San Pietro apostolo', en: 'The Chair of Saint Peter the Apostle', rank: 'feast', prec: 7, colour: 'bianco', kind: 'saint' },
  { md: '04-25', name: 'San Marco evangelista', en: 'Saint Mark, Evangelist', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '04-29', name: "Santa Caterina da Siena, patrona d'Italia e d'Europa", en: 'Saint Catherine of Siena, Patron of Italy and Europe', rank: 'feast', prec: 7, colour: 'bianco', kind: 'saint' },
  { md: '05-03', name: 'Santi Filippo e Giacomo, apostoli', en: 'Saints Philip and James, Apostles', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '05-14', name: 'San Mattia apostolo', en: 'Saint Matthias, Apostle', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '05-31', name: 'Visitazione della Beata Vergine Maria', en: 'The Visitation of the Blessed Virgin Mary', rank: 'feast', prec: 7, colour: 'bianco', kind: 'mary' },
  { md: '07-03', name: 'San Tommaso apostolo', en: 'Saint Thomas, Apostle', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '07-11', name: "San Benedetto, abate, patrono d'Europa", en: 'Saint Benedict, Abbot, Patron of Europe', rank: 'feast', prec: 7, colour: 'bianco', kind: 'saint' },
  { md: '07-22', name: 'Santa Maria Maddalena', en: 'Saint Mary Magdalene', rank: 'feast', prec: 7, colour: 'bianco', kind: 'saint' },
  { md: '07-23', name: "Santa Brigida, religiosa, patrona d'Europa", en: 'Saint Bridget, Religious, Patron of Europe', rank: 'feast', prec: 7, colour: 'bianco', kind: 'saint' },
  { md: '07-25', name: 'San Giacomo apostolo', en: 'Saint James, Apostle', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '08-06', name: 'Trasfigurazione del Signore', en: 'The Transfiguration of the Lord', rank: 'feast', prec: 5, colour: 'bianco', kind: 'lord' },
  { md: '08-09', name: "Santa Teresa Benedetta della Croce, patrona d'Europa", en: 'Saint Teresa Benedicta of the Cross (Edith Stein), Patron of Europe', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '08-10', name: 'San Lorenzo, diacono e martire', en: 'Saint Lawrence, Deacon and Martyr', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '08-24', name: 'San Bartolomeo apostolo', en: 'Saint Bartholomew, Apostle', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '09-08', name: 'Natività della Beata Vergine Maria', en: 'The Nativity of the Blessed Virgin Mary', rank: 'feast', prec: 7, colour: 'bianco', kind: 'mary' },
  { md: '09-14', name: 'Esaltazione della Santa Croce', en: 'The Exaltation of the Holy Cross', rank: 'feast', prec: 5, colour: 'rosso', kind: 'lord' },
  { md: '09-21', name: 'San Matteo, apostolo ed evangelista', en: 'Saint Matthew, Apostle and Evangelist', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '09-29', name: 'Santi Michele, Gabriele e Raffaele, arcangeli', en: 'Saints Michael, Gabriel and Raphael, Archangels', rank: 'feast', prec: 7, colour: 'bianco', kind: 'saint' },
  { md: '10-04', name: "San Francesco d'Assisi, patrono d'Italia", en: 'Saint Francis of Assisi, Patron of Italy', rank: 'feast', prec: 7, colour: 'bianco', kind: 'saint' },
  { md: '10-18', name: 'San Luca evangelista', en: 'Saint Luke, Evangelist', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '10-28', name: 'Santi Simone e Giuda, apostoli', en: 'Saints Simon and Jude, Apostles', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '11-09', name: 'Dedicazione della Basilica Lateranense', en: 'The Dedication of the Lateran Basilica', rank: 'feast', prec: 5, colour: 'bianco', kind: 'lord' },
  { md: '11-30', name: "Sant'Andrea apostolo", en: 'Saint Andrew, Apostle', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '12-26', name: 'Santo Stefano, primo martire', en: 'Saint Stephen, the First Martyr', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
  { md: '12-27', name: 'San Giovanni, apostolo ed evangelista', en: 'Saint John, Apostle and Evangelist', rank: 'feast', prec: 7, colour: 'bianco', kind: 'saint' },
  { md: '12-28', name: 'Santi Innocenti, martiri', en: 'The Holy Innocents, Martyrs', rank: 'feast', prec: 7, colour: 'rosso', kind: 'saint' },
];

// ── Celebrations that move ──────────────────────────────────────────────────
// `easter` is an offset in days from Easter Sunday. Italian usage (CEI): the
// Ascension is on the Seventh Sunday of Easter (+42), Corpus Domini on the
// Sunday after Trinity (+63). `rule` names the ones placed some other way; they
// are worked out in liturgy.js.
export const MOVABLE = [
  { id: 'battesimo', rule: 'baptism', name: 'Battesimo del Signore', en: 'The Baptism of the Lord', rank: 'feast', prec: 5, colour: 'bianco', wiki: { it: 'Battesimo di Gesù', en: 'Baptism of the Lord' } },
  { id: 'ceneri', easter: -46, name: 'Mercoledì delle Ceneri', en: 'Ash Wednesday', rank: 'weekday', prec: 2, colour: 'viola', seasonStart: true, wiki: { it: 'Mercoledì delle Ceneri', en: 'Ash Wednesday' } },
  { id: 'palme', easter: -7, name: 'Domenica delle Palme e della Passione del Signore', en: 'Palm Sunday of the Passion of the Lord', rank: 'sunday', prec: 2, colour: 'rosso', wiki: { it: 'Domenica delle Palme', en: 'Palm Sunday' } },
  { id: 'giovedi-santo', easter: -3, name: 'Giovedì Santo', en: 'Holy Thursday', rank: 'triduum', prec: 1, colour: 'bianco', seasonStart: true, wiki: { it: 'Giovedì santo', en: 'Maundy Thursday' } },
  { id: 'venerdi-santo', easter: -2, name: 'Venerdì Santo, Passione del Signore', en: 'Good Friday of the Passion of the Lord', rank: 'triduum', prec: 1, colour: 'rosso', wiki: { it: 'Venerdì santo', en: 'Good Friday' } },
  { id: 'sabato-santo', easter: -1, name: 'Sabato Santo', en: 'Holy Saturday', rank: 'triduum', prec: 1, colour: null, wiki: { it: 'Sabato santo', en: 'Holy Saturday' } },
  { id: 'pasqua', easter: 0, name: 'Domenica di Pasqua, Risurrezione del Signore', en: 'Easter Sunday of the Resurrection of the Lord', rank: 'solemnity', prec: 1, colour: 'bianco', wiki: { it: 'Pasqua', en: 'Easter' } },
  { id: 'angelo', easter: 1, name: "Lunedì dell'Angelo", en: 'Easter Monday', rank: 'octave', prec: 2, colour: 'bianco', wiki: { it: "Lunedì dell'Angelo", en: 'Easter Monday' } },
  { id: 'misericordia', easter: 7, name: 'II domenica di Pasqua o della Divina Misericordia', en: 'Second Sunday of Easter (Divine Mercy Sunday)', rank: 'sunday', prec: 2, colour: 'bianco', wiki: { it: 'Domenica della Divina Misericordia', en: 'Divine Mercy Sunday' } },
  { id: 'ascensione', easter: 42, name: 'Ascensione del Signore', en: 'The Ascension of the Lord', rank: 'solemnity', prec: 2, colour: 'bianco', wiki: { it: 'Ascensione di Gesù', en: 'Feast of the Ascension' } },
  { id: 'pentecoste', easter: 49, name: 'Domenica di Pentecoste', en: 'Pentecost Sunday', rank: 'solemnity', prec: 2, colour: 'rosso', wiki: { it: 'Pentecoste', en: 'Pentecost' } },
  { id: 'madre-chiesa', easter: 50, name: 'Beata Vergine Maria Madre della Chiesa', en: 'The Blessed Virgin Mary, Mother of the Church', rank: 'memorial', prec: 10, colour: 'bianco' },
  { id: 'trinita', easter: 56, name: 'Santissima Trinità', en: 'The Most Holy Trinity', rank: 'solemnity', prec: 3, colour: 'bianco', wiki: { it: 'Santissima Trinità', en: 'Trinity Sunday' } },
  { id: 'corpus-domini', easter: 63, name: 'Santissimo Corpo e Sangue di Cristo (Corpus Domini)', en: 'The Most Holy Body and Blood of Christ (Corpus Christi)', rank: 'solemnity', prec: 3, colour: 'bianco', wiki: { it: 'Corpus Domini', en: 'Feast of Corpus Christi' } },
  { id: 'sacro-cuore', easter: 68, name: 'Sacratissimo Cuore di Gesù', en: 'The Most Sacred Heart of Jesus', rank: 'solemnity', prec: 3, colour: 'bianco', wiki: { it: 'Sacro Cuore di Gesù', en: 'Feast of the Sacred Heart' } },
  { id: 'cuore-maria', easter: 69, name: 'Cuore Immacolato della Beata Vergine Maria', en: 'The Immaculate Heart of the Blessed Virgin Mary', rank: 'memorial', prec: 10, colour: 'bianco' },
  { id: 'cristo-re', rule: 'christ-the-king', name: "Nostro Signore Gesù Cristo Re dell'universo", en: 'Our Lord Jesus Christ, King of the Universe', rank: 'solemnity', prec: 3, colour: 'bianco', wiki: { it: 'Cristo Re', en: 'Feast of Christ the King' } },
  { id: 'santa-famiglia', rule: 'holy-family', name: 'Santa Famiglia di Gesù, Maria e Giuseppe', en: 'The Holy Family of Jesus, Mary and Joseph', rank: 'feast', prec: 5, colour: 'bianco', wiki: { it: 'Sacra Famiglia', en: 'Holy Family' } },
];

// Days of obligation in Italy besides every Sunday (CEI). The Ascension and
// Corpus Domini already fall on Sundays in Italy.
export const PRECETTO_IT = ['01-01', '01-06', '08-15', '11-01', '12-08', '12-25'];

// Entries of the saints calendar that are really a movable celebration placed
// on its usual date, so the saint card can say where it falls this year.
export const SAINTS_ALIASES = { '12-30': 'santa-famiglia' };

export const SEASONS = {
  avvento: { it: 'Tempo di Avvento', en: 'Advent' },
  natale: { it: 'Tempo di Natale', en: 'Christmas season' },
  ordinario: { it: 'Tempo Ordinario', en: 'Ordinary Time' },
  quaresima: { it: 'Tempo di Quaresima', en: 'Lent' },
  triduo: { it: 'Triduo pasquale', en: 'Easter Triduum' },
  pasqua: { it: 'Tempo di Pasqua', en: 'Easter season' },
};

export const RANKS = {
  solemnity: { it: 'Solennità', en: 'Solemnity' },
  commemoration: { it: 'Commemorazione', en: 'Commemoration' },
  feast: { it: 'Festa', en: 'Feast' },
  memorial: { it: 'Memoria', en: 'Memorial' },
  sunday: { it: 'Domenica', en: 'Sunday' },
  triduum: { it: 'Triduo pasquale', en: 'Easter Triduum' },
  octave: { it: 'Ottava di Pasqua', en: 'Easter Octave' },
  weekday: { it: 'Feria', en: 'Weekday' },
};

export const COLOURS = {
  viola: { en: 'violet' },
  bianco: { en: 'white' },
  rosso: { en: 'red' },
  verde: { en: 'green' },
  rosaceo: { en: 'rose' },
};
