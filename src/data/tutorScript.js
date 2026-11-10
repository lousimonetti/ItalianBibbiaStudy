// Everything the voice tutor says in its own voice. It speaks only Italian, since
// an Italian TTS voice reading English is hard to follow, so each line carries the
// English the screen shows beneath it. Every word is covered by the gloss test, so
// the words stay tappable like the rest of the course's text.
export const TUTOR_LINES = {
  intro: { it: 'Cominciamo la lezione.', en: "Let's begin the lesson." },
  listen: { it: 'Prima ascolta il brano.', en: 'First, listen to the passage.' },
  repeat: { it: 'Ora ripeti dopo di me.', en: 'Now repeat after me.' },
  again: { it: 'Ancora una volta, più lentamente.', en: 'Once more, more slowly.' },
  careful: { it: 'Attenzione a:', en: 'Watch out for:' },
  notHeard: { it: 'Non ho sentito.', en: "I didn't hear you." },
  moveOn: { it: 'Va bene, andiamo avanti.', en: "All right, let's move on." },
  focus: { it: 'Ora alcune parole difficili.', en: 'Now a few difficult words.' },
  ask: { it: 'Ora alcune domande sul brano.', en: 'Now a few questions about the passage.' },
  tryAgain: { it: 'Prova ancora.', en: 'Try again.' },
  answerIs: { it: 'La risposta è:', en: 'The answer is:' },
  recall: { it: 'Ascolta bene e di’ la parola che manca.', en: 'Listen carefully and say the missing word.' },
  piecemeal: { it: 'Proviamo un pezzo alla volta.', en: "Let's try one piece at a time." },
  wholeLine: { it: 'Ora tutta la frase.', en: 'Now the whole sentence.' },
  hint: { it: 'Ascolta di nuovo questa parte.', en: 'Listen to this part again.' },
  startsWith: { it: 'La parola comincia con:', en: 'The word starts with:' },
  unknownWord: { it: 'Non conosco questa parola.', en: "I don't know that word." },
  conversaClosing: { it: 'Grazie della conversazione. A presto!', en: 'Thanks for the conversation. See you soon!' },
  conversaFailed: { it: 'Scusa, ora non riesco a rispondere.', en: "Sorry, I can't answer right now." },
  conversaRefused: { it: 'Scusa, di questo non posso parlare.', en: "Sorry, I can't talk about that." },
  recap: { it: 'La lezione è finita. Hai lavorato bene!', en: "The lesson is over. You've worked well!" },
};

export const TUTOR_PRAISE = [
  { it: 'Bene!', en: 'Good!' },
  { it: 'Ottimo!', en: 'Excellent!' },
  { it: 'Molto bene!', en: 'Very good!' },
  { it: 'Giusto!', en: 'Right!' },
];
