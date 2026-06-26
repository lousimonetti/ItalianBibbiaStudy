import { useState } from 'react';
import { SpeakerButton } from './SpeakerButton';
import { keyVerses } from '../utils/keyVerses';
import { diffReconstruction } from '../utils/dictogloss';
import { recordActivity } from '../utils/streak';

// O4 — Dictogloss. The learner hears a verse, types what they remember, then
// sees a word-level diff (recovered vs. missed) and a recall score. Reuses TTS
// (SpeakerButton) and the pure diff scorer. Activity counts toward the streak.
export function Dictogloss({ week }) {
  const verses = keyVerses(week);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState(null); // diffReconstruction output
  const [rate, setRate] = useState(0.85);
  const [scores, setScores] = useState([]);

  if (verses.length < 1) return null;

  const current = verses[idx];
  const done = idx >= verses.length;

  function check() {
    const r = diffReconstruction(current, typed);
    setResult(r);
    recordActivity('practiced');
  }

  function next() {
    const newScores = result ? [...scores, result.score] : scores;
    setScores(newScores);
    setIdx((i) => i + 1);
    setTyped('');
    setResult(null);
  }

  function restart() {
    setIdx(0);
    setTyped('');
    setResult(null);
    setScores([]);
  }

  return (
    <div className="dicto-section">
      <button className="dicto-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="dicto-toggle-title">Dictogloss — listen &amp; reconstruct</span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="dicto-body">
          {done ? (
            <div className="dicto-end">
              <div className="dicto-end-score">
                {scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0}%
              </div>
              <div className="dicto-end-label">average recall across {scores.length} verse{scores.length !== 1 ? 's' : ''}</div>
              <button className="dicto-btn dicto-btn-primary" onClick={restart}>Start over</button>
            </div>
          ) : (
            <>
              <div className="dicto-intro">
                Listen, then type as much of the verse as you remember. Spelling and
                accents are forgiven — aim to recover the words and structure.
              </div>
              <div className="dicto-counter">Verse {idx + 1} of {verses.length}</div>

              <div className="dicto-play">
                <SpeakerButton word={current} size={30} rate={rate} />
                <div className="dicto-speeds">
                  <button
                    className={`prac-speed-btn${rate === 0.6 ? ' active' : ''}`}
                    onClick={() => setRate(0.6)}
                  >Slow</button>
                  <button
                    className={`prac-speed-btn${rate === 0.85 ? ' active' : ''}`}
                    onClick={() => setRate(0.85)}
                  >Normal</button>
                </div>
              </div>

              <textarea
                className="dicto-input"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Scrivi quello che senti…"
                rows={2}
                disabled={!!result}
              />

              {!result ? (
                <button
                  className="dicto-btn dicto-btn-primary"
                  onClick={check}
                  disabled={!typed.trim()}
                >Check</button>
              ) : (
                <div className="dicto-result">
                  <div className="dicto-score">{result.score}% recovered</div>
                  <div className="dicto-original">
                    {result.original.map((m, i) => (
                      <span key={i} className={m.ok ? 'dicto-ok' : 'dicto-miss'}>{m.w} </span>
                    ))}
                  </div>
                  <button className="dicto-btn dicto-btn-primary" onClick={next}>
                    {idx + 1 < verses.length ? 'Next verse →' : 'Finish'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
