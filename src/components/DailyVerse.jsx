import { useMemo, useState } from 'react';
import { PHASES } from '../data/studyData';
import { verseRefs } from '../utils/keyVerses';
import { verseForDay, verseLesson, loadDailyVerse, recordDailyVerse } from '../utils/dailyVerse';
import { getTodayDayIndex } from '../utils/schedule';
import { todayStr } from '../utils/streak';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';
import { LessonPlayer } from './LessonPlayer';

const ALL_WEEKS = PHASES.flatMap((p) => p.weeks);

// "Versetto del giorno" on the Today card: one verse of the week's passage a
// day. Every word is tappable, the English and the verses around it are one
// tap away, and Impara opens a short guided lesson on it.
export function DailyVerse({ currentWeekN, onChange }) {
  const today = todayStr();
  const verse = useMemo(
    () => verseForDay({ weeks: ALL_WEEKS, currentWeekN, dayIndex: getTodayDayIndex(), dateStr: today }),
    [currentWeekN, today],
  );
  const lesson = useMemo(() => {
    if (!verse) return null;
    const week = ALL_WEEKS.find((w) => w.n === verse.weekN);
    return verseLesson(verse, week ? verseRefs(week) : []);
  }, [verse]);
  const [showEn, setShowEn] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [state, setState] = useState(loadDailyVerse);
  if (!verse) return null;
  const done = state.last === today;
  const hasContext = !!(verse.prev || verse.next);

  return (
    <div className="daily-verse">
      <div className="daily-verse-head">
        <span className="daily-verse-label">Versetto del giorno</span>
        <span className="daily-verse-ref">{verse.id}</span>
        {done && <span className="think-prompt-done" title="Learned today">✓</span>}
      </div>

      {showContext && verse.prev && (
        <p className="daily-verse-context"><WordGloss text={verse.prev.t} /></p>
      )}
      <p className="daily-verse-it">
        <WordGloss text={verse.t} />
        <SpeakerButton word={verse.t} size={16} />
      </p>
      {showEn && verse.en && <p className="daily-verse-en">{verse.en}</p>}
      {showContext && verse.next && (
        <p className="daily-verse-context"><WordGloss text={verse.next.t} /></p>
      )}

      <div className="daily-verse-actions">
        {lesson && (
          <button className="continue-secondary daily-verse-learn" onClick={() => setPlaying(true)}>
            {done ? 'Ripeti' : 'Impara'} · about {lesson.minutes} min
          </button>
        )}
        {verse.en && (
          <button className="daily-chip" onClick={() => setShowEn((v) => !v)} aria-pressed={showEn}>EN</button>
        )}
        {hasContext && (
          <button className="daily-chip" onClick={() => setShowContext((v) => !v)} aria-pressed={showContext}>
            {showContext ? 'Solo il versetto' : 'Nel contesto'}
          </button>
        )}
        {state.days > 0 && <span className="daily-verse-days">{state.days} learned</span>}
      </div>

      {playing && lesson && (
        <LessonPlayer
          lesson={lesson}
          onClose={() => { setPlaying(false); onChange?.(); }}
          onComplete={() => { setState(recordDailyVerse(today)); return false; }}
        />
      )}
    </div>
  );
}
