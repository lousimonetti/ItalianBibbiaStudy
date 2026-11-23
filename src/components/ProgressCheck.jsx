import { useMemo, useState } from 'react';
import { PHASES } from '../data/studyData';
import { canDo } from '../../course/canDo';
import { loadSrsStore } from '../hooks/useSrs';
import { loadMined } from '../utils/mined';
import { loadSprints, sprintTrend } from '../utils/sprintStore';
import {
  ANSWERS, passageCoverage, nextWeekN, loadChecks, recordCheck, checkSummary,
} from '../utils/progressCheck';
import { WordGloss } from './WordGloss';

const fmtDate = (ms) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function Bar({ pct }) {
  return (
    <div className="pc-bar" role="img" aria-label={`${pct ?? 0}%`}>
      <div className="pc-bar-fill" style={{ width: `${pct ?? 0}%` }} />
    </div>
  );
}

function Coverage({ cov, label }) {
  if (!cov.carded) return null;
  return (
    <div className="pc-cov">
      <div className="pc-cov-head">
        <span>{label}</span>
        <strong>{cov.pct}%</strong>
      </div>
      <Bar pct={cov.pct} />
      <div className="pc-small">
        {cov.known} of the {cov.carded} words your decks teach are well known
        (reviewed at least 3 times, two weeks apart).
      </div>
    </div>
  );
}

function SelfCheck({ phaseId, set }) {
  const [entries, setEntries] = useState(() => loadChecks()[phaseId] || []);
  const [answers, setAnswers] = useState(null); // null = not taking the check
  const { latest, previous } = checkSummary(entries, set.items);
  const complete = answers && set.items.every((it) => answers[it.id] != null);

  function save() {
    const store = recordCheck(phaseId, answers);
    setEntries(store[phaseId] || []);
    setAnswers(null);
  }

  return (
    <div className="pc-section">
      <div className="pc-section-title">Can you do this yet? <span className="pc-level">({set.level})</span></div>
      {latest && !answers && (
        <div className="pc-small">
          Last check, {fmtDate(latest.at)}: <strong>{latest.yes}</strong> yes, {latest.help} with help,
          {' '}{latest.notYet} not yet.
          {previous && <> Before that: {previous.yes} yes, {previous.help} with help, {previous.notYet} not yet.</>}
        </div>
      )}
      {!answers && (
        <button className="pc-btn" onClick={() => setAnswers({})}>
          {latest ? 'Check again' : 'Take the check'}
        </button>
      )}
      {answers && (
        <>
          <ul className="pc-items">
            {set.items.map((item) => (
              <li key={item.id} className="pc-item">
                <span className="pc-item-text" id={`pc-${item.id}`}>{item.en}</span>
                <span className="pc-choices" role="radiogroup" aria-labelledby={`pc-${item.id}`}>
                  {ANSWERS.map((a) => (
                    <button
                      key={a.value}
                      role="radio"
                      aria-checked={answers[item.id] === a.value}
                      className={`pc-choice${answers[item.id] === a.value ? ' on' : ''}`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: a.value }))}
                    >
                      {a.label}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <div className="pc-actions">
            <button className="pc-btn pc-btn-primary" disabled={!complete} onClick={save}>Save</button>
            <button className="pc-btn" onClick={() => setAnswers(null)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

// "Verifica dei progressi": inside each open phase on the Tracker. Read once on
// mount, like the achievements; it grades nothing and ticks nothing.
export function ProgressCheck({ phase, currentWeekN }) {
  const [open, setOpen] = useState(false);
  const totalWeeks = useMemo(() => PHASES.reduce((n, p) => n + p.weeks.length, 0), []);
  const nextN = nextWeekN(currentWeekN, totalWeeks);
  const nextWeek = phase.weeks.find((w) => w.n === nextN) || null;
  const set = canDo?.[phase.id] || null;

  const data = useMemo(() => {
    if (!open) return null;
    const srs = loadSrsStore();
    const mined = loadMined();
    return {
      phaseCov: passageCoverage(phase.weeks, srs, { mined }),
      nextCov: nextWeek ? passageCoverage(nextWeek, srs, { mined }) : null,
      sprint: sprintTrend(loadSprints(), PHASES).find((t) => t.phaseId === phase.id),
    };
  }, [open, phase, nextWeek]);

  return (
    <div className="pc-panel">
      <button className="pc-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="pc-title" title="Progress check">Verifica dei progressi</span>
        <span className="pc-sub">Is the course working?</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && data && (
        <div className="pc-body">
          <div className="pc-section">
            <div className="pc-section-title">Reading</div>
            {data.nextCov && (
              <>
                <Coverage cov={data.nextCov} label={`Next passage (week ${nextN})`} />
                {data.nextCov.toLearn.length > 0 && (
                  <div className="pc-learn">
                    <span className="pc-small">Learn these first:</span>
                    {data.nextCov.toLearn.map((t) => (
                      <span key={t} className="pc-chip"><WordGloss text={t} source="Progress check" /></span>
                    ))}
                  </div>
                )}
              </>
            )}
            <Coverage cov={data.phaseCov} label="All of this phase's passages" />
            <div className="pc-note">
              Reading without a dictionary gets comfortable at about 95% known words. These
              figures count the words your decks teach; the other {data.phaseCov.noCard} words
              in this phase (articles, names, and verb forms no card covers) are left out.
            </div>
          </div>

          <div className="pc-section">
            <div className="pc-section-title">Speaking</div>
            {data.sprint?.runs ? (
              <div className="pc-small">
                In your fluency sprints on these weeks, your first round ran at a median
                of <strong>{data.sprint.wpm} words a minute</strong> ({data.sprint.runs} run{data.sprint.runs === 1 ? '' : 's'}).
                {data.sprint.change != null && (
                  <> That is {Math.abs(data.sprint.change)} {data.sprint.change >= 0 ? 'more' : 'fewer'} than in the phase before.</>
                )}
              </div>
            ) : (
              <div className="pc-small">
                No fluency sprints on these weeks yet. Try one in the Journal, under a week’s prompt:
                your speaking rate will show here.
              </div>
            )}
          </div>

          {set && <SelfCheck phaseId={phase.id} set={set} />}
        </div>
      )}
    </div>
  );
}
