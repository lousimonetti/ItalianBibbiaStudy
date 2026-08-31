import { useState, useMemo } from 'react';
import { WordGloss } from './WordGloss';
import { SpeakerButton } from './SpeakerButton';
import { readingLines, hasPassage } from '../utils/keyVerses';
import { recordActivity, todayFlags, loadStreak } from '../utils/streak';
import { analyze } from '../utils/clauseSkeleton';

// O2 — Interactive reading. Renders the week's connected verses (an authored
// `passage` when present, else the vetted vocab example sentences) with every
// word tappable via WordGloss and a per-line speaker. A "mark as read" button
// ticks today's reading goal so in-app reading counts toward the streak.
//
// The "Struttura" toggle layers a clause skeleton over the same text
// (src/utils/clauseSkeleton.js): finite verbs are boxed, participles leaning on
// an auxiliary are marked as one compound verb, bare participles are flagged as
// the reduced relative clauses they are, and comma-delimited asides with no verb
// of their own are dimmed so the sentence can be read without them first. It is
// the pencil-on-paper habit for periodic prose, built into the reader. Words stay
// tappable while it is on.
export function ReadingPassage({ week }) {
  const lines = readingLines(week);
  const authored = hasPassage(week);
  const [skeleton, setSkeleton] = useState(false);
  const [read, setRead] = useState(() => {
    try { return !!todayFlags(loadStreak()).read; } catch { return false; }
  });

  // Analyzed once per passage, not per toggle — the reader flips this a lot.
  const analyses = useMemo(() => lines.map((line) => analyze(line.t)), [lines]);

  if (!lines.length) return null;

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

      <button
        type="button"
        className={`skeleton-toggle${skeleton ? ' active' : ''}`}
        onClick={() => setSkeleton((v) => !v)}
        aria-pressed={skeleton}
        title="Highlight the finite verbs and dim the asides — find the clause spine first"
      >
        {skeleton ? '✓ Struttura' : 'Struttura'}
      </button>

      {skeleton && (
        <div className="skeleton-legend">
          <span><b className="sk-key sk-finite-key">verbo</b> finite verb — one per clause</span>
          <span><b className="sk-key sk-compound-key">è venuto</b> compound verb (one unit)</span>
          <span><b className="sk-key sk-participle-key">dato</b> participle = <i>che è stato dato</i></span>
          <span><b className="sk-key sk-dim-key">, … ,</b> aside — read the sentence without it</span>
        </div>
      )}

      <div className={`reading-box${skeleton ? ' reading-box-skeleton' : ''}`}>
        {lines.map((line, i) => (
          <div className="reading-line" key={i}>
            {line.ref && <span className="reading-vnum">{line.ref}</span>}
            <span className="reading-text">
              <WordGloss text={line.t} roles={skeleton ? analyses[i].tokens : null} />
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
