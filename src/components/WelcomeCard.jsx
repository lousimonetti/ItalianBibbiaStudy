import { useState } from 'react';
import { config } from '../../course/config';

const STORAGE_KEY = 'italian-bible-welcome-seen';

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
            <span className="welcome-section-label">Tools, used together</span>
            <ul className="welcome-list">
              {config.resources.map((r) => (
                <li key={r.id}><strong>{r.name}</strong> — {r.desc}</li>
              ))}
            </ul>
          </div>
          <div className="welcome-section">
            <span className="welcome-section-label">Three sections in this app</span>
            <ul className="welcome-list">
              <li><strong>Tracker</strong> — the weekly plan. Each week shows what to read, key vocabulary, a grammar focus, and a writing prompt. Check a week off when done.</li>
              <li><strong>Flashcards</strong> — download pre-built Anki decks for any week or phase, then import into Anki on any device.</li>
              <li><strong>Journal</strong> — write a few sentences in Italian each week using the provided prompt. Notes save automatically in your browser.</li>
            </ul>
          </div>
        </div>
        <p className="welcome-tip">
          Start on the <strong>Tracker</strong> tab &rarr; open the current week &rarr; follow the daily routine shown above.
          Dismiss this panel when you're ready.
        </p>
      </div>
    </div>
  );
}
