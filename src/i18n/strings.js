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
