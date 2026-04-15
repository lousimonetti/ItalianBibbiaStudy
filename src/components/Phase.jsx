import { useState } from 'react';
import { WeekRow } from './WeekRow';

export function Phase({ phase, checked, onToggle }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="phase">
      <div className="phase-header" onClick={() => setOpen((v) => !v)}>
        <span
          className="badge"
          style={{ background: phase.badgeBg, color: phase.badgeColor }}
        >
          {phase.badgeLabel}
        </span>
        <span className="phase-title">{phase.title}</span>
        <span className="phase-book">{phase.book}</span>
        <span className={`chevron${open ? '' : ' collapsed'}`}>&#9660;</span>
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
            />
          ))}
        </>
      )}
    </div>
  );
}
