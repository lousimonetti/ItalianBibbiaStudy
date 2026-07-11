import { useEffect, useState } from 'react';
import { config } from '../../course/config';
import {
  getSessionStartOverride,
  getSessionStartLabel,
  getEndDateLabel,
  clearSessionStart,
  formatDateLabel,
  parseLocalDate,
  todayISO,
} from '../utils/sessionStart';
import { resetSession } from '../utils/resetSession';

const WEEKS = config.schedule.weeks;

const RESET_OPTIONS = [
  { id: 'progress', label: 'Weekly progress', hint: 'completion ticks on the Tracker' },
  { id: 'streak', label: 'Streak & daily goals', hint: 'day counter and Today checklist' },
  { id: 'srs', label: 'Flashcard schedule', hint: 'review history — all cards start fresh' },
  { id: 'journal', label: 'Journal entries', hint: 'everything you wrote (export first!)' },
];

// New Session modal (plan-new-session.md T1): pick a start date, choose which
// data to reset, confirm → resetSession() + reload so every module re-reads
// localStorage from the new calendar (same pattern as CoursePicker).
function NewSessionModal({ onClose }) {
  const [date, setDate] = useState(todayISO());
  const [scope, setScope] = useState({ progress: true, streak: true, srs: true, journal: false });
  const override = getSessionStartOverride();
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const begin = () => {
    if (!dateValid) return;
    const clearing = RESET_OPTIONS.filter((o) => scope[o.id]).map((o) => o.label.toLowerCase());
    if (clearing.length) {
      const ok = window.confirm(
        `Start a new session and clear ${clearing.join(', ')} on this device? This can't be undone.`,
      );
      if (!ok) return;
    }
    resetSession({
      startDate: date,
      resetProgress: scope.progress,
      resetStreak: scope.streak,
      resetSrs: scope.srs,
      resetJournal: scope.journal,
    });
    window.location.reload();
  };

  const revert = () => {
    const ok = window.confirm(
      `Go back to the course's default calendar (starting ${formatDateLabel(parseLocalDate(config.schedule.startDate))})? Your data is kept.`,
    );
    if (!ok) return;
    clearSessionStart();
    window.location.reload();
  };

  return (
    <div className="sync-overlay" onClick={onClose} role="presentation">
      <div className="sync-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="New session">
        <div className="sync-modal-head">
          <h2>New session</h2>
          <button className="sync-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="sync-view">
          <p className="sync-hint">
            Start (or restart) the {WEEKS}-week program from any date.
            Current session: {getSessionStartLabel()} → {getEndDateLabel()}.
          </p>

          <label className="session-date-row">
            Start date
            <input
              type="date"
              className="session-date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <fieldset className="session-scope">
            <legend>Also reset on this device</legend>
            {RESET_OPTIONS.map(({ id, label, hint }) => (
              <label key={id} className="session-scope-row">
                <input
                  type="checkbox"
                  checked={scope[id]}
                  onChange={(e) => setScope((s) => ({ ...s, [id]: e.target.checked }))}
                />
                <span><strong>{label}</strong> — {hint}</span>
              </label>
            ))}
          </fieldset>

          <div className="sync-actions">
            <button className="sync-btn sync-btn-primary" onClick={begin} disabled={!dateValid}>
              Begin {WEEKS}-week program{dateValid ? ` from ${formatDateLabel(parseLocalDate(date))}` : ''}
            </button>
            {override && (
              <button className="sync-btn" onClick={revert}>Reset to course default calendar</button>
            )}
          </div>

          <p className="sync-foot">
            Unchecked data is kept and simply re-maps onto the new calendar.
            The start date syncs to your other devices with the usual backup.
          </p>
        </div>
      </div>
    </div>
  );
}

// Session footer for the TodayCard: shows the custom timeline when one is
// active and opens the New Session modal. `prominent` renders a full-width
// start button (used when the program hasn't started / has ended).
export function SessionRow({ prominent = false }) {
  const [open, setOpen] = useState(false);
  const override = getSessionStartOverride();

  return (
    <div className={`session-row${prominent ? ' session-row--prominent' : ''}`}>
      {override && !prominent && (
        <span className="session-chip" title="You're on a custom timeline">
          Session started {getSessionStartLabel()} · ends {getEndDateLabel()}
        </span>
      )}
      <button
        className={prominent ? 'session-start-btn' : 'session-restart-btn'}
        onClick={() => setOpen(true)}
      >
        {prominent ? `Start the ${WEEKS}-week program today` : '⟳ New session'}
      </button>
      {open && <NewSessionModal onClose={() => setOpen(false)} />}
    </div>
  );
}
