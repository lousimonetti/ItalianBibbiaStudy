// UI chrome strings for "Modalità immersione" (immersion mode). Keys map to
// { it, en }. English is the default (identical to the pre-immersion labels);
// when immersion is on the Italian is shown with the English available as a
// hover/long-press gloss. Keep these to *chrome* (labels, buttons, headers) —
// never user content like vocab examples or grammar prose.
export const UI_STRINGS = {
  // Tabs
  'tab.tracker': { it: 'Percorso', en: 'Tracker' },
  'tab.flashcards': { it: 'Schede', en: 'Flashcards' },
  'tab.journal': { it: 'Diario', en: 'Journal' },
  'tab.prayers': { it: 'Preghiere', en: 'Prayers' },
  'tab.rosary': { it: 'Rosario', en: 'Rosary' },
  'tab.saints': { it: 'Santi', en: 'Saints' },
  'group.today': { it: 'Oggi', en: 'Today' },
  'group.study': { it: 'Studia', en: 'Study' },
  'group.write': { it: 'Scrivi', en: 'Write' },
  'group.pray': { it: 'Preghiera', en: 'Pray' },
  'tab.game': { it: 'Gioco', en: 'Game' },

  // Saints tab
  'saints.ofTheDay': { it: 'Il santo del giorno', en: 'Saint of the day' },

  // Game tab
  'game.word': { it: 'Parola', en: 'Word' },
  'game.quiz': { it: 'Sfida', en: 'Challenge' },
  'game.msg.length': { it: 'Serve una parola di {n} lettere', en: 'Needs a {n}-letter word' },
  'game.msg.unknown': {
    it: 'Non è nel vocabolario del corso — invio di nuovo per giocarla comunque',
    en: "Not in the course vocabulary — press Enter again to play it anyway",
  },
  'game.msg.copyFail': { it: 'Copia non riuscita', en: "Couldn't copy" },
  'game.howto.title': { it: 'Come si gioca', en: 'How to play' },
  'game.howto.body': {
    it: 'Indovina la parola in sei tentativi. Dopo ogni tentativo le lettere cambiano colore.',
    en: 'Guess the word in six tries. After each try the tiles change colour.',
  },
  'game.howto.correct': { it: 'Lettera giusta, posto giusto', en: 'Right letter, right spot' },
  'game.howto.present': { it: 'Lettera giusta, posto sbagliato', en: 'Right letter, wrong spot' },
  'game.howto.absent': { it: 'La lettera non c\'è', en: 'Letter is not in the word' },
  'game.howto.note': {
    it: "Accenti e articoli non contano. Ogni parola viene dal vocabolario del corso.",
    en: 'Accents and articles are ignored. Every word comes from the course vocabulary.',
  },
  'game.howto.close': { it: 'Ho capito', en: 'Got it' },
  'game.howto.open': { it: 'Come si gioca', en: 'How to play' },
  'game.hint.gloss': { it: 'Suggerimento: significato', en: 'Hint: show meaning' },
  'game.hint.letter': { it: 'Suggerimento: prima lettera', en: 'Hint: first letter' },
  'game.hint.meaning': { it: 'Significato', en: 'Meaning' },
  'game.hint.first': { it: 'Comincia con', en: 'Starts with' },
  'game.streak.cheer': { it: 'In serie!', en: 'On a roll!' },
  'game.practice.title': { it: 'Parola di allenamento', en: 'Practice word' },
  'game.practice.another': { it: 'Un\'altra parola', en: 'Another word' },
  'game.practice.back': { it: 'Torna alla parola del giorno', en: "Back to today's word" },
  'game.practice.note': { it: 'Allenamento: non conta per le statistiche.', en: "Practice round: doesn't count toward your stats." },
  'game.quiz.lightning': { it: 'Lampo · 60 secondi', en: 'Lightning · 60 seconds' },
  'game.quiz.focus': { it: 'Parole difficili', en: 'Tricky words' },
  'game.quiz.focusNone': { it: 'Nessuna parola difficile ancora', en: 'No tricky words yet — review some cards first' },
  'game.quiz.share': { it: 'Condividi il risultato', en: 'Share result' },
  'game.quiz.copied': { it: 'Copiato ✓', en: 'Copied ✓' },
  'game.quiz.unofficial': { it: 'Non conta per le statistiche.', en: "This round doesn't count toward your stats." },
  'game.quiz.timeUp': { it: 'Tempo scaduto!', en: "Time's up!" },
  'game.today': { it: 'Gioco del giorno', en: "Today's game" },

  // Progress bar
  'progress.weeks': { it: 'settimane', en: 'weeks' },
  'progress.goal': { it: 'Obiettivo', en: 'Goal' },

  // Today card
  'today.fullSchedule': { it: 'Programma settimanale completo', en: 'Full weekly schedule' },
  'today.week': { it: 'Settimana', en: 'Week' },

  // Week detail section labels
  'detail.vocab': { it: 'Vocabolario chiave', en: 'Key vocabulary' },
  'detail.grammar': { it: 'Focus grammaticale', en: 'Grammar focus' },
  'detail.prompt': { it: 'Spunto di scrittura', en: 'Writing prompt' },
  'detail.phrases': { it: 'Frasi fisse', en: 'Fixed phrases' },
  'detail.schedule': { it: 'Programma giornaliero', en: 'Daily schedule' },
  'detail.italki': { it: 'Spunti di conversazione iTalki', en: 'iTalki conversation starters' },

  // Flashcards mode toggle
  'fc.anki': { it: 'Mazzi Anki', en: 'Anki Decks' },
  'fc.practice': { it: 'Pratica', en: 'Practice' },
  'fc.pronunciation': { it: 'Pronuncia', en: 'Pronunciation' },
  'fc.traps': { it: 'Trappole', en: 'Traps' },
  'fc.verbforms': { it: 'Tempi', en: 'Tenses' },

  // Practice start screen
  'prac.style': { it: 'Stile di pratica', en: 'Practice style' },
  'prac.chooseCards': { it: 'Scegli le carte', en: 'Choose cards' },

  // Journal header
  'jrn.title': { it: 'Diario', en: 'Journal' },
  'jrn.grammar': { it: 'Grammatica', en: 'Grammar' },
  'jrn.export': { it: 'Esporta .md', en: 'Export .md' },

  // Practice flip-card actions
  'prac.reveal': { it: 'Rivela', en: 'Reveal' },
  'prac.known': { it: "Ce l'ho fatta ✓", en: 'Got it ✓' },
  'prac.again': { it: 'Sto ancora imparando', en: 'Still learning' },
  'prac.tapHint': { it: 'tocca per rivelare', en: 'tap to reveal' },
  'prac.exit': { it: 'Esci', en: 'Exit' },
  'prac.newSession': { it: 'Nuova sessione', en: 'New session' },
};
