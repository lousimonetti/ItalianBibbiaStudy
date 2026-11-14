import { useState } from 'react';
import { config } from '../../course/config';
import { storageKey } from '../utils/storageKey';
import { getSessionStartOverride, setSessionStart, todayISO } from '../utils/sessionStart';
import { loadLessons } from '../utils/lessonStore';
import { TargetDateLink } from './NewSession';

const STORAGE_KEY = storageKey('welcome-seen');

// Someone who has neither chosen a calendar nor finished a lesson. Only they
// are started at week 1 today; anyone else keeps the dates they already have.
function isNewLearner() {
  if (getSessionStartOverride()) return false;
  return Object.keys(loadLessons().done || {}).length === 0;
}

const STEPS = [
  ['Learn', 'A five-minute lesson teaches a few words from the week’s passage. You hear each one first.'],
  ['Read', 'Then read the passage itself. Tap any word for its meaning and its sound.'],
  ['Remember', 'Words come back for review just before you would forget them.'],
];

// The first thing a newcomer sees: what this is in three lines and one button
// that starts the course today and opens the first lesson. `onBegin` is called
// after the calendar is set, so the caller can open that lesson.
export function WelcomeCard({ currentWeekN, onBegin }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });
  const [fresh] = useState(isNewLearner);

  if (dismissed) return null;

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* storage unavailable — degrade silently */ }
    setDismissed(true);
  }

  function begin() {
    if (fresh) setSessionStart(todayISO());
    dismiss();
    onBegin?.();
  }

  return (
    <div className="welcome-card">
      <div className="welcome-hero">
        <span className="welcome-title">Benvenuto!</span>
        <h2 className="welcome-headline">Read the Bible in Italian, one short lesson at a time.</h2>
        <ol className="welcome-steps">
          {STEPS.map(([name, text], i) => (
            <li key={name} className="welcome-step">
              <span className="welcome-step-num" aria-hidden="true">{i + 1}</span>
              <span><strong>{name}.</strong> {text}</span>
            </li>
          ))}
        </ol>
        <button className="welcome-start" onClick={begin}>
          {fresh ? 'Start lesson 1' : 'Continue my lessons'}
        </button>
        <p className="welcome-start-sub">
          {fresh
            ? `Starts your ${config.schedule.weeks} weeks today. No account: your progress stays on this device.`
            : 'Picks up at your next lesson.'}
        </p>
        <div className="welcome-alt">
          <TargetDateLink>Finish by a date instead</TargetDateLink>
          <button className="welcome-target-link" onClick={dismiss}>
            {fresh && currentWeekN
              ? `Join the shared calendar (now in week ${currentWeekN})`
              : 'Just look around'}
          </button>
        </div>
      </div>
      <details className="welcome-more">
        <summary>How the course works</summary>
        <div className="welcome-body">
          <p className="welcome-intro">{config.brand.about}</p>
          <div className="welcome-sections">
            <div className="welcome-section">
              <span className="welcome-section-label">What you use</span>
              <ul className="welcome-list">
                {config.resources.map((r) => (
                  <li key={r.id}><strong>{r.name}</strong> — {r.desc}</li>
                ))}
              </ul>
            </div>
            <div className="welcome-section">
              <span className="welcome-section-label">Where things are</span>
              <ul className="welcome-list">
                <li><strong>Today</strong> — the Continue button, today&apos;s goals and the weekly plan. Each week has three lessons and ticks itself when they are done.</li>
                <li><strong>Study</strong> — review the words you are due, plus pronunciation, verse review and two daily games.</li>
                <li><strong>Write</strong> — a few sentences in Italian each week from a prompt. Saved in your browser.</li>
                <li><strong>Pray</strong> — prayers, the Rosary and the saint of the day, in Italian.</li>
              </ul>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
