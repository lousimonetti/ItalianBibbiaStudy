import { useEffect, useState } from 'react';
import { stats } from '../utils/srs';
import { SRS_EVENT, loadSrsStore } from './useSrs';
import { LESSONS_EVENT } from '../utils/lessonStore';
import { MINED_EVENT } from '../utils/mined';

// How many of `cards` are due right now, kept current without a reload: it
// re-counts when reviews or lessons are saved, when the tab regains focus and
// once a minute (cards fall due with the clock, not only with activity).
// `cards` may be a function, for a list that changes while the app is open
// (saved words, "Mie parole"); it is called on every re-count.
export function useDueCount(cards) {
  const list = () => (typeof cards === 'function' ? cards() : cards);
  const count = () => stats(list(), loadSrsStore()).due;
  const [due, setDue] = useState(count);

  useEffect(() => {
    const update = () => setDue(stats(typeof cards === 'function' ? cards() : cards, loadSrsStore()).due);
    const onVisible = () => { if (document.visibilityState === 'visible') update(); };
    window.addEventListener(SRS_EVENT, update);
    window.addEventListener(LESSONS_EVENT, update);
    window.addEventListener(MINED_EVENT, update);
    window.addEventListener('storage', update);
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(update, 60000);
    return () => {
      window.removeEventListener(SRS_EVENT, update);
      window.removeEventListener(LESSONS_EVENT, update);
      window.removeEventListener(MINED_EVENT, update);
      window.removeEventListener('storage', update);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [cards]);

  return due;
}
