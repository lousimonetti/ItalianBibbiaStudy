// Derive the achievement/badge list from the existing localStorage stores —
// progress (weeks done), SRS (words learned), streak (best run), and journal
// (weeks written). No new persistence: earned state is computed, so badges stay
// correct even if a store is edited or cleared. Pure and unit-tested.

export function computeAchievements(ctx, phases) {
  const { progress = {}, learnedCount = 0, streakBest = 0, journaledWeeks = 0, game = {} } = ctx || {};
  const { wordWon = 0, wordBest = 0, wordFast = 0, quizPerfect = 0, quizBest = 0 } = game;
  const weeksDone = Object.values(progress).filter(Boolean).length;
  const phaseDone = (p) => p.weeks.length > 0 && p.weeks.every((w) => progress[w.n]);
  // Derived, not hardcoded — the completion badge was pinned at 37 and so was
  // silently unearnable in any course of a different length.
  const totalWeeks = phases.reduce((n, p) => n + p.weeks.length, 0);

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
    { id: 'wordWin', icon: '🔤', it: 'Prima parola', en: 'First Parola win', desc: 'Solve a Parola del giorno', earned: wordWon >= 1 },
    { id: 'wordFast', icon: '🎯', it: 'Al volo', en: 'Quick solve', desc: 'Solve the Parola in 2 tries or fewer', earned: wordFast >= 1 },
    { id: 'gameStreak7', icon: '🎮', it: 'Giocatore fedele', en: 'Game streak', desc: 'Play a daily game 7 days in a row', earned: Math.max(wordBest, quizBest) >= 7 },
    { id: 'quizPerfect', icon: '💯', it: 'Sfida perfetta', en: 'Perfect Sfida', desc: 'Answer all ten Sfida questions correctly', earned: quizPerfect >= 1 },
    { id: 'all', icon: '🎄', it: 'Fino alla fine!', en: `All ${totalWeeks} weeks`, desc: `Complete all ${totalWeeks} weeks`, earned: totalWeeks > 0 && weeksDone >= totalWeeks },
  ];
}

export function earnedCount(list) {
  return list.filter((a) => a.earned).length;
}
