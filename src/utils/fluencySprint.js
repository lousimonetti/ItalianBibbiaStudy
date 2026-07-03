// Nation's 4/3/2 fluency development, scaled to app-sized rounds: speak on the
// same prompt three times with a shrinking time limit. Because the message
// stays the same, the what-to-say load disappears after round one and the
// remaining effort goes into *retrieving Italian faster* — which is the
// definition of fluency. Pure logic here; the mic/timer UI lives in
// FluencySprint.jsx.

export const ROUNDS = [60, 45, 30]; // seconds per round

export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Words-per-minute for one round's transcript.
export function wpm(text, seconds) {
  const words = countWords(text);
  if (!words || !seconds) return 0;
  return Math.round((words / seconds) * 60);
}

// Per-round summary for the transcripts spoken so far (parallel to ROUNDS).
export function summarizeRounds(transcripts, rounds = ROUNDS) {
  return transcripts.slice(0, rounds.length).map((text, i) => ({
    round: i + 1,
    seconds: rounds[i],
    words: countWords(text),
    wpm: wpm(text, rounds[i]),
  }));
}

// Percent change in speaking rate from the first round to the last completed
// one — the number that shows the technique working. Null until two rounds
// with actual speech exist.
export function sprintDelta(summary) {
  const spoken = summary.filter(r => r.words > 0);
  if (spoken.length < 2) return null;
  const first = spoken[0].wpm;
  const last = spoken[spoken.length - 1].wpm;
  if (!first) return null;
  return Math.round(((last - first) / first) * 100);
}
