// Course configuration — identity, locale, schedule, branding, resources.
// This is the file an author edits to retarget the app to a different language,
// material, length, or look. Content (the weeks themselves) lives in
// course/content.js. See plan-platform.md for the generalization roadmap.

export const config = {
  // Namespaces decks and (eventually) per-course localStorage keys.
  id: 'it-bible-cei',

  brand: {
    name: 'Italian Bible Study',
    tagline: '37 weeks to Christmas 2026 — La Bibbia CEI 2008 + Babbel + Anki + iTalki',
    goal: 'Dec 25, 2026',
    accent: '#008C45',
    accentDim: '#d4edda',
    ribbon: ['#008C45', '#c8c4ba', '#CE2B37'], // the tricolore bar
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
      { day: 'Mon', task: 'Babbel lesson + audio listen (no looking up)' },
      { day: 'Tue', task: 'Read chapters with parallel text + Anki new words' },
      { day: 'Wed', task: "Re-read + write 3–5 sentences in Italian using this week's prompt → Journal tab" },
      { day: 'Thu', task: 'Babbel lesson + full Anki review deck' },
      { day: 'Fri', task: 'Read next chapter(s) + add vocab + write 2–3 more Italian sentences' },
      { day: 'Sat', task: 'Anki review + listen to full passage audio again' },
      { day: 'Sun', task: 'Rest — or write a short journal entry in Italian' },
    ],
  },

  // Supporting tools/materials (rendered by the guide/welcome surfaces in T2).
  resources: [
    { id: 'text', name: 'La Bibbia CEI 2008', badge: 'Primary text', role: 'reading' },
    { id: 'srs', name: 'Babbel', badge: '15 min/day', role: 'grammar' },
    { id: 'talk', name: 'iTalki', badge: 'review weeks', role: 'conversation' },
  ],
};
