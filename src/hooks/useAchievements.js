import { useMemo } from 'react';
import { PHASES } from '../data/studyData';
import { computeAchievements } from '../utils/achievements';
import { loadStreak } from '../utils/streak';
import { loadGame } from '../utils/gameStore';
import { storageKey } from '../utils/storageKey';

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
    const progress = readJSON(storageKey('progress'));
    const srs = readJSON(storageKey('srs'));
    const journal = readJSON(storageKey('journal'));
    const streak = loadStreak();
    const { word, quiz } = loadGame();
    const game = {
      wordWon: word.stats.won || 0,
      wordBest: word.stats.best || 0,
      wordFast: (word.stats.dist?.[1] || 0) + (word.stats.dist?.[2] || 0),
      quizPerfect: quiz.stats.won || 0,
      quizBest: quiz.stats.best || 0,
    };
    const journaledWeeks = Object.values(journal).filter((e) => e?.text?.trim()).length;
    return computeAchievements(
      {
        progress,
        learnedCount: Object.keys(srs).length,
        streakBest: streak.best || 0,
        journaledWeeks,
        game,
      },
      PHASES
    );
  }, []);
}
