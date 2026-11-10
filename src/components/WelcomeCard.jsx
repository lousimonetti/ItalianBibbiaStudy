import { useState } from 'react';
import { config } from '../../course/config';
import { storageKey } from '../utils/storageKey';
import { TargetDateLink } from './NewSession';

const STORAGE_KEY = storageKey('welcome-seen');

export function WelcomeCard() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* storage unavailable — degrade silently */ }
    setDismissed(true);
  }

  return (
    <div className="welcome-card">
      <div className="welcome-header">
        <span className="welcome-title">What is this?</span>
        <button className="welcome-dismiss" onClick={dismiss} aria-label="Dismiss introduction">
          Got it &times;
        </button>
      </div>
      <div className="welcome-body">
        <p className="welcome-intro">{config.brand.about}</p>
        <div className="welcome-sections">
          <div className="welcome-section">
            <span className="welcome-section-label">How the course works</span>
            <ul className="welcome-list">
              {config.resources.map((r) => (
                <li key={r.id}><strong>{r.name}</strong> — {r.desc}</li>
              ))}
            </ul>
          </div>
          <div className="welcome-section">
            <span className="welcome-section-label">Where things are</span>
            <ul className="welcome-list">
              <li><strong>Today</strong> — the Continue button and the weekly plan. Each week has three lessons, the passage to read, its vocabulary, a grammar focus and a writing prompt, and ticks itself when its lessons are done.</li>
              <li><strong>Study</strong> — review the words you are due, plus pronunciation, verse review and two daily games.</li>
              <li><strong>Write</strong> — a few sentences in Italian each week using the provided prompt. Notes save automatically in your browser.</li>
            </ul>
          </div>
        </div>
        <p className="welcome-tip">
          Press <strong>Continue</strong> on the Today card: it starts the next short lesson, or your review when words are due.
          Dismiss this panel when you're ready.
        </p>
        <p className="welcome-tip">
          Working towards something — a trip, a Christmas, an exam? You can{' '}
          <TargetDateLink /> instead, and the {config.schedule.weeks} weeks are
          counted backwards from it.
        </p>
      </div>
    </div>
  );
}
