import { useState } from 'react';
import { WeekRow } from './WeekRow';

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
      style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
      <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Phase({ phase, checked, onToggle, currentWeekN }) {
  const hasCurrentWeek = phase.weeks.some(w => w.n === currentWeekN);
  const [open, setOpen] = useState(hasCurrentWeek);

  const doneCount = phase.weeks.filter(w => checked[w.n]).length;
  const total = phase.weeks.length;

  return (
    <div className="phase">
      <div className="phase-header" onClick={() => setOpen((v) => !v)}>
        <span className="badge" style={{ background: phase.badgeBg, color: phase.badgeColor }}>
          {phase.badgeLabel}
        </span>
        <span className="phase-title">{phase.title}</span>
        <span className="phase-book">{phase.book}</span>
        <span className="phase-progress">{doneCount}/{total}</span>
        <ChevronIcon open={open} />
      </div>

      {open && (
        <>
          <div className="col-header">
            <span />
            <span>Dates</span>
            <span>Reading</span>
            <span>Babbel focus</span>
            <span />
          </div>
          {phase.weeks.map((week) => (
            <WeekRow
              key={week.n}
              week={week}
              checked={checked[week.n]}
              onToggle={onToggle}
              isCurrent={week.n === currentWeekN}
            />
          ))}
        </>
      )}
    </div>
  );
}
