import { useState } from 'react';
import { WordGloss } from './WordGloss';
import { SpeakerButton } from './SpeakerButton';
import { readingLines, hasPassage } from '../utils/keyVerses';
import { recordActivity, todayFlags, loadStreak } from '../utils/streak';

// O2 — Interactive reading. Renders the week's connected verses (an authored
// `passage` when present, else the vetted vocab example sentences) with every
// word tappable via WordGloss and a per-line speaker. A "mark as read" button
// ticks today's reading goal so in-app reading counts toward the streak.
export function ReadingPassage({ week }) {
  const lines = readingLines(week);
  const authored = hasPassage(week);
  const [read, setRead] = useState(() => {
    try { return !!todayFlags(loadStreak()).read; } catch { return false; }
  });

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

      <div className="reading-box">
        {lines.map((line, i) => (
          <div className="reading-line" key={i}>
            {line.ref && <span className="reading-vnum">{line.ref}</span>}
            <span className="reading-text"><WordGloss text={line.t} /></span>
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
