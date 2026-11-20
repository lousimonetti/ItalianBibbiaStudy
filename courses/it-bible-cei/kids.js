// Bambini: the children's corner. Small picture words a child can learn by ear
// while a parent studies, grouped into themes drawn from the stories a family
// reads together (Creation, Noah, Christmas, the Gospels) plus everyday words.
//
// Each word is { it, en, pic }. `it` is spoken aloud and shown large, so it
// carries its article where Italian children learn one (il sole, la luna).
// `pic` is a single emoji: it needs no network, no image files, and reads the
// same to a child who cannot read yet. Keep every `it` unique across the whole
// file (it is the word's id in the sticker album) and every `pic` unique within
// its theme (the listening game shows several at once).
//
// `prayers` are ids into devotions.js. The prayer text is never copied here, so
// the Prayers tab and this corner share one source.

export const kids = {
  themes: [
    {
      id: 'creazione',
      it: 'La creazione',
      en: 'Creation',
      pic: '🌍',
      words: [
        { it: 'il sole', en: 'the sun', pic: '☀️' },
        { it: 'la luna', en: 'the moon', pic: '🌙' },
        { it: 'la stella', en: 'the star', pic: '⭐' },
        { it: 'il mare', en: 'the sea', pic: '🌊' },
        { it: "l'albero", en: 'the tree', pic: '🌳' },
        { it: 'il fiore', en: 'the flower', pic: '🌸' },
        { it: "l'uccello", en: 'the bird', pic: '🐦' },
        { it: 'il pesce', en: 'the fish', pic: '🐟' },
      ],
    },
    {
      id: 'noe',
      it: "L'arca di Noè",
      en: "Noah's ark",
      pic: '🌈',
      words: [
        { it: 'il leone', en: 'the lion', pic: '🦁' },
        { it: "l'elefante", en: 'the elephant', pic: '🐘' },
        { it: 'la giraffa', en: 'the giraffe', pic: '🦒' },
        { it: 'il cane', en: 'the dog', pic: '🐶' },
        { it: 'il gatto', en: 'the cat', pic: '🐱' },
        { it: 'la colomba', en: 'the dove', pic: '🕊️' },
        { it: 'la pioggia', en: 'the rain', pic: '🌧️' },
        { it: "l'arcobaleno", en: 'the rainbow', pic: '🌈' },
      ],
    },
    {
      id: 'natale',
      it: 'Il Natale',
      en: 'Christmas',
      pic: '🌟',
      words: [
        { it: 'il bambino', en: 'the baby', pic: '👶' },
        { it: "l'angelo", en: 'the angel', pic: '👼' },
        { it: 'la pecora', en: 'the sheep', pic: '🐑' },
        { it: 'il bue', en: 'the ox', pic: '🐂' },
        { it: 'il cammello', en: 'the camel', pic: '🐫' },
        { it: 'la corona', en: 'the crown', pic: '👑' },
        { it: 'il regalo', en: 'the gift', pic: '🎁' },
        { it: 'la candela', en: 'the candle', pic: '🕯️' },
      ],
    },
    {
      id: 'gesu',
      it: 'Con Gesù',
      en: 'With Jesus',
      pic: '⛵',
      words: [
        { it: 'la barca', en: 'the boat', pic: '⛵' },
        { it: 'il pane', en: 'the bread', pic: '🍞' },
        { it: "l'uva", en: 'the grapes', pic: '🍇' },
        { it: "l'acqua", en: 'the water', pic: '💧' },
        { it: 'la montagna', en: 'the mountain', pic: '⛰️' },
        { it: 'la chiesa', en: 'the church', pic: '⛪' },
        { it: 'la croce', en: 'the cross', pic: '✝️' },
        { it: 'il cuore', en: 'the heart', pic: '❤️' },
      ],
    },
    {
      id: 'famiglia',
      it: 'La famiglia',
      en: 'Family',
      pic: '🏠',
      words: [
        { it: 'la mamma', en: 'mum', pic: '👩' },
        { it: 'il papà', en: 'dad', pic: '👨' },
        { it: 'la nonna', en: 'grandma', pic: '👵' },
        { it: 'il nonno', en: 'grandpa', pic: '👴' },
        { it: 'il fratello', en: 'brother', pic: '👦' },
        { it: 'la sorella', en: 'sister', pic: '👧' },
        { it: 'la casa', en: 'the house', pic: '🏠' },
      ],
    },
    {
      id: 'colori',
      it: 'I colori',
      en: 'Colours',
      pic: '🎨',
      words: [
        { it: 'rosso', en: 'red', pic: '🔴' },
        { it: 'arancione', en: 'orange', pic: '🟠' },
        { it: 'giallo', en: 'yellow', pic: '🟡' },
        { it: 'verde', en: 'green', pic: '🟢' },
        { it: 'blu', en: 'blue', pic: '🔵' },
        { it: 'viola', en: 'purple', pic: '🟣' },
        { it: 'nero', en: 'black', pic: '⚫' },
        { it: 'bianco', en: 'white', pic: '⚪' },
      ],
    },
    {
      id: 'numeri',
      it: 'I numeri',
      en: 'Numbers',
      pic: '🔢',
      words: [
        { it: 'uno', en: 'one', pic: '1️⃣' },
        { it: 'due', en: 'two', pic: '2️⃣' },
        { it: 'tre', en: 'three', pic: '3️⃣' },
        { it: 'quattro', en: 'four', pic: '4️⃣' },
        { it: 'cinque', en: 'five', pic: '5️⃣' },
        { it: 'sei', en: 'six', pic: '6️⃣' },
        { it: 'sette', en: 'seven', pic: '7️⃣' },
        { it: 'otto', en: 'eight', pic: '8️⃣' },
        { it: 'nove', en: 'nine', pic: '9️⃣' },
        { it: 'dieci', en: 'ten', pic: '🔟' },
      ],
    },
    {
      id: 'gentili',
      it: 'Parole gentili',
      en: 'Kind words',
      pic: '👋',
      words: [
        { it: 'Ciao!', en: 'Hello! / Bye!', pic: '👋' },
        { it: 'Grazie!', en: 'Thank you!', pic: '😊' },
        { it: 'Per favore', en: 'Please', pic: '🥺' },
        { it: 'Buongiorno!', en: 'Good morning!', pic: '🌅' },
        { it: 'Buonanotte!', en: 'Good night!', pic: '😴' },
        { it: 'Ti voglio bene', en: 'I love you (family and friends)', pic: '🤗' },
        { it: 'Amen', en: 'Amen', pic: '🙏' },
      ],
    },
  ],
  // Short prayers a child can say along with, line by line.
  prayers: ['segno-croce', 'gloria', 'padre-nostro', 'ave-maria'],
};
