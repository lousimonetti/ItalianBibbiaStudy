// Course configuration — identity, locale, schedule, branding, resources.
// This is the file an author edits to retarget the app to a different language,
// material, length, or look. Content (the weeks themselves) lives in
// course/content.js. See plan-platform.md for the generalization roadmap.

export const config = {
  // Namespaces decks and per-course localStorage keys.
  id: 'it-bible-cei',
  // localStorage key prefix. Kept as 'italian-bible' for this reference course so
  // existing users' data (progress/srs/streak/…) is preserved with no migration.
  // A scaffolded course gets its own prefix, so forks/courses never collide.
  storagePrefix: 'italian-bible',

  brand: {
    name: 'Italian Bible Study',
    tagline: '37 weeks to Christmas 2026 — La Bibbia CEI 2008 + daily lessons + iTalki',
    goal: 'Dec 25, 2026',
    topicLabel: 'Grammar focus', // column header for each week's topic (week.b)
    accent: '#008C45',
    accentDim: '#d4edda',
    ribbon: ['#008C45', '#c8c4ba', '#CE2B37'], // the tricolore bar
    // One-paragraph "what is this?" intro shown on the WelcomeCard.
    about:
      'A self-paced 37-week Italian language program — Easter to Christmas 2026. ' +
      'The Italian Bible (La Bibbia CEI 2008) is the primary reading text, supported ' +
      'by tools for grammar, vocabulary, and conversation.',
  },

  // Locale drives TTS, speech-recognition, the grammar check, and whether IPA
  // is shown. (Threaded through the components in T1 — see plan-platform.md.)
  locale: {
    target: 'it-IT',   // TTS + SpeechRecognition language
    native: 'en',      // the learner's language (translation side)
    grammarLang: 'it', // LanguageTool code ('' disables the Journal grammar check)
    hasIPA: true,      // false ⇒ hide IPA column + pronunciation key
    // Leading articles, for article-stripped vocab matching (answer.js / vocabIndex.js).
    articles: ['gli', 'uno', 'una', 'il', 'lo', 'la', 'le', 'un', 'i', "l'", "un'"],
  },

  schedule: {
    startDate: '2026-04-13', // program start (local date)
    weeks: 37,               // total weeks — change this (and content.js) for an N-week course
    daily: [
      { day: 'Mon', task: 'Lesson 1 — new words (press Continue) + listen to the passage audio, no looking up' },
      { day: 'Tue', task: 'Read the chapters with parallel text + Lesson 2 — new words and grammar' },
      { day: 'Wed', task: "Re-read + write 3–5 sentences in Italian using this week's prompt → Journal tab" },
      { day: 'Thu', task: 'Lesson 3 — the passage + review your due cards' },
      { day: 'Fri', task: 'Read next chapter(s) + write 2–3 more Italian sentences' },
      { day: 'Sat', task: 'Review due cards + listen to the full passage audio again' },
      { day: 'Sun', task: 'Rest — or write a short journal entry in Italian' },
    ],
  },

  // Content/licensing notices rendered in the "About & privacy" panel. Every
  // notice a public deploy of this course is required to show belongs here —
  // forks replace these with their own material's notices.
  licenses: [
    {
      name: 'La Bibbia CEI 2008',
      note: 'I testi biblici sono tratti dalla Bibbia CEI 2008, © Fondazione di Religione ' +
        'Santi Francesco d’Assisi e Caterina da Siena / Conferenza Episcopale Italiana. ' +
        'Brief passages (about eight verses per week) are quoted for non-commercial educational ' +
        'use; all rights remain with the copyright holder.',
      url: 'https://www.bibbiaedu.it',
    },
    {
      name: 'Wikipedia',
      note: 'Saint-of-the-day stories are fetched from Wikipedia and are available under ' +
        'the Creative Commons Attribution-ShareAlike license.',
      url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    {
      name: 'LanguageTool',
      note: 'The optional Journal grammar check is powered by the LanguageTool public API.',
      url: 'https://languagetool.org',
    },
  ],

  // Long-form course-specific prose that used to be hardcoded inside shared
  // components (SentenceGuide, JournalScaffold, GuideSection). All of it is
  // language- and course-specific, so a fork had to edit components to change
  // it — which broke the "edit the course, not the code" promise. Every field
  // here is optional: the component hides its section when the field is absent.
  guide: {
    // Sentence-pattern reference shown in the Journal editor.
    sentencePatterns: [
      { label: 'Subject + verb', it: 'Io leggo.', en: 'I read.' },
      { label: 'Subject + verb + object', it: 'Io leggo la Bibbia.', en: 'I read the Bible.' },
      { label: 'Subject + verb + adjective', it: 'La parola è vera.', en: 'The word is true.' },
      { label: 'Negation', it: 'Non capisco.', en: "I don't understand." },
      { label: 'Question', it: 'Cosa significa?', en: 'What does it mean?' },
      { label: 'Past (passato prossimo)', it: 'Ho letto il capitolo.', en: 'I have read the chapter.' },
      { label: 'Connectors', it: 'e · ma · perché · quindi', en: 'and · but · because · so' },
    ],

    // Click-to-insert openers for the Journal writing scaffold. These were
    // hardcoded Italian inside a shared component — a fork targeting any other
    // language got Italian starters.
    journalStarters: [
      'Oggi ho letto…',
      'Questo passo parla di…',
      'Ho imparato che…',
      'Mi colpisce che…',
      'Voglio ricordare…',
    ],
  },

  // Supporting tools/materials the course uses (rendered on the WelcomeCard).
  resources: [
    { id: 'text', name: 'La Bibbia CEI 2008', badge: 'Primary text', role: 'reading',
      desc: 'daily reading through John, Luke, Acts, Romans & Psalms. Rich, repetitive language that builds vocabulary naturally.' },
    { id: 'grammar', name: 'Lessons', badge: 'in this app', role: 'grammar',
      desc: "three short guided lessons a week — the week's new words, its grammar point, then the passage. Press Continue." },
    { id: 'srs', name: 'Review', badge: 'in this app', role: 'flashcards',
      desc: 'spaced-repetition review of every word the lessons teach. Anki decks are there to download if you prefer Anki.' },
    { id: 'talk', name: 'iTalki', badge: 'review weeks', role: 'conversation',
      desc: 'live conversation practice with a tutor, scheduled on review weeks (roughly monthly).' },
  ],
};
