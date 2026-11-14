import { useEffect, useState } from 'react';
import { PHASES } from '../data/studyData';
import { buildCards } from '../../course/vocab';
import { weekLessons } from '../utils/lessonPlan';
import { loadLessons, isDone, isWeekComplete, weekProgress, nextAction } from '../utils/lessonStore';
import { useLessonStore } from '../hooks/useLessonStore';
import { markWeekDone } from '../hooks/useProgress';
import { useSrs } from '../hooks/useSrs';
import { LessonPlayer } from './LessonPlayer';
import { UiText } from '../i18n/UiText';

const ALL_WEEKS = PHASES.flatMap((p) => p.weeks);
const ALL_CARDS = buildCards(PHASES);
// Lessons are deterministic, so the whole course's plan is built once.
const PLANS = ALL_WEEKS.map((week) => ({ weekN: week.n, lessons: weekLessons(week) }));
const lessonsFor = (weekN) => PLANS.find((p) => p.weekN === weekN)?.lessons || [];

// Finishing the last unfinished lesson of a week ticks the week. Only a first
// completion can do it, so a week the learner unticked by hand stays unticked
// when they repeat a lesson.
function completeWeekIfDone(lesson, firstTime) {
  if (!firstTime || !isWeekComplete(loadLessons(), lessonsFor(lesson.weekN))) return false;
  markWeekDone(lesson.weekN);
  return true;
}

// The leading mark on a week row: an empty ring, a ring filled in proportion
// to the lessons done, or a tick once the week is complete. It reports; the
// lessons are what get done. (The manual override lives in the open week.)
export function WeekStatus({ weekN, checked }) {
  const store = useLessonStore();
  const { done, total } = weekProgress(store, lessonsFor(weekN));
  const R = 8;
  const C = 2 * Math.PI * R;
  const label = checked ? `Week ${weekN} complete` : `Week ${weekN}: ${done} of ${total} lessons done`;
  return (
    <span className={`week-status${checked ? ' complete' : ''}`} role="img" aria-label={label} title={label}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <circle className="week-status-track" cx="11" cy="11" r={R} fill="none" strokeWidth="2.5" />
        {checked ? (
          <>
            <circle className="week-status-full" cx="11" cy="11" r={R + 1.25} />
            <path d="M7 11.2l2.7 2.7 5.3-5.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : total > 0 && done > 0 && (
          <circle
            className="week-status-arc"
            cx="11" cy="11" r={R} fill="none" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={`${(done / total) * C} ${C}`}
            transform="rotate(-90 11 11)"
          />
        )}
      </svg>
    </span>
  );
}

// The week's lessons as a short path of nodes on its row: 1 — 2 — 3, each one
// a button that opens that lesson, filled in once it is finished.
export function WeekLessonPath({ weekN }) {
  const store = useLessonStore();
  const [active, setActive] = useState(null);
  const lessons = lessonsFor(weekN);
  if (!lessons.length) return null;
  return (
    // Clicks stay here: the row behind it toggles the week open.
    <span className="week-path" onClick={(e) => e.stopPropagation()}>
      {lessons.map((lesson, i) => {
        const finished = isDone(store, lesson.key);
        return (
          <span key={lesson.key} className="week-path-item">
            {/* Green only once the lessons on both sides are done. */}
            {i > 0 && (
              <span
                className={`week-path-link${finished && isDone(store, lessons[i - 1].key) ? ' done' : ''}`}
                aria-hidden="true"
              />
            )}
            <button
              className={`week-path-node${finished ? ' done' : ''}`}
              onClick={() => setActive(lesson)}
              title={`${lesson.title} — ${lesson.sub}`}
              aria-label={`Week ${weekN}, lesson ${lesson.n}: ${lesson.title}${finished ? ' (done — repeat)' : ''}`}
            >
              {finished ? '✓' : lesson.n}
            </button>
          </span>
        );
      })}
      {active && <LessonPlayer lesson={active} onClose={() => setActive(null)} onComplete={completeWeekIfDone} />}
    </span>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4 2.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}

// The due count is read when this mounts; the parent re-keys it after a lesson
// so the count reflects the words that lesson just scheduled.
function ContinueInner({ currentWeekN, store, onStart, onOpenReview }) {
  const { getStats } = useSrs();
  const due = getStats(ALL_CARDS).due;
  const action = nextAction({ plans: PLANS, store, currentWeekN, due });

  if (action.kind === 'done') {
    return (
      <div className="continue-card continue-card--done">
        <span className="continue-title">Tutto fatto — every lesson finished and nothing due.</span>
      </div>
    );
  }

  if (action.kind === 'review') {
    return (
      <div className="continue-card">
        <button className="continue-btn" onClick={onOpenReview} disabled={!onOpenReview}>
          <PlayIcon /> <UiText k="today.review" />
        </button>
        <div className="continue-text">
          <span className="continue-title">{action.due} card{action.due === 1 ? '' : 's'} due</span>
          <span className="continue-sub">This week's lessons are done — keep the words alive.</span>
        </div>
      </div>
    );
  }

  const { lesson, ahead } = action;
  const total = lessonsFor(lesson.weekN).length;
  return (
    <div className="continue-card">
      <button className="continue-btn" onClick={() => onStart(lesson)}>
        <PlayIcon /> <UiText k="today.continue" />
      </button>
      <div className="continue-text">
        <span className="continue-title">
          Week {lesson.weekN} · Lesson {lesson.n} of {total} — {lesson.title}
        </span>
        <span className="continue-sub">
          {ahead ? 'Ahead of schedule · ' : ''}{lesson.sub} · about {lesson.minutes} min
        </span>
      </div>
      {due > 0 && onOpenReview && (
        <button className="continue-secondary" onClick={onOpenReview}>
          {due} due — review
        </button>
      )}
    </div>
  );
}

// The Today card's primary action: one button that always knows what is next.
export function ContinueCard({ currentWeekN, onOpenReview, onChange }) {
  const store = useLessonStore();
  const [active, setActive] = useState(null);
  const [rev, setRev] = useState(0);

  function close() {
    setActive(null);
    setRev((r) => r + 1);
    onChange?.();
  }

  return (
    <>
      <ContinueInner
        key={rev}
        currentWeekN={currentWeekN}
        store={store}
        onStart={setActive}
        onOpenReview={onOpenReview}
      />
      {active && <LessonPlayer lesson={active} onClose={close} onComplete={completeWeekIfDone} />}
    </>
  );
}

// A week's lessons, each startable (or repeatable) on its own.
export function WeekLessons({ week, checked, onToggle }) {
  const store = useLessonStore();
  const [active, setActive] = useState(null);
  const lessons = lessonsFor(week.n);
  if (!lessons.length) return null;
  const { done, total } = weekProgress(store, lessons);

  return (
    <div className="week-lessons">
      <div className="week-lessons-head">
        <span className="detail-label">Lessons</span>
        <span className="week-lessons-count">{done} / {total} done</span>
        {/* The week ticks itself when its lessons are finished; this is the
            override for a week done some other way (or ticked by mistake). */}
        {onToggle && (
          <label className="week-lessons-override">
            <input
              type="checkbox"
              checked={!!checked}
              onChange={() => onToggle(week.n)}
              aria-label={`Mark week ${week.n} complete`}
            />
            Week complete
          </label>
        )}
      </div>
      {lessons.map((lesson) => {
        const finished = isDone(store, lesson.key);
        return (
          <div key={lesson.key} className={`week-lesson-row${finished ? ' done' : ''}`}>
            <span className="week-lesson-num" aria-hidden="true">{finished ? '✓' : lesson.n}</span>
            <span className="week-lesson-text">
              <span className="week-lesson-title">{lesson.title}</span>
              <span className="week-lesson-sub">{lesson.sub} · about {lesson.minutes} min</span>
            </span>
            <button
              className={`week-lesson-btn${finished ? ' secondary' : ''}`}
              onClick={() => setActive(lesson)}
              aria-label={`${finished ? 'Repeat' : 'Start'} lesson ${lesson.n}: ${lesson.title}`}
            >
              <UiText k={finished ? 'lesson.redo' : 'lesson.start'} />
            </button>
          </div>
        );
      })}
      {active && (
        <LessonPlayer lesson={active} onClose={() => setActive(null)} onComplete={completeWeekIfDone} />
      )}
    </div>
  );
}

// Plays whatever Continue would start, without the card around it. The welcome
// screen uses it so a newcomer's first tap lands inside a lesson. Words due for
// review are ignored here: someone pressing "start" wants the lesson.
export function NextLessonLauncher({ currentWeekN, onClose }) {
  const [lesson] = useState(() => {
    const action = nextAction({ plans: PLANS, store: loadLessons(), currentWeekN, due: 0 });
    return action.kind === 'lesson' ? action.lesson : null;
  });
  useEffect(() => {
    if (!lesson) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!lesson) return null;
  return <LessonPlayer lesson={lesson} onClose={onClose} onComplete={completeWeekIfDone} />;
}
