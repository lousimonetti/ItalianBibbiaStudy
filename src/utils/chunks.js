// Formulaic-chunk ("Frasi fisse") helpers (plan-speaking.md S1). A phrase is
// { it, en, lit? } where `it` is the fixed Italian expression, `en` its natural
// meaning, and the optional `lit` is a literal word-by-word rendering that
// exposes how Italian *construes* the meaning differently from English — the
// mindset lever (e.g. "mi piace" → "it pleases me"). Pure + unit-tested.

export function weekPhrases(week) {
  if (!Array.isArray(week?.phrases)) return [];
  return week.phrases.filter(
    (p) => p && typeof p.it === 'string' && p.it.trim() && typeof p.en === 'string' && p.en.trim()
  );
}
