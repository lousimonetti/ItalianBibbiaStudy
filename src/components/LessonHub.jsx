import { useState } from 'react';
import { PHASES } from '../data/studyData';
import { buildCards } from '../../course/vocab';
import { weekLessons } from '../utils/lessonPlan';
import { loadLessons, isDone, weekProgress, nextAction } from '../utils/lessonStore';
import { useSrs } from '../hooks/useSrs';
import { LessonPlayer } from './LessonPlayer';
import { UiText } from '../i18n/UiText';

const ALL_WEEKS = PHASES.flatMap((p) => p.weeks);
const ALL_CARDS = buildCards(PHASES);
// Lessons are deterministic, so the whole course's plan is built once.
const PLANS = ALL_WEEKS.map((week) => ({ weekN: week.n, lessons: weekLessons(week) }));
const lessonsFor = (weekN) => PLANS.find((p) => p.weekN === weekN)?.lessons || [];

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
  const [store, setStore] = useState(loadLessons);
  const [active, setActive] = useState(null);
  const [rev, setRev] = useState(0);

  function close() {
    setActive(null);
    setStore(loadLessons());
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
      {active && <LessonPlayer lesson={active} onClose={close} />}
    </>
  );
}

// A week's lessons, each startable (or repeatable) on its own.
export function WeekLessons({ week }) {
  const [store, setStore] = useState(loadLessons);
  const [active, setActive] = useState(null);
  const lessons = lessonsFor(week.n);
  if (!lessons.length) return null;
  const { done, total } = weekProgress(store, lessons);

  return (
    <div className="week-lessons">
      <div className="week-lessons-head">
        <span className="detail-label">Lessons</span>
        <span className="week-lessons-count">{done} / {total} done</span>
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
        <LessonPlayer
          lesson={active}
          onClose={() => { setActive(null); setStore(loadLessons()); }}
        />
      )}
    </div>
  );
}
