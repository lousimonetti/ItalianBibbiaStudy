// Pictures for the Rosary mysteries: the lead image of each mystery's English
// Wikipedia article, looked up at runtime (like the Saints tab's stories — an
// online-only enrichment; nothing is bundled). One request covers a whole set,
// and only the picture's address is cached, under a key that stays out of the
// sync snapshot. Offline, or when an article has no picture, there is simply
// no picture.

export const IMAGE_CACHE_KEY = 'coursekit-image-cache';
export const IMAGE_SIZE = 480;

export function imageQueryUrl(titles, lang = 'en', size = IMAGE_SIZE) {
  return `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail`
    + `&pithumbsize=${size}&redirects=1&format=json&formatversion=2&origin=*`
    + `&titles=${encodeURIComponent(titles.join('|'))}`;
}

// { requested title: picture address } from the API's answer. A title the API
// normalised or redirected is followed to the page it ended up at.
export function parseImages(json, titles) {
  const q = json?.query || {};
  const hop = new Map([...(q.normalized || []), ...(q.redirects || [])].map((r) => [r.from, r.to]));
  const byTitle = new Map((q.pages || []).map((p) => [p.title, p.thumbnail?.source || '']));
  const out = {};
  for (const title of titles) {
    let t = title;
    for (let i = 0; i < 3 && hop.has(t); i++) t = hop.get(t);
    if (byTitle.get(t)) out[title] = byTitle.get(t);
  }
  return out;
}

export function loadImageCache() {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveImageCache(cache) {
  try { localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache)); } catch { /* storage unavailable */ }
}

// A picture that no longer loads (the article changed its lead image) is
// forgotten, so the next visit asks again.
export function forgetImage(title) {
  const cache = loadImageCache();
  if (!(title in cache)) return;
  delete cache[title];
  saveImageCache(cache);
}

// Lookups asked for in the same tick (five pictures mounting together) share
// one request.
let pending = null;

function lookUp(titles) {
  if (!pending) {
    const batch = { titles: new Set() };
    batch.done = new Promise((resolve) => setTimeout(resolve, 0)).then(async () => {
      pending = null;
      const asked = [...batch.titles];
      try {
        const resp = await fetch(imageQueryUrl(asked));
        if (resp.ok) saveImageCache({ ...loadImageCache(), ...parseImages(await resp.json(), asked) });
      } catch {
        // offline or blocked — whatever is cached still shows
      }
    });
    pending = batch;
  }
  titles.forEach((t) => pending.titles.add(t));
  return pending.done;
}

// { title: address } for the titles that have a picture. Never throws.
export async function fetchImages(titles) {
  const wanted = [...new Set((titles || []).filter(Boolean))];
  const missing = wanted.filter((t) => !loadImageCache()[t]);
  if (missing.length) await lookUp(missing);
  const cache = loadImageCache();
  return Object.fromEntries(wanted.filter((t) => cache[t]).map((t) => [t, cache[t]]));
}
