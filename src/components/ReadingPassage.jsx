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
// "Inglese" cycles through three states, because a tap gives you one word and
// sometimes you need the whole line:
//   'off'   — Italian only; each verse carries an EN chip that reveals *that*
//             verse's full English inline, for the one line that blocked you.
//   'under' — the English of every verse under its Italian (meaning first,
//             then the words).
//   'only'  — the passage read as continuous English, Italian hidden. The
//             speaker still speaks the Italian, so you can read the meaning
//             and hear the line it belongs to.
// It only appears when the reading actually carries English (`verse.en` for an
// authored passage, the vocab tuple's `exEn` for the fallback).
//
// "Struttura" layers a clause skeleton over the same text
// (src/utils/clauseSkeleton.js): finite verbs are boxed, a participle leaning on
// an auxiliary is tied to it as one verb, bare participles are flagged as the
// reduced relative clauses they are, and genuine comma-delimited asides are
// dimmed so the sentence can be read without them first. It is the
// pencil-on-paper habit for periodic prose, built into the reader. Words stay
// tappable while it is on. It is hidden in the English-only view, which has no
// Italian on screen to mark up.
const VIEW_KEY = storageKey('reading-view');

const ENGLISH_STATES = ['off', 'under', 'only'];

// The stored `english` was a boolean before the third state existed; a saved
// `true` means "under each verse", which is what that toggle used to do.
function normalizeEnglish(v) {
  if (v === true) return 'under';
  return ENGLISH_STATES.includes(v) ? v : 'off';
}

function loadView() {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}');
    return { english: normalizeEnglish(v.english), skeleton: !!v.skeleton };
  } catch {
    return { english: 'off', skeleton: false };
  }
}

function saveView(view) {
  try { localStorage.setItem(VIEW_KEY, JSON.stringify(view)); } catch { /* private mode */ }
}

const ENGLISH_LABEL = {
  off: 'Inglese',
  under: '✓ Inglese',
  only: '✓ Solo inglese',
};

const ENGLISH_TITLE = {
  off: 'Show the English of every verse under the Italian',
  under: 'Showing the English under each verse — click for English only',
  only: 'Showing English only — click to go back to Italian',
};

export function ReadingPassage({ week }) {
  const lines = readingLines(week);
  const authored = hasPassage(week);
  const translated = hasEnglish(week);
  const [view, setView] = useState(loadView);
  // Per-verse reveals: deliberately session-local, not persisted. Needing one
  // line's English is a moment, not a setting — the setting is the toggle.
  const [revealed, setRevealed] = useState(() => new Set());
  const [read, setRead] = useState(() => {
    try { return !!todayFlags(loadStreak()).read; } catch { return false; }
  });

  // Analyzed once per passage, not per toggle — the reader flips this a lot.
  const analyses = useMemo(() => lines.map((line) => analyze(line.t)), [lines]);

  if (!lines.length) return null;

  const { english, skeleton } = view;
  const englishOnly = english === 'only';

  const cycleEnglish = () => setView((v) => {
    const next = { ...v, english: ENGLISH_STATES[(ENGLISH_STATES.indexOf(v.english) + 1) % 3] };
    saveView(next);
    return next;
  });

  const toggleSkeleton = () => setView((v) => {
    const next = { ...v, skeleton: !v.skeleton };
    saveView(next);
    return next;
  });

  const toggleVerse = (i) => setRevealed((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
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
            className={`skeleton-toggle${english !== 'off' ? ' active' : ''}`}
            onClick={cycleEnglish}
            aria-pressed={english !== 'off'}
            title={ENGLISH_TITLE[english]}
          >
            {ENGLISH_LABEL[english]}
          </button>
        )}
        {!englishOnly && (
          <button
            type="button"
            className={`skeleton-toggle${skeleton ? ' active' : ''}`}
            onClick={toggleSkeleton}
            aria-pressed={skeleton}
            title="Show the frame of each sentence: conjugated verbs underlined, asides faded"
          >
            {skeleton ? '✓ Struttura' : 'Struttura'}
          </button>
        )}
      </div>

      {skeleton && !englishOnly && (
        <div className="skeleton-legend">
          <p className="skeleton-intro">
            Struttura shows the frame of each sentence. Long Italian sentences
            are built around their conjugated verbs, so find those first, then
            fill in everything else.
          </p>
          <ul className="skeleton-keys">
            <li>
              <span className="sk-sample">
                <b className="sk-key sk-finite-key">disse</b>{' '}
                <b className="sk-key sk-finite-key">fu</b>
              </span>
              <span>
                <strong>Conjugated verb.</strong> A verb with a person and
                a tense: <i>disse</i> = &ldquo;he said&rdquo;, <i>fu</i> =
                &ldquo;he was&rdquo;. Every full clause has exactly one, whether
                it is the main clause or one that starts with <i>che</i>,{' '}
                <i>chi</i>, <i>perché</i>…
              </span>
            </li>
            <li>
              <span className="sk-sample">
                <b className="sk-key sk-finite-key">è</b>{' '}
                <b className="sk-key sk-compound-key">venuto</b>
              </span>
              <span>
                <strong>Two-word verb.</strong> A helper verb
                (<i>è</i>, <i>ha</i>, <i>fu</i>…) plus a participle is one
                verb: <i>è venuto</i> = &ldquo;has come&rdquo;,{' '}
                <i>fu battezzato</i> = &ldquo;was baptized&rdquo;. The helper is
                the conjugated part, so it gets the solid line and is the one
                counted; the participle (dashed) carries the meaning.
              </span>
            </li>
            <li>
              <span className="sk-sample"><b className="sk-key sk-participle-key">dato</b></span>
              <span>
                <strong>Participle on its own.</strong> No helper verb,
                so read it as a shortened &ldquo;which was…&rdquo; clause:{' '}
                <i>nome dato agli uomini</i> = &ldquo;name (which was) given
                to men&rdquo;.
              </span>
            </li>
            <li>
              <span className="sk-sample"><b className="sk-key sk-dim-key">pieno di Spirito</b></span>
              <span>
                <strong>Faded words.</strong> An aside between commas.
                The sentence still works without it, so skip it on your first
                read, then add it back.
              </span>
            </li>
            <li>
              <span className="sk-sample"><span className="skeleton-count">2</span></span>
              <span>
                <strong>Verb count.</strong> The number of conjugated verbs
                in the verse, which is how many full clauses to look for.
                Participle and <i>-ando</i>/<i>-endo</i> phrases are not
                counted.
              </span>
            </li>
          </ul>
          <p className="skeleton-note">
            Marked automatically. It can miss a verb, but what it marks is
            usually right. Every word can still be tapped for its meaning.
          </p>
        </div>
      )}

      <div className={`reading-box${skeleton && !englishOnly ? ' reading-box-skeleton' : ''}${englishOnly ? ' reading-box-en' : ''}`}>
        {lines.map((line, i) => {
          // In the English-only view a line with no authored English would
          // vanish, so it keeps its Italian rather than leaving a hole.
          const soloEn = englishOnly && line.en;
          const showEn = !englishOnly && line.en && (english === 'under' || revealed.has(i));
          return (
            <div className="reading-line" key={i}>
              {line.ref && <span className="reading-vnum">{line.ref}</span>}
              <span className="reading-text">
                {soloEn
                  ? <span className="reading-en-solo">{line.en}</span>
                  : <WordGloss text={line.t} roles={skeleton && !englishOnly ? analyses[i].tokens : null} />}
                {showEn && <span className="reading-en">{line.en}</span>}
              </span>
              {english === 'off' && line.en && (
                <button
                  type="button"
                  className={`reading-en-btn${revealed.has(i) ? ' active' : ''}`}
                  onClick={() => toggleVerse(i)}
                  aria-expanded={revealed.has(i)}
                  aria-label={line.ref ? `English for verse ${line.ref}` : 'English for this line'}
                  title="Show this verse in English"
                >
                  EN
                </button>
              )}
              {skeleton && !englishOnly && analyses[i].finiteCount > 0 && (
                <span
                  className="skeleton-count"
                  title={`${analyses[i].finiteCount} conjugated verb${analyses[i].finiteCount === 1 ? '' : 's'}, so ${analyses[i].finiteCount} full clause${analyses[i].finiteCount === 1 ? '' : 's'}`}
                >
                  {analyses[i].finiteCount}
                </span>
              )}
              <SpeakerButton word={line.t} size={14} />
            </div>
          );
        })}
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
