// Derive the achievement/badge list from the existing localStorage stores —
// progress (weeks done), SRS (words learned), streak (best run), and journal
// (weeks written). No new persistence: earned state is computed, so badges stay
// correct even if a store is edited or cleared. Pure and unit-tested.

export function computeAchievements(ctx, phases) {
  const { progress = {}, learnedCount = 0, streakBest = 0, journaledWeeks = 0 } = ctx || {};
  const weeksDone = Object.values(progress).filter(Boolean).length;
  const phaseDone = (p) => p.weeks.length > 0 && p.weeks.every((w) => progress[w.n]);

  return [
    { id: 'first', icon: '🌱', it: 'Primo passo', en: 'First step', desc: 'Complete your first week', earned: weeksDone >= 1 },
    { id: 'five', icon: '🚶', it: 'In cammino', en: 'On your way', desc: 'Complete 5 weeks', earned: weeksDone >= 5 },
    ...phases.map((p) => ({
      id: `phase-${p.id}`,
      icon: '🏅',
      it: p.book,
      en: `${p.book} complete`,
      desc: `Finish every week of ${p.book}`,
      earned: phaseDone(p),
    })),
    { id: 'streak7', icon: '🔥', it: 'Una settimana', en: '7-day streak', desc: 'Study 7 days in a row', earned: streakBest >= 7 },
    { id: 'streak30', icon: '⚡', it: 'Un mese intero', en: '30-day streak', desc: 'Study 30 days in a row', earned: streakBest >= 30 },
    { id: 'learn50', icon: '📚', it: '50 parole', en: '50 words learned', desc: 'Learn 50 words in Practice', earned: learnedCount >= 50 },
    { id: 'learn150', icon: '🧠', it: '150 parole', en: '150 words learned', desc: 'Learn 150 words in Practice', earned: learnedCount >= 150 },
    { id: 'writer', icon: '✍️', it: 'Scrittore', en: 'Writer', desc: 'Journal in 10 different weeks', earned: journaledWeeks >= 10 },
    { id: 'all', icon: '🎄', it: 'Fino a Natale!', en: 'All 37 weeks', desc: 'Complete all 37 weeks', earned: weeksDone >= 37 },
  ];
}

export function earnedCount(list) {
  return list.filter((a) => a.earned).length;
}
