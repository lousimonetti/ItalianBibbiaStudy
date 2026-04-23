import { useState } from 'react';
import { WeekDetail } from './WeekDetail';

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
      style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
      <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function WeekRow({ week, checked, onToggle, isCurrent }) {
  const [expanded, setExpanded] = useState(isCurrent);

  const handleCheckbox = (e) => {
    e.stopPropagation();
    onToggle(week.n);
  };

  return (
    <div id={`week-${week.n}`} className={`week-row${checked ? ' done' : ''}${isCurrent ? ' week-row--current' : ''}`}>
      <div className="week-main" onClick={() => setExpanded((v) => !v)}>
        <label className="week-check-wrap" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={!!checked}
            onChange={handleCheckbox}
            aria-label={`Mark week ${week.n} complete`}
          />
        </label>
        <div className="week-date">{week.d}</div>
        <div className="week-reading">
          {week.r}
          {isCurrent && <span className="current-week-flag">This week</span>}
          {week.review && <span className="review-flag">iTalki</span>}
        </div>
        <div className="week-babbel">{week.b}</div>
        <div className="expand-btn">
          <ChevronIcon open={expanded} />
        </div>
      </div>

      {expanded && <WeekDetail week={week} />}
    </div>
  );
}
