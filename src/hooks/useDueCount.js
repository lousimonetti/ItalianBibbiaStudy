import { useEffect, useState } from 'react';
import { stats } from '../utils/srs';
import { SRS_EVENT, loadSrsStore } from './useSrs';
import { LESSONS_EVENT } from '../utils/lessonStore';

// How many of `cards` are due right now, kept current without a reload: it
// re-counts when reviews or lessons are saved, when the tab regains focus and
// once a minute (cards fall due with the clock, not only with activity).
export function useDueCount(cards) {
  const count = () => stats(cards, loadSrsStore()).due;
  const [due, setDue] = useState(count);

  useEffect(() => {
    const update = () => setDue(stats(cards, loadSrsStore()).due);
    const onVisible = () => { if (document.visibilityState === 'visible') update(); };
    window.addEventListener(SRS_EVENT, update);
    window.addEventListener(LESSONS_EVENT, update);
    window.addEventListener('storage', update);
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(update, 60000);
    return () => {
      window.removeEventListener(SRS_EVENT, update);
      window.removeEventListener(LESSONS_EVENT, update);
      window.removeEventListener('storage', update);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [cards]);

  return due;
}
