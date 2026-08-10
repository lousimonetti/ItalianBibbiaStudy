// Lexical recycling — find words from EARLIER weeks that resurface in a given
// week's material.
//
// WHY: only 21 of the course's 233 unique terms (9%) are formally repeated
// across weeks, so the SRS re-tests the *card* while the learner never re-meets
// the *word in a new context*. Card repetition builds a translation pair;
// contextual re-encounter is what makes a word usable. Nation's estimate is
// 8–12 encounters in varied contexts before a word is available for production.
//
// This module needs no new content: it scans the current week's example
// sentences and writing prompt for terms already introduced in previous weeks,
// so the UI can surface "you have met this before, in week 3".
//
// Pure and unit-tested; the UI glue lives in WeekDetail.

import { parseVocab } from '../../course/vocab';
import { LEADING_ARTICLE } from './locale';

function clean(s) {
  return String(s ?? '').toLowerCase().trim();
}

function stripArticle(s) {
  return clean(s).replace(LEADING_ARTICLE, '').trim();
}

// The searchable text of a week: every example sentence plus the writing prompt.
function weekText(week) {
  const parts = week.vocab.map((t) => parseVocab(t).ex);
  if (week.prompt?.it) parts.push(week.prompt.it);
  return clean(parts.join('  ')); //  keeps sentences from fusing
}

// Match on a whole-word boundary so "vita" doesn't fire inside "invitati".
function containsWord(haystack, needle) {
  if (!needle || needle.length < 3) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-zà-ÿ])${escaped}(?:[^a-zà-ÿ]|$)`, 'i').test(haystack);
}

// Terms introduced before `week` that reappear in this week's material.
// Returns [{ it, en, firstWeek }], earliest-introduced first, capped at `limit`.
export function recycledWords(week, allWeeks, { limit = 8 } = {}) {
  if (!week || !Array.isArray(allWeeks)) return [];
  const haystack = weekText(week);
  if (!haystack) return [];

  // Terms owned by this week are not "recycled" — skip them.
  const own = new Set();
  for (const t of week.vocab) {
    const { it } = parseVocab(t);
    own.add(clean(it));
    own.add(stripArticle(it));
  }

  const seen = new Set();
  const out = [];
  for (const w of allWeeks) {
    if (w.n >= week.n) continue;
    for (const tuple of w.vocab) {
      const { it, en } = parseVocab(tuple);
      const key = clean(it);
      if (seen.has(key) || own.has(key)) continue;
      const stem = stripArticle(it);
      if (own.has(stem)) continue;
      if (containsWord(haystack, stem) || containsWord(haystack, key)) {
        seen.add(key);
        out.push({ it, en, firstWeek: w.n });
      }
    }
  }
  return out.slice(0, limit);
}
