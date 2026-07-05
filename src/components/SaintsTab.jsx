import { useState, useEffect } from 'react';
import {
  saintForDate,
  addDays,
  dateKey,
  fetchSaintStory,
  loadCache,
  saveToCache,
  searchPageUrl,
} from '../utils/saints';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';
import { UiText } from '../i18n/UiText';

// Santo del giorno — the day's saint from the bundled calendar (offline), with
// the hagiography fetched from Wikipedia at runtime: Italian first (every word
// tappable via WordGloss, whole-story TTS), English version underneath.
// Fetched stories are cached in localStorage so revisits work offline.

function fmtDate(d) {
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Split an extract into readable paragraphs (sentence groups of ~2) so each
// gets its own speaker + gloss block without a wall of text.
function paragraphs(extract) {
  const sentences = String(extract).match(/[^.!?]+[.!?]+(\s|$)/g) || [String(extract)];
  const out = [];
  for (let i = 0; i < sentences.length; i += 2) {
    out.push(sentences.slice(i, i + 2).join('').trim());
  }
  return out.filter(Boolean);
}

export function SaintsTab() {
  const [date, setDate] = useState(() => new Date());
  const [status, setStatus] = useState('loading'); // loading | ok | cached | offline
  const [story, setStory] = useState(null); // { it, en } | null
  const [enOpen, setEnOpen] = useState(false);

  const saint = saintForDate(date);
  const key = dateKey(date);
  const isToday = dateKey(new Date()) === key;

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setStory(null);
    setEnOpen(false);
    const cached = loadCache()[key];

    fetchSaintStory(saint).then((fetched) => {
      if (!alive) return;
      if (fetched.it || fetched.en) {
        setStory(fetched);
        setStatus('ok');
        saveToCache(key, fetched);
      } else if (cached) {
        setStory(cached);
        setStatus('cached');
      } else {
        setStatus('offline');
      }
    });
    return () => { alive = false; };
    // saint derives from key; key is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div className="saints-wrap">
      {/* Date navigation */}
      <div className="saints-nav">
        <button className="saints-nav-btn" onClick={() => setDate(d => addDays(d, -1))} aria-label="Previous day">‹</button>
        <div className="saints-nav-center">
          <div className="saints-date">{fmtDate(date)}</div>
          {!isToday && (
            <button className="saints-today-btn" onClick={() => setDate(new Date())}>
              torna a oggi
            </button>
          )}
        </div>
        <button className="saints-nav-btn" onClick={() => setDate(d => addDays(d, 1))} aria-label="Next day">›</button>
      </div>

      {/* Saint header */}
      <div className="saints-header">
        <div className="saints-kicker" title="Saint of the day"><UiText k="saints.ofTheDay" /></div>
        <h2 className="saints-name">
          {saint.name}
          <SpeakerButton word={saint.name} size={20} />
        </h2>
      </div>

      {status === 'loading' && (
        <div className="saints-status">Caricamento della storia… <span className="saints-status-en">loading the story</span></div>
      )}

      {status === 'offline' && (
        <div className="saints-status saints-status-offline">
          La storia del santo richiede una connessione internet — the saint's
          story needs an internet connection (the app fetches it from
          Wikipedia). The calendar itself works offline; connect once and this
          day will be saved for offline reading.
        </div>
      )}

      {(status === 'ok' || status === 'cached') && story && (
        <>
          {status === 'cached' && (
            <div className="saints-cached-note">Versione salvata — offline copy from your last visit.</div>
          )}

          {/* Italian story */}
          {story.it ? (
            <div className="saints-story">
              <div className="saints-story-label">
                La storia <span className="saints-story-sub">— tap any word for meaning & pronunciation</span>
                <SpeakerButton word={story.it.extract} size={18} />
              </div>
              {paragraphs(story.it.extract).map((p, i) => (
                <p className="saints-para" key={i}>
                  <WordGloss text={p} />
                  <SpeakerButton word={p} size={13} />
                </p>
              ))}
              <a className="saints-wiki-link" href={story.it.url} target="_blank" rel="noreferrer">
                Leggi tutto su Wikipedia (italiano) →
              </a>
            </div>
          ) : (
            <div className="saints-status">
              Nessuna voce italiana trovata —{' '}
              <a href={searchPageUrl('it', saint.name)} target="_blank" rel="noreferrer">
                cerca su Wikipedia
              </a>
            </div>
          )}

          {/* English version */}
          {story.en && (
            <div className="saints-en">
              <button className="saints-en-toggle" onClick={() => setEnOpen(v => !v)}>
                <span>English version</span>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                  style={{ transform: enOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {enOpen && (
                <div className="saints-en-body">
                  {paragraphs(story.en.extract).map((p, i) => (
                    <p className="saints-para saints-para-en" key={i}>{p}</p>
                  ))}
                  <a className="saints-wiki-link" href={story.en.url} target="_blank" rel="noreferrer">
                    Read more on Wikipedia (English) →
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="saints-credit">
        Testi da Wikipedia (CC BY-SA) · calendario dei santi incluso nell'app
      </div>
    </div>
  );
}
