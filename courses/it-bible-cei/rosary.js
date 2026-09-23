// The guided Rosary for this course — the Rosario tab.
//
// The prayers themselves are NOT repeated here: `prayers` names the ids of the
// texts in devotions.js, so the Ave Maria the learner shadows in the Prayers
// tab is the same object they pray fifty times here. What this file adds is
// the structure around them — the four sets of mysteries, which days they
// belong to, and the words used to announce each one.
//
// SHAPE
//   prayers = { sign, creed, our, hail, glory, fatima, salve }  // devotion ids
//   sets    = [{ id, title, titleEn, adjective, days: [0–6, Sun=0],
//                mysteries: [{ it, en, ref, fruitEn }] ×5 }]
//
// `mystery.it` is written in the form it takes MID-SENTENCE, because that is
// where the learner hears it: "Nel primo mistero gaudioso si contempla
// l'annunciazione dell'angelo a Maria." The heading capitalizes it.
// `adjective` is the singular that the announcement needs (gaudioso), not the
// plural of the set's title (gaudiosi) — the agreement is the lesson.

export const rosary = {
  prayers: {
    sign: 'segno-croce',
    creed: 'credo',
    our: 'padre-nostro',
    hail: 'ave-maria',
    glory: 'gloria',
    fatima: 'fatima',
    salve: 'salve-regina',
  },

  // The three opening Ave Marias, prayed for the theological virtues.
  virtues: [
    { it: 'fede', en: 'faith' },
    { it: 'speranza', en: 'hope' },
    { it: 'carità', en: 'charity' },
  ],

  sets: [
    {
      id: 'gaudiosi',
      title: 'Misteri gaudiosi',
      titleEn: 'Joyful Mysteries',
      adjective: 'gaudioso',
      days: [1, 6], // lunedì, sabato
      mysteries: [
        { it: "l'annunciazione dell'angelo a Maria", en: 'The Annunciation', ref: 'Lc 1,26-38', fruitEn: 'Humility' },
        { it: 'la visita di Maria a santa Elisabetta', en: 'The Visitation', ref: 'Lc 1,39-56', fruitEn: 'Love of neighbour' },
        { it: 'la nascita di Gesù a Betlemme', en: 'The Nativity', ref: 'Lc 2,1-20', fruitEn: 'Poverty of spirit' },
        { it: 'la presentazione di Gesù al tempio', en: 'The Presentation in the Temple', ref: 'Lc 2,22-38', fruitEn: 'Obedience' },
        { it: 'il ritrovamento di Gesù nel tempio', en: 'The Finding in the Temple', ref: 'Lc 2,41-52', fruitEn: 'Joy in finding Jesus' },
      ],
    },
    {
      id: 'luminosi',
      title: 'Misteri luminosi',
      titleEn: 'Luminous Mysteries',
      adjective: 'luminoso',
      days: [4], // giovedì
      mysteries: [
        { it: 'il battesimo di Gesù nel Giordano', en: 'The Baptism in the Jordan', ref: 'Mt 3,13-17', fruitEn: 'Openness to the Holy Spirit' },
        { it: 'le nozze di Cana', en: 'The Wedding at Cana', ref: 'Gv 2,1-12', fruitEn: 'To Jesus through Mary' },
        { it: "l'annuncio del regno di Dio e l'invito alla conversione", en: 'The Proclamation of the Kingdom', ref: 'Mc 1,14-15', fruitEn: 'Repentance and trust in God' },
        { it: 'la trasfigurazione di Gesù', en: 'The Transfiguration', ref: 'Lc 9,28-36', fruitEn: 'Desire for holiness' },
        { it: "l'istituzione dell'Eucaristia", en: 'The Institution of the Eucharist', ref: 'Lc 22,14-20', fruitEn: 'Adoration' },
      ],
    },
    {
      id: 'dolorosi',
      title: 'Misteri dolorosi',
      titleEn: 'Sorrowful Mysteries',
      adjective: 'doloroso',
      days: [2, 5], // martedì, venerdì
      mysteries: [
        { it: "l'agonia di Gesù nell'orto degli ulivi", en: 'The Agony in the Garden', ref: 'Lc 22,39-46', fruitEn: 'Sorrow for sin' },
        { it: 'la flagellazione di Gesù', en: 'The Scourging at the Pillar', ref: 'Mc 15,15', fruitEn: 'Purity' },
        { it: 'la coronazione di spine', en: 'The Crowning with Thorns', ref: 'Mt 27,27-31', fruitEn: 'Courage' },
        { it: 'la salita di Gesù al Calvario con la croce', en: 'The Carrying of the Cross', ref: 'Gv 19,16-17', fruitEn: 'Patience' },
        { it: 'la crocifissione e la morte di Gesù', en: 'The Crucifixion', ref: 'Lc 23,33-46', fruitEn: 'Perseverance' },
      ],
    },
    {
      id: 'gloriosi',
      title: 'Misteri gloriosi',
      titleEn: 'Glorious Mysteries',
      adjective: 'glorioso',
      days: [0, 3], // domenica, mercoledì
      mysteries: [
        { it: 'la risurrezione di Gesù', en: 'The Resurrection', ref: 'Mt 28,1-10', fruitEn: 'Faith' },
        { it: "l'ascensione di Gesù al cielo", en: 'The Ascension', ref: 'At 1,6-11', fruitEn: 'Hope' },
        { it: 'la discesa dello Spirito Santo nel cenacolo', en: 'The Descent of the Holy Spirit', ref: 'At 2,1-13', fruitEn: 'Love of God' },
        { it: "l'assunzione di Maria al cielo", en: 'The Assumption of Mary', ref: 'Ap 12,1', fruitEn: 'Grace of a happy death' },
        { it: "l'incoronazione di Maria regina del cielo e della terra", en: 'The Coronation of Mary', ref: 'Ap 12,1-6', fruitEn: 'Trust in Mary' },
      ],
    },
  ],
};
