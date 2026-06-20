import { useMemo } from 'react';
import { PHASES } from '../data/studyData';
import { computeAchievements } from '../utils/achievements';
import { loadStreak } from '../utils/streak';

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

// Gathers the existing stores once on mount and derives the badge list. The
// Tracker remounts on tab switch, so newly earned badges appear on return.
export function useAchievements() {
  return useMemo(() => {
    const progress = readJSON('italian-bible-progress');
    const srs = readJSON('italian-bible-srs');
    const journal = readJSON('italian-bible-journal');
    const streak = loadStreak();
    const journaledWeeks = Object.values(journal).filter((e) => e?.text?.trim()).length;
    return computeAchievements(
      {
        progress,
        learnedCount: Object.keys(srs).length,
        streakBest: streak.best || 0,
        journaledWeeks,
      },
      PHASES
    );
  }, []);
}
