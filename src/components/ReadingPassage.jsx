import { useState, useMemo } from 'react';
import { WordGloss } from './WordGloss';
import { SpeakerButton } from './SpeakerButton';
import { readingLines, hasPassage, hasEnglish } from '../utils/keyVerses';
import { recordActivity, todayFlags, loadStreak } from '../utils/streak';
import { analyze } from '../utils/clauseSkeleton';
import { storageKey } from '../utils/storageKey';

// O2 — Interactive reading. Renders the week's connected verses (an authored
// `passage` when present, else the vetted vocab example sentences) with every
// word tappable via WordGloss and a per-line speaker. A "mark as read" button
// ticks today's reading goal so in-app reading counts toward the streak.
//
// Two view toggles sit above the text, and both persist (the choice is a
// reading habit, not a per-week whim):
//
// "Inglese" shows the English of each verse under the Italian — the whole line,
// not the word-by-word gloss a tap gives you. Meaning first, then the words.
// It only appears when the reading actually carries English (`verse.en` for an
// authored passage, the vocab tuple's `exEn` for the fallback).
//
// "Struttura" layers a clause skeleton over the same text
// (src/utils/clauseSkeleton.js): finite verbs are boxed, a participle leaning on
// an auxiliary is tied to it as one verb, bare participles are flagged as the
// reduced relative clauses they are, and genuine comma-delimited asides are
// dimmed so the sentence can be read without them first. It is the
// pencil-on-paper habit for periodic prose, built into the reader. Words stay
// tappable while it is on.
const VIEW_KEY = storageKey('reading-view');

function loadView() {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}');
    return { english: !!v.english, skeleton: !!v.skeleton };
  } catch {
    return { english: false, skeleton: false };
  }
}

function saveView(view) {
  try { localStorage.setItem(VIEW_KEY, JSON.stringify(view)); } catch { /* private mode */ }
}

export function ReadingPassage({ week }) {
  const lines = readingLines(week);
  const authored = hasPassage(week);
  const translated = hasEnglish(week);
  const [view, setView] = useState(loadView);
  const [read, setRead] = useState(() => {
    try { return !!todayFlags(loadStreak()).read; } catch { return false; }
  });

  // Analyzed once per passage, not per toggle — the reader flips this a lot.
  const analyses = useMemo(() => lines.map((line) => analyze(line.t)), [lines]);

  if (!lines.length) return null;

  const { english, skeleton } = view;
  const toggle = (k) => setView((v) => {
    const next = { ...v, [k]: !v[k] };
    saveView(next);
    return next;
  });

  const markRead = () => {
    recordActivity('read');
    setRead(true);
  };

  return (
    <div className="detail-section reading-section">
      <div className="detail-label-row">
        <span className="detail-label">Read the passage</span>
        <span className="reading-source">
          {authored
            ? `${week.passage.ref || week.r}${week.passage.translation ? ` · ${week.passage.translation}` : ''}`
            : 'Key verses · tap any word'}
        </span>
      </div>

      <div className="reading-tools">
        {translated && (
          <button
            type="button"
            className={`skeleton-toggle${english ? ' active' : ''}`}
            onClick={() => toggle('english')}
            aria-pressed={english}
            title="Show the English of each verse under the Italian"
          >
            {english ? '✓ Inglese' : 'Inglese'}
          </button>
        )}
        <button
          type="button"
          className={`skeleton-toggle${skeleton ? ' active' : ''}`}
          onClick={() => toggle('skeleton')}
          aria-pressed={skeleton}
          title="Highlight the finite verbs and dim the asides — find the clause spine first"
        >
          {skeleton ? '✓ Struttura' : 'Struttura'}
        </button>
      </div>

      {skeleton && (
        <div className="skeleton-legend">
          <span><b className="sk-key sk-finite-key">disse</b> finite verb — count them: one per clause</span>
          <span>
            <b className="sk-key sk-finite-key">è</b>
            <b className="sk-key sk-compound-key">venuto</b> auxiliary + participle = one verb
          </span>
          <span><b className="sk-key sk-participle-key">dato</b> bare participle = <i>che è stato dato</i></span>
          <span><b className="sk-key sk-dim-key">, … ,</b> aside — read the sentence without it</span>
        </div>
      )}

      <div className={`reading-box${skeleton ? ' reading-box-skeleton' : ''}`}>
        {lines.map((line, i) => (
          <div className="reading-line" key={i}>
            {line.ref && <span className="reading-vnum">{line.ref}</span>}
            <span className="reading-text">
              <WordGloss text={line.t} roles={skeleton ? analyses[i].tokens : null} />
              {english && line.en && <span className="reading-en">{line.en}</span>}
            </span>
            {skeleton && analyses[i].finiteCount > 0 && (
              <span
                className="skeleton-count"
                title={`${analyses[i].finiteCount} finite verb${analyses[i].finiteCount === 1 ? '' : 's'} — so ${analyses[i].finiteCount} clause${analyses[i].finiteCount === 1 ? '' : 's'}`}
              >
                {analyses[i].finiteCount}
              </span>
            )}
            <SpeakerButton word={line.t} size={14} />
          </div>
        ))}
      </div>

      <button
        className={`reading-read-btn${read ? ' reading-read-done' : ''}`}
        onClick={markRead}
        disabled={read}
      >
        {read ? '✓ Read today' : 'Mark as read today'}
      </button>
    </div>
  );
}
