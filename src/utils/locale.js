import { config } from '../../course/config';

// Locale derived from the active course. One place for the engines/components to
// read TTS language, grammar-check language, IPA availability, and the
// article-stripping regex — so retargeting to another language is a config edit.

export const TTS_LANG = config.locale.target;          // SpeechSynthesis / SpeechRecognition
export const NATIVE_LANG = config.locale.native;       // the learner's language
export const GRAMMAR_LANG = config.locale.grammarLang;  // LanguageTool code ('' disables it)
export const HAS_IPA = config.locale.hasIPA !== false;  // default true

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build a "leading article" matcher from the course's article list. Articles
// ending in an apostrophe (elided, e.g. "l'") match with no following space;
// the rest require trailing whitespace. Longest-first so "il " beats "i ".
export function buildArticleRegex(articles = []) {
  if (!articles.length) return /^\b$/; // matches nothing
  const parts = [...articles]
    .sort((a, b) => b.length - a.length)
    .map((a) => (/['’]$/.test(a) ? `${esc(a.slice(0, -1))}['’]` : `${esc(a)}\\s+`));
  return new RegExp(`^(${parts.join('|')})`, 'i');
}

export const LEADING_ARTICLE = buildArticleRegex(config.locale.articles);
