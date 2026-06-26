import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

import { TTS_LANG } from '../utils/locale';
import { getSelectedVoice } from '../utils/voicePreference';
import { tokenizeReadAlong, wordIndexAtChar } from '../utils/readAlong';
import { useAudioSpeed } from './useAudioSpeed';

const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

// Speaks `text` with the Web Speech API and tracks which word is being spoken,
// using the utterance's `boundary` events (karaoke-style read-along). Returns
// the word/whitespace `tokens` to render, the `activeIndex` to highlight (-1 =
// none), `speaking`, and a `toggle` to start/stop. Falls back gracefully: if
// boundary events don't fire (some engines), audio still plays with no
// highlight; if speech synthesis is missing, `supported` is false.
export function useReadAlong(text, { rate } = {}) {
  const { rate: globalRate } = useAudioSpeed();
  const tokens = useMemo(() => tokenizeReadAlong(text), [text]);
  const [speaking, setSpeaking] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const utterRef = useRef(null);

  const stop = useCallback(() => {
    if (hasSpeechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
    setActiveIndex(-1);
  }, []);

  // Cancel any in-flight speech if the card unmounts (e.g. tab switch).
  useEffect(() => () => { if (hasSpeechSynthesis) window.speechSynthesis.cancel(); }, []);

  const toggle = useCallback(() => {
    if (!hasSpeechSynthesis) return;
    if (speaking) { stop(); return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = TTS_LANG;
    const voice = getSelectedVoice();
    if (voice) utter.voice = voice;
    utter.rate = rate ?? globalRate;
    utter.onstart = () => setSpeaking(true);
    utter.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      setActiveIndex(wordIndexAtChar(tokens, e.charIndex));
    };
    utter.onend = () => { setSpeaking(false); setActiveIndex(-1); };
    utter.onerror = () => { setSpeaking(false); setActiveIndex(-1); };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [speaking, stop, text, rate, globalRate, tokens]);

  return { supported: hasSpeechSynthesis, tokens, activeIndex, speaking, toggle };
}
