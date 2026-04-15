import { useState, useEffect } from 'react';
import { PHASES } from './data/studyData';
import { useProgress } from './hooks/useProgress';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { Phase } from './components/Phase';

const TOTAL = PHASES.reduce((sum, p) => sum + p.weeks.length, 0);

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1v9m0 0L5 7m3 3 3-3M2 12v1.5A1.5 1.5 0 003.5 15h9A1.5 1.5 0 0014 13.5V12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 5zm0 7.5a1 1 0 100-2 1 1 0 000 2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function App() {
  const { checked, toggle, doneCount, pct } = useProgress(TOTAL);
  const { canInstall, install } = useInstallPrompt();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return (
    <div className="container">
      {!online && (
        <div className="offline-banner" role="status">
          <OfflineIcon />
          You're offline. All content is available from cache.
        </div>
      )}

      <div className="app-header">
        <div className="header-text">
          <h1>Italian Bible Study</h1>
          <p className="tagline">
            37 weeks to Christmas 2026 &mdash; La Bibbia CEI 2008 + Babbel + Anki + iTalki
          </p>
        </div>
        {canInstall && (
          <button className="install-btn" onClick={install} aria-label="Install app">
            <DownloadIcon />
            Add to Home Screen
          </button>
        )}
      </div>

      <div className="progress-wrap">
        <div className="progress-top">
          <div className="progress-count">
            {doneCount} / {TOTAL} weeks
          </div>
          <div className="progress-goal">Goal: Dec 25, 2026</div>
        </div>
        <div className="bar-bg">
          <div className="bar-fill" style={{ width: `${pct}%` }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} />
        </div>
      </div>

      <div className="routine">
        <h2>Daily routine (65 min)</h2>
        {[
          ['Babbel lesson — one unit, do not skip ahead', '15 min'],
          ['Audio passage in Italian — listen without looking anything up', '10 min'],
          ['Read with parallel Italian / English text (Bible Gateway)', '20 min'],
          ['Anki — add 5-8 new words from today\'s passage, review prior cards', '10 min'],
          ['Write 3-5 Italian sentences using this week\'s writing prompt', '10 min'],
        ].map(([label, time]) => (
          <div className="rrow" key={label}>
            <span>{label}</span>
            <span className="rtime">{time}</span>
          </div>
        ))}
      </div>

      {PHASES.map((phase) => (
        <Phase
          key={phase.id}
          phase={phase}
          checked={checked}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}
