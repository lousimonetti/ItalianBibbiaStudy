// Santo del giorno logic. The saint *calendar* is bundled and works offline
// (src/data/saintsCalendar.js); the *story* is fetched at runtime in the
// browser from Wikipedia's CORS-open REST API (like the LanguageTool call in
// JournalTab, this is an intentional online-only enrichment) and cached in
// localStorage so previously viewed days work offline.
//
// The cache key is deliberately NOT namespaced with storageKey(): wiki
// extracts are bulky device-local enrichment, and prefixing them would drag
// them into the cross-device sync snapshot (which auto-collects every
// `STORAGE_PREFIX-*` key) and bloat the QR codes.

import { SAINTS } from '../data/saintsCalendar';

export const CACHE_KEY = 'coursekit-saints-cache';
export const CACHE_MAX = 40;

export function dateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}-${day}`;
}

export function saintForDate(d = new Date()) {
  const key = dateKey(d);
  const entry = SAINTS[key];
  return entry ? { key, ...entry } : null;
}

export function addDays(d, delta) {
  const next = new Date(d);
  next.setDate(next.getDate() + delta);
  return next;
}

// ── Wikipedia URL builders (pure, unit-tested) ──────────────────────────────
export function summaryUrl(lang, title) {
  return `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    String(title).replace(/ /g, '_')
  )}`;
}

export function searchUrl(lang, term) {
  return `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
    term
  )}&limit=1&format=json&origin=*`;
}

export function articleUrl(lang, title) {
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/ /g, '_'))}`;
}

// Human-facing search page (for the "cerca su Wikipedia" fallback link).
export function searchPageUrl(lang, term) {
  return `https://${lang}.wikipedia.org/w/index.php?search=${encodeURIComponent(term)}`;
}

// ── localStorage cache ({ [dateKey]: { …story, savedAt } }) ─────────────────
export function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

// Pure: add an entry, evicting the oldest beyond `max`. Exported for tests.
export function withCached(cache, key, entry, max = CACHE_MAX, now = Date.now()) {
  const next = { ...(cache || {}), [key]: { ...entry, savedAt: now } };
  const keys = Object.keys(next);
  if (keys.length > max) {
    keys
      .sort((a, b) => (next[a].savedAt || 0) - (next[b].savedAt || 0))
      .slice(0, keys.length - max)
      .forEach((k) => delete next[k]);
  }
  return next;
}

export function saveToCache(key, entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(withCached(loadCache(), key, entry)));
  } catch {
    // storage full/unavailable — the story just won't be available offline
  }
}

// ── fetch orchestration (browser-only; graceful nulls, never throws) ────────
async function fetchSummary(lang, title) {
  const resp = await fetch(summaryUrl(lang, title), {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data?.extract || data.type === 'disambiguation') return null;
  return { title: data.title, extract: data.extract, url: articleUrl(lang, data.title) };
}

async function searchTitle(lang, term) {
  const resp = await fetch(searchUrl(lang, term));
  if (!resp.ok) return null;
  const data = await resp.json();
  return data?.[1]?.[0] || null;
}

// Get { title, extract, url } for one language: try the authored title, then
// fall back to a Wikipedia title search on the saint's display name.
async function fetchLang(lang, title, searchTerm) {
  try {
    const direct = await fetchSummary(lang, title);
    if (direct) return direct;
    const found = await searchTitle(lang, searchTerm);
    if (found && found !== title) return await fetchSummary(lang, found);
    return null;
  } catch {
    return null; // offline or blocked — caller shows the offline/cached state
  }
}

// Fetch the full story for a saint entry: Italian + English in parallel.
// Returns { it: {title,extract,url}|null, en: {…}|null }.
export async function fetchSaintStory(saint) {
  const [it, en] = await Promise.all([
    fetchLang('it', saint.it, saint.name),
    fetchLang('en', saint.en, saint.en),
  ]);
  return { it, en };
}
