import { useState } from 'react';
import { WeekDetail } from './WeekDetail';

export function WeekRow({ week, checked, onToggle }) {
  const [expanded, setExpanded] = useState(false);

  const handleCheckbox = (e) => {
    e.stopPropagation();
    onToggle(week.n);
  };

  return (
    <div className={`week-row${checked ? ' done' : ''}`}>
      <div className="week-main" onClick={() => setExpanded((v) => !v)}>
        <input
          type="checkbox"
          checked={!!checked}
          onChange={handleCheckbox}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Mark week ${week.n} complete`}
        />
        <div className="week-date">{week.d}</div>
        <div className="week-reading">
          {week.r}
          {week.review && <span className="review-flag">iTalki week</span>}
        </div>
        <div className="week-babbel">{week.b}</div>
        <div className="expand-btn" aria-hidden="true">
          {expanded ? '\u2014' : '+'}
        </div>
      </div>

      {expanded && <WeekDetail week={week} />}
    </div>
  );
}
