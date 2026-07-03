// Web Speech API recognition detection, shared by the components that listen
// (PronunciationPractice does its own module-load check; new components use
// this so availability logic — and the lint rule keeping non-component exports
// out of .jsx files — stays in one place).

export function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export const hasSpeechRecognition = !!getSpeechRecognition();
