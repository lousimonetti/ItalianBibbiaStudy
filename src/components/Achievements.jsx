import { useState } from 'react';
import { useAchievements } from '../hooks/useAchievements';
import { earnedCount } from '../utils/achievements';

// "Traguardi" — a collapsible badge grid on the Tracker. Earned badges show in
// colour with their Italian + English name; locked ones are greyed with the
// unlock condition on hover (title).
export function Achievements() {
  const list = useAchievements();
  const earned = earnedCount(list);
  const [open, setOpen] = useState(false);

  return (
    <div className="ach-panel">
      <button className="ach-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="ach-title" title="Achievements">Traguardi</span>
        <span className="ach-count">{earned} / {list.length}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="ach-grid">
          {list.map((a) => (
            <div key={a.id} className={`ach-badge${a.earned ? ' earned' : ''}`} title={a.desc}>
              <span className="ach-icon">{a.earned ? a.icon : '🔒'}</span>
              <span className="ach-name">{a.it}</span>
              <span className="ach-name-en">{a.en}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
