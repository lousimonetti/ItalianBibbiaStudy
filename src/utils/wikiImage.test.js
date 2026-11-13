import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { imageQueryUrl, parseImages, fetchImages, forgetImage, loadImageCache, IMAGE_CACHE_KEY } from './wikiImage';

const answer = {
  query: {
    normalized: [{ from: 'last supper', to: 'Last supper' }],
    redirects: [{ from: 'Last supper', to: 'Last Supper' }],
    pages: [
      { title: 'Pentecost', thumbnail: { source: 'https://upload.example/p.jpg' } },
      { title: 'Last Supper', thumbnail: { source: 'https://upload.example/l.jpg' } },
      { title: 'No Picture' },
    ],
  },
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('wikiImage', () => {
  it('asks for every title in one CORS-open request', () => {
    const url = imageQueryUrl(['Pentecost', 'Visitation (Christianity)']);
    expect(url).toContain('origin=*');
    expect(url).toContain('Pentecost%7CVisitation%20(Christianity)');
  });

  it('maps requested titles through normalisation and redirects', () => {
    expect(parseImages(answer, ['Pentecost', 'last supper', 'No Picture', 'Absent'])).toEqual({
      Pentecost: 'https://upload.example/p.jpg',
      'last supper': 'https://upload.example/l.jpg',
    });
    expect(parseImages(null, ['A'])).toEqual({});
  });

  it('batches same-tick lookups, caches, and does not ask twice', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => answer }));
    vi.stubGlobal('fetch', fetchMock);
    const [a, b] = await Promise.all([fetchImages(['Pentecost']), fetchImages(['Last Supper'])]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ Pentecost: 'https://upload.example/p.jpg' });
    expect(b).toEqual({ 'Last Supper': 'https://upload.example/l.jpg' });
    await fetchImages(['Pentecost']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(IMAGE_CACHE_KEY.startsWith('coursekit-')).toBe(true);
  });

  it('returns nothing offline and forgets a dead picture', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await fetchImages(['Pentecost'])).toEqual({});
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify({ Pentecost: 'x' }));
    forgetImage('Pentecost');
    expect(loadImageCache()).toEqual({});
  });
});
