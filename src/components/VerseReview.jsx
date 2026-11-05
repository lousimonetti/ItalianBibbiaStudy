import { useMemo, useState } from 'react';
import { SpeakerButton } from './SpeakerButton';
import { VerseBlanks } from './VersePractice';
import { buildVerseSession, gradeVerse, loadVerseSrs, reachedVerseCards, verseStats } from '../utils/verseReview';
import { gradeResult, stageCount, stageForReps } from '../utils/verseRecall';
import { recordActivity } from '../utils/streak';

// Spaced review of whole verses: due ones first, then a few new ones each day.
export function VerseReview() {
  const cards = useMemo(() => reachedVerseCards(), []);
  const [queue, setQueue] = useState(null);
  const [stages, setStages] = useState({});
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState(null);
  const [tally, setTally] = useState({ good: 0, total: 0 });
  const [stats, setStats] = useState(() => verseStats(cards));

  const start = () => {
    const session = buildVerseSession(cards);
    // Fixed when the session starts: grading a card raises its reps, and a stage
    // recomputed then would change the blanks under the answers just checked.
    const store = loadVerseSrs();
    setStages(Object.fromEntries(session.map((c) => [c.id, stageForReps(store[c.id]?.reps, stageCount(c.t))])));
    setQueue(session);
    setIndex(0);
    setChecked(null);
    setTally({ good: 0, total: 0 });
  };

  if (!queue || index >= queue.length) {
    const finished = queue && queue.length > 0;
    const left = stats.due + stats.new;
    return (
      <div className="verse-review">
        <h3 className="verse-review-title">Verse review</h3>
        <p className="drill-intro">
          Write verses from memory at spaced intervals. The better you know one, the more of it you'll be asked for.
        </p>
        {finished && (
          <p className="drill-verdict-ok" role="status">
            Session finished: {tally.good} of {tally.total} without a mistake.
          </p>
        )}
        <div className="verse-review-stats">
          <span><strong>{stats.due}</strong> due</span>
          <span><strong>{stats.new}</strong> new</span>
          <span><strong>{stats.learned}</strong> started</span>
        </div>
        {queue && queue.length === 0 && <p className="drill-intro">You're all caught up for today.</p>}
        {left > 0 && (!queue || queue.length > 0) && <button className="drill-btn" onClick={start}>Start review</button>}
      </div>
    );
  }

  const card = queue[index];
  const stage = stages[card.id];

  const onChecked = (result) => {
    const grade = gradeResult(result);
    gradeVerse(card.id, grade);
    recordActivity('practiced');
    setChecked(grade);
    setTally((t) => ({ good: t.good + (grade === 'good' ? 1 : 0), total: t.total + 1 }));
    setStats(verseStats(cards));
  };

  return (
    <div className="verse-review">
      <div className="verse-stage">Verse {index + 1} of {queue.length}</div>
      <div className="verse-ref">
        {card.ref || card.id}
        {checked && <SpeakerButton word={card.t} size={14} />}
      </div>
      {card.en && <div className="verse-en">{card.en}</div>}
      <VerseBlanks key={card.id} text={card.t} stage={stage} onChecked={onChecked} />
      {checked && (
        <div className="verse-actions">
          {checked === 'good' && <span className="drill-verdict-ok">Bene!</span>}
          <button className="drill-btn" onClick={() => { setIndex(index + 1); setChecked(null); }}>Next</button>
        </div>
      )}
    </div>
  );
}
