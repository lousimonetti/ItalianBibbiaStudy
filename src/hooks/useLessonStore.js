import { useEffect, useState } from 'react';
import { loadLessons, LESSONS_EVENT } from '../utils/lessonStore';

// The finished-lessons store, re-read whenever a lesson is recorded anywhere
// on the page — so a week row's "2/3" and the Continue card stay in step with
// a lesson that was just played in the overlay.
export function useLessonStore() {
  const [store, setStore] = useState(loadLessons);
  useEffect(() => {
    const reload = () => setStore(loadLessons());
    window.addEventListener(LESSONS_EVENT, reload);
    return () => window.removeEventListener(LESSONS_EVENT, reload);
  }, []);
  return store;
}
