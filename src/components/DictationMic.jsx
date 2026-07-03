import { useState, useRef, useEffect } from 'react';
import { TTS_LANG } from '../utils/locale';
import { getSpeechRecognition } from '../utils/speech';

// Continuous Italian dictation over the Web Speech API: tap to start, speak,
// tap to stop. Final transcript chunks are delivered to `onText` as they
// arrive, so the parent can append them into a draft. Renders nothing when
// SpeechRecognition is unavailable (same guard as PronunciationPractice).
function MicIcon({ off }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {off && <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
  );
}

export function DictationMic({ onText, label = 'Detta', stopLabel = 'Ferma', title }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const activeRef = useRef(false);

  useEffect(() => () => {
    activeRef.current = false;
    recRef.current?.stop();
  }, []);

  const SR = getSpeechRecognition();
  if (!SR) return null;

  function toggle() {
    if (listening) {
      activeRef.current = false;
      recRef.current?.stop();
      return; // onend flips the state
    }
    const rec = new SR();
    rec.lang = TTS_LANG;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const text = e.results[i][0].transcript.trim();
          if (text) onText(text);
        }
      }
    };
    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') activeRef.current = false;
    };
    rec.onend = () => {
      // Chrome ends recognition after a silence timeout; keep listening until
      // the user actually taps stop.
      if (activeRef.current) {
        try { rec.start(); } catch { setListening(false); }
      } else {
        setListening(false);
      }
    };
    recRef.current = rec;
    activeRef.current = true;
    setListening(true);
    rec.start();
  }

  return (
    <button
      className={`dictation-btn${listening ? ' dictation-live' : ''}`}
      onClick={toggle}
      title={title}
      aria-pressed={listening}
    >
      <MicIcon />
      {listening ? stopLabel : label}
    </button>
  );
}
