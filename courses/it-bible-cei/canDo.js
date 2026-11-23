// "Can I do this yet?" statements for the progress check at the end of each
// phase (REVIEW-fluency.md section 4, item 1). The learner rates each one
// not yet / with help / yes, and repeats the check later to see the change.
//
// The statements are our own wording, modelled on the levels of the Common
// European Framework of Reference (CEFR) self-assessment grid and framed for
// this course: reading Scripture, following Mass, and everyday conversation.
// The level beside each phase is a rough guide to what the statements aim at,
// not the result of a test. They are in English on purpose, so the check adds
// no Italian that would need a native speaker's read.

export const canDo = {
  p1: {
    level: 'about A1',
    items: [
      { id: 'p1-read-short', en: 'I can read a short Gospel verse aloud and recognise most of its words.' },
      { id: 'p1-greet', en: 'I can greet someone, say who I am and where I am from, and ask the same.' },
      { id: 'p1-prayer', en: 'I can say the Our Father and the Hail Mary in Italian without reading them.' },
      { id: 'p1-listen-slow', en: 'I can follow a familiar verse when it is read slowly.' },
      { id: 'p1-write', en: 'I can write two or three simple sentences about my day.' },
    ],
  },
  p2: {
    level: 'about A2',
    items: [
      { id: 'p2-read-story', en: 'I can follow the story of a parable when I read it, with a gloss for the odd word.' },
      { id: 'p2-past', en: 'I can say what I did yesterday or last week, using the past tense.' },
      { id: 'p2-mass', en: 'I can follow the people’s responses at Mass and join in.' },
      { id: 'p2-ask', en: 'I can ask for directions, order food, or buy a ticket, and understand the answer.' },
      { id: 'p2-listen', en: 'I can understand a passage I already know when it is read at normal speed.' },
    ],
  },
  p3: {
    level: 'about B1 for reading',
    items: [
      { id: 'p3-read-new', en: 'I can read a chapter of Acts I have not studied and follow what happens.' },
      { id: 'p3-long-sentence', en: 'I can find the main verb in a long sentence and see which parts are asides.' },
      { id: 'p3-retell', en: 'I can retell a passage in my own words, out loud, for a minute.' },
      { id: 'p3-conversation', en: 'I can keep a simple conversation going about my faith, family or work.' },
      { id: 'p3-homily', en: 'I can follow the main point of a short homily or Bible talk.' },
    ],
  },
  p4: {
    level: 'about B1+ for reading',
    items: [
      { id: 'p4-argument', en: 'I can follow Paul’s argument across several verses of Romans.' },
      { id: 'p4-psalm', en: 'I can read a psalm I have not studied and say what it asks of God.' },
      { id: 'p4-opinion', en: 'I can explain what a passage means to me and why, in a few sentences.' },
      { id: 'p4-unprepared', en: 'I can talk with a tutor for fifteen minutes without switching to English.' },
      { id: 'p4-daily-readings', en: 'I can read the day’s Mass readings in Italian with only a few look-ups.' },
    ],
  },
};
