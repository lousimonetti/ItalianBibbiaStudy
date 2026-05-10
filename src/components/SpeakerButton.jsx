import { useState, useRef } from 'react';

const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function SpeakerButton({ word, size = 20 }) {
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef(null);

  if (!hasSpeechSynthesis) return null;

  function handleSpeak(e) {
    e.stopPropagation();
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'it-IT';
    utter.rate = 0.85;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }

  return (
    <button
      className={`speaker-btn${speaking ? ' speaker-speaking' : ''}`}
      onClick={handleSpeak}
      aria-label={speaking ? 'Stop audio' : 'Hear pronunciation'}
      title={speaking ? 'Stop' : 'Hear pronunciation'}
    >
      {speaking ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
          <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
