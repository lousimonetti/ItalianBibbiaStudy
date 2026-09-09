// Web Speech API recognition detection, shared by the components that listen
// (PronunciationPractice does its own module-load check; new components use
// this so availability logic — and the lint rule keeping non-component exports
// out of .jsx files — stays in one place).

export function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export const hasSpeechRecognition = !!getSpeechRecognition();

// Hard-release a recognition instance: detach its handlers FIRST, then
// abort(). The order matters — abort() fires onend, and a dying instance's
// onend racing in would reset the state of a turn that has already begun.
// Safe on an instance that never started (abort() is then a silent no-op).
export function releaseRecognition(rec) {
  if (!rec) return;
  rec.onresult = null;
  rec.onerror = null;
  rec.onend = null;
  try { rec.abort(); } catch { /* already dead */ }
}
