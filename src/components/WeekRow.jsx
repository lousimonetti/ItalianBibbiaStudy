import { useState } from 'react';
import { WeekDetail } from './WeekDetail';
import { weekDateLabel } from '../utils/schedule';
import { WeekStatus, WeekLessonPath } from './LessonHub';

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

  return (
    <div id={`week-${week.n}`} className={`week-row${checked ? ' done' : ''}${isCurrent ? ' week-row--current' : ''}`}>
      <div className="week-main" onClick={() => setExpanded((v) => !v)}>
        <WeekStatus weekN={week.n} checked={!!checked} />
        <div className="week-date">{weekDateLabel(week)}</div>
        <div className="week-reading">
          {week.r}
          {isCurrent && <span className="current-week-flag">This week</span>}
          {week.review && <span className="review-flag">iTalki</span>}
        </div>
        <div className="week-babbel">{week.b}</div>
        <WeekLessonPath weekN={week.n} />
        <div className="expand-btn">
          <ChevronIcon open={expanded} />
        </div>
      </div>

      {expanded && <WeekDetail week={week} checked={checked} onToggle={onToggle} />}
    </div>
  );
}
