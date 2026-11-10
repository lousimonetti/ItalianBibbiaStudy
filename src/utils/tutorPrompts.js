// What the voice tutor asks a local language model. Pure strings: no network, no state.
// A model's reply is only ever shown or spoken, and never reaches the grader, the score
// or the SRS, so nothing here asks a model for a verdict.
//
// Sizes are capped in characters because the smallest target, Apple's on-device model,
// has a small context window shared between the prompt and the reply.

import { verseRefs } from './keyVerses';

export const MAX_PASSAGE_CHARS = 1400;
export const MAX_GRAMMAR_CHARS = 400;
export const MAX_VOCAB_TERMS = 12;
export const MAX_HISTORY_CHARS = 1600;
export const MAX_REPLY_WORDS = 30;

// Speech recognition mangles spelling, so a model that corrects the transcript corrects
// the recognizer rather than the learner.
const TRANSCRIPT_RULE = "The learner's words come from speech recognition and may contain recognition errors. "
  + 'Ignore spelling, accents, capitals and punctuation in them.';

const SCOPE_RULE = 'Discuss only the Italian language: grammar, vocabulary and meaning of the words. '
  + 'Do not interpret doctrine or theology.';

const SOURCE_RULE = 'Never quote or invent Bible verses. Use only the text given here.';

const FORMAT_RULE = 'Write plain text only, with no markdown, lists or headings.';

function clip(text, max) {
  const s = String(text ?? '').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}

// The week's verses, whole, stopping at the budget rather than cutting one mid-sentence.
export function passageText(week) {
  const out = [];
  let used = 0;
  for (const row of verseRefs(week)) {
    if (out.length && used + row.t.length + 1 > MAX_PASSAGE_CHARS) break;
    out.push(row.t);
    used += row.t.length + 1;
  }
  return out.join('\n');
}

function vocabTerms(week) {
  return (week.vocab ?? []).slice(0, MAX_VOCAB_TERMS).map((t) => `${t[0]} (${t[1]})`).join(', ');
}

// The facts of one miss, gathered from a lesson step and what the recognizer heard.
export function missContext(step, heard, week) {
  const expected = step.kind === 'ask' ? step.model
    : step.kind === 'recall' ? step.full
      : step.text ?? '';
  return {
    expected,
    heard: heard ?? '',
    en: step.en ?? '',
    question: step.kind === 'ask' ? step.q : '',
    grammarTitle: week?.grammar?.title ?? '',
    grammarBody: week?.grammar?.body ?? '',
  };
}

export function explainPrompt(miss) {
  const system = [
    'You are a patient tutor helping an English-speaking adult read the Italian Bible.',
    'In at most 2 short sentences of plain English, explain only the words that differ between the expected Italian '
      + 'and what the learner said: what the expected form means, and what the learner\'s form would mean instead.',
    'Say nothing about any other word. Use a grammar term only if you are certain of it; otherwise describe the meaning. '
      + 'The learner\'s form may be good Italian in another context, so do not call it wrong in general.',
    'Do not say whether the learner passed. The app has already handled that.',
    TRANSCRIPT_RULE,
    SCOPE_RULE,
    SOURCE_RULE,
    FORMAT_RULE,
  ].join(' ');
  const parts = [
    miss.question && `Question asked: ${miss.question}`,
    `Expected Italian: ${miss.expected}`,
    miss.en && `Its meaning in English: ${miss.en}`,
    `The learner said: ${miss.heard || '(nothing)'}`,
    miss.grammarTitle && `This week's grammar topic: ${miss.grammarTitle}. ${clip(miss.grammarBody, MAX_GRAMMAR_CHARS)}`,
  ].filter(Boolean);
  return { system, messages: [{ role: 'user', content: parts.join('\n') }] };
}

export function conversaSystem(week, { missedWords = [] } = {}) {
  const opening = conversaOpening(week);
  const parts = [
    'You are having a friendly spoken conversation in Italian with an adult learner about this week\'s Bible reading.',
    // Here rather than in the history, because trimHistory always starts on a learner turn.
    opening && `You began by asking the learner: ${opening}`,
    `Reply only in simple Italian that a beginner can follow, in at most ${MAX_REPLY_WORDS} words: one or two short sentences, `
      + 'ending with one simple question about the reading.',
    'If the learner makes a real grammar mistake, use the correct form naturally in your reply without pointing it out. '
      + 'If what they said is correct, do not correct anything.',
    "If you can't understand them, ask them in Italian to say it again.",
    TRANSCRIPT_RULE,
    'If asked about doctrine or theology, say gently in Italian that a priest or teacher can help, then return to the reading.',
    SOURCE_RULE,
    FORMAT_RULE,
    `\nThis week's reading:\n${passageText(week)}`,
    vocabTerms(week) && `\nWords to use when they fit: ${vocabTerms(week)}`,
    week?.grammar?.title && `\nGrammar this week: ${week.grammar.title}`,
    missedWords.length > 0 && `\nWords the learner found hard, worth using again: ${missedWords.join(', ')}`,
  ];
  return parts.filter(Boolean).join('\n');
}

// The opening line is authored rather than generated, so it plays at once and is right
// even while the model is still loading.
export function conversaOpening(week) {
  return week?.questions?.[0]?.q || week?.prompt?.it || '';
}

// Newest turns kept within budget. Always keeps the newest turn, and starts on a learner
// turn, the form every model's chat format expects.
export function trimHistory(messages, max = MAX_HISTORY_CHARS) {
  const kept = [];
  let used = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const size = messages[i].content.length;
    if (kept.length && used + size > max) break;
    kept.unshift(messages[i]);
    used += size;
  }
  while (kept.length > 1 && kept[0].role !== 'user') kept.shift();
  return kept;
}

export function conversaPrompt(week, history, opts) {
  return { system: conversaSystem(week, opts), messages: trimHistory(history) };
}

export function translatePrompt(text) {
  return {
    system: `Translate the Italian text into natural English. Reply with the translation only. ${FORMAT_RULE}`,
    messages: [{ role: 'user', content: text }],
  };
}
