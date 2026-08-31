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
import { planForEndDate } from '../utils/targetDate';

const WEEKS = config.schedule.weeks;

const RESET_OPTIONS = [
  { id: 'progress', label: 'Weekly progress', hint: 'completion ticks on the Tracker' },
  { id: 'streak', label: 'Streak & daily goals', hint: 'day counter and Today checklist' },
  { id: 'srs', label: 'Flashcard schedule', hint: 'review history — all cards start fresh' },
  { id: 'journal', label: 'Journal entries', hint: 'everything you wrote (export first!)' },
];

// What a chosen finish date actually implies. The honest cases are the ones
// worth showing: the end date is snapped back to a week boundary (so the
// program finishes on or before the date asked for, never after), and a date
// too close to fit the whole program means starting partway in.
function TargetSummary({ target, plan }) {
  if (!target) {
    return (
      <p className="session-target-hint">
        Pick the date you want to be finished by — the {WEEKS} weeks are counted
        backwards from it.
      </p>
    );
  }
  if (!plan?.valid) {
    return (
      <p className="session-target-warn">
        {plan?.reason === 'past'
          ? 'That date has already passed — pick one at least a week ahead.'
          : "That doesn't look like a date."}
      </p>
    );
  }

  const finish = formatDateLabel(parseLocalDate(plan.end));
  const start = formatDateLabel(parseLocalDate(plan.start));

  if (plan.skippedWeeks > 0) {
    return (
      <div className="session-target-warn">
        <strong>
          Finishing by {finish} means starting at week {plan.startWeekN}.
        </strong>
        <span>
          The full program is {WEEKS} weeks and that date is {plan.weeksAvailable} away,
          so weeks 1–{plan.skippedWeeks} would be behind you already. You can start
          there, or pick a later date to do the whole thing.
        </span>
      </div>
    );
  }

  return (
    <div className="session-target-ok">
      <strong>{start} → {finish}</strong>
      <span>
        All {WEEKS} weeks.
        {plan.startsInFuture
          ? ` The program would begin in ${plan.daysUntilStart} days.`
          : ' Starting today.'}
        {plan.snapped ? ` Weeks run Monday–Sunday, so it finishes on ${finish}.` : ''}
      </span>
    </div>
  );
}

// New Session modal (plan-new-session.md T1): pick a date, choose which data to
// reset, confirm → resetSession() + reload so every module re-reads
// localStorage from the new calendar (same pattern as CoursePicker).
//
// Two ways to say the same thing. "Start on" is the original: you name day one.
// "Finish by" is the inverse — you name the finish line and the start is
// derived (src/utils/targetDate.js), because people think in deadlines rather
// than start dates. Both paths end at the same resetSession call; only the
// date input and the summary differ.
function NewSessionModal({ onClose, mode: initialMode = 'start' }) {
  const [mode, setMode] = useState(initialMode);
  const [date, setDate] = useState(todayISO());
  const [target, setTarget] = useState('');
  const [scope, setScope] = useState({ progress: true, streak: true, srs: true, journal: false });
  const override = getSessionStartOverride();

  const byEnd = mode === 'end';
  const plan = byEnd ? planForEndDate(target) : null;
  // In "finish by" mode the start is whatever the plan derives.
  const effectiveDate = byEnd ? plan?.start : date;
  const dateValid = byEnd ? !!plan?.valid : /^\d{4}-\d{2}-\d{2}$/.test(date);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const begin = () => {
    if (!dateValid || !effectiveDate) return;
    const clearing = RESET_OPTIONS.filter((o) => scope[o.id]).map((o) => o.label.toLowerCase());
    if (clearing.length) {
      const ok = window.confirm(
        `Start a new session and clear ${clearing.join(', ')} on this device? This can't be undone.`,
      );
      if (!ok) return;
    }
    resetSession({
      startDate: effectiveDate,
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

          <div className="session-mode" role="group" aria-label="How to set the calendar">
            <button
              type="button"
              className={`session-mode-btn${!byEnd ? ' active' : ''}`}
              onClick={() => setMode('start')}
              aria-pressed={!byEnd}
            >
              Start on a date
            </button>
            <button
              type="button"
              className={`session-mode-btn${byEnd ? ' active' : ''}`}
              onClick={() => setMode('end')}
              aria-pressed={byEnd}
            >
              Finish by a date
            </button>
          </div>

          <label className="session-date-row">
            {byEnd ? 'Finish by' : 'Start date'}
            <input
              type="date"
              className="session-date-input"
              value={byEnd ? target : date}
              min={byEnd ? todayISO() : undefined}
              onChange={(e) => (byEnd ? setTarget(e.target.value) : setDate(e.target.value))}
            />
          </label>

          {byEnd && <TargetSummary target={target} plan={plan} />}

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
              {byEnd && plan?.skippedWeeks
                ? `Start at week ${plan.startWeekN}`
                : `Begin ${WEEKS}-week program${dateValid && effectiveDate ? ` from ${formatDateLabel(parseLocalDate(effectiveDate))}` : ''}`}
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
  const [open, setOpen] = useState(null); // null | 'start' | 'end'
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
        onClick={() => setOpen('start')}
      >
        {prominent ? `Start the ${WEEKS}-week program today` : '⟳ New session'}
      </button>
      {prominent && (
        <button className="session-target-btn" onClick={() => setOpen('end')}>
          …or finish by a date
        </button>
      )}
      {open && <NewSessionModal mode={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

// First-open entry point (WelcomeCard). Same modal, opened straight into
// "finish by" mode — the question a new learner actually has.
export function TargetDateLink({ children = 'pick a finish date' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="welcome-target-link" onClick={() => setOpen(true)}>{children}</button>
      {open && <NewSessionModal mode="end" onClose={() => setOpen(false)} />}
    </>
  );
}
