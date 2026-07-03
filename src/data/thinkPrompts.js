// Daily "Pensa in italiano" micro-prompts (plan-speaking.md S7): one-line
// inner-monologue tasks about everyday life, rotated deterministically by
// calendar day so everyone sees the same prompt all day with no storage.
// Thinking in Italian is a between-sessions habit — these seed it. Like
// it2ipa/it2en these are Italian-specific; a fork for another language would
// swap this list.

export const THINK_PROMPTS = [
  { it: 'Descrivi la tua colazione di stamattina.', en: "Describe this morning's breakfast." },
  { it: 'Conta ad alta voce gli oggetti sulla tua scrivania.', en: 'Count the objects on your desk out loud.' },
  { it: 'Che tempo fa fuori? Descrivilo.', en: "What's the weather like outside? Describe it." },
  { it: 'Racconta cosa hai fatto ieri sera.', en: 'Tell what you did yesterday evening.' },
  { it: 'Cosa vedi dalla finestra?', en: 'What do you see from the window?' },
  { it: 'Descrivi i vestiti che indossi oggi.', en: "Describe the clothes you're wearing today." },
  { it: 'Qual è il tuo programma per oggi?', en: "What's your plan for today?" },
  { it: 'Nomina cinque cose nella tua cucina.', en: 'Name five things in your kitchen.' },
  { it: 'Descrivi una persona della tua famiglia.', en: 'Describe someone in your family.' },
  { it: 'Cosa mangerai per cena stasera?', en: 'What will you eat for dinner tonight?' },
  { it: 'Descrivi la stanza in cui ti trovi.', en: "Describe the room you're in." },
  { it: 'Racconta il tuo tragitto di oggi, passo per passo.', en: "Narrate today's commute or walk, step by step." },
  { it: 'Per che cosa sei grato oggi?', en: 'What are you grateful for today?' },
  { it: 'Descrivi il tuo posto preferito.', en: 'Describe your favorite place.' },
  { it: 'Cosa faresti con un giorno completamente libero?', en: 'What would you do with a completely free day?' },
  { it: 'Nomina tutti i colori che vedi intorno a te.', en: 'Name all the colors you see around you.' },
  { it: 'Come ti senti in questo momento? Perché?', en: 'How do you feel right now? Why?' },
  { it: "Racconta l'ultima cosa che hai comprato.", en: 'Talk about the last thing you bought.' },
  { it: 'Descrivi il tuo piatto preferito e come si prepara.', en: 'Describe your favorite dish and how it is made.' },
  { it: 'Che ore sono? Cosa fai di solito a quest’ora?', en: 'What time is it? What do you usually do at this hour?' },
  { it: 'Descrivi un amico: com’è? Cosa fa?', en: 'Describe a friend: what are they like? What do they do?' },
  { it: 'Fai la lista della spesa ad alta voce.', en: 'Say your shopping list out loud.' },
  { it: 'Racconta un ricordo della tua infanzia.', en: 'Tell a memory from your childhood.' },
  { it: 'Descrivi la tua giornata ideale.', en: 'Describe your ideal day.' },
  { it: 'Cosa c’è nella tua borsa o nelle tue tasche?', en: 'What is in your bag or your pockets?' },
  { it: 'Parla dell’ultimo libro o film che ti è piaciuto.', en: 'Talk about the last book or film you enjoyed.' },
  { it: 'Descrivi la tua casa, stanza per stanza.', en: 'Describe your home, room by room.' },
  { it: 'Cosa vorresti imparare quest’anno?', en: 'What would you like to learn this year?' },
  { it: 'Di’ una preghiera o un pensiero per oggi, con parole tue.', en: 'Say a prayer or a thought for today, in your own words.' },
  { it: 'Descrivi il momento più bello di questa settimana.', en: 'Describe the best moment of this week.' },
];

export function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

export function promptForDate(d = new Date()) {
  return THINK_PROMPTS[dayOfYear(d) % THINK_PROMPTS.length];
}
