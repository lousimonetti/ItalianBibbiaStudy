import { storageKey } from './storageKey';
import { setSessionStart } from './sessionStart';

// New Session executor (plan-new-session.md T2). Stamps the session-start
// override, then clears the selected stores by removing their whole key —
// the same semantics as the iOS app's startNewSession (cleared weeks/cards
// simply become "new" again; the vocab itself lives in the course, not the
// store). The caller reloads the page afterwards so every module re-reads
// localStorage from the new start date.
export function resetSession({
  startDate,
  resetProgress = false,
  resetStreak = false,
  resetSrs = false,
  resetJournal = false,
}) {
  setSessionStart(startDate);
  const drop = (name) => {
    try {
      localStorage.removeItem(storageKey(name));
    } catch {
      // storage unavailable — nothing to clear
    }
  };
  if (resetProgress) drop('progress');
  if (resetStreak) drop('streak');
  if (resetSrs) drop('srs');
  if (resetJournal) drop('journal');
}
