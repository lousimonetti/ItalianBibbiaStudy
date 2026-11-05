import { useCallback, useEffect, useRef } from 'react';
import { getSpeechRecognition, releaseRecognition } from '../utils/speech';
import { getSelectedVoice } from '../utils/voicePreference';
import { TTS_LANG } from '../utils/locale';

const LISTEN_LIMIT_MS = 20000;
const STOP_GRACE_MS = 1500;
const MIC_RETRY_MS = 300;
// Errors that retrying will not fix, so the lesson should switch to typing.
const MIC_FATAL = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'network']);

// Chrome allows one recognition per page, and two lessons talking over each other
// would be useless, so starting one instance of the tutor stops any other.
let activeOwner = null;

// Speech I/O for the voice tutor as promises. Promises always settle, including on
// cancel, because a hung one would freeze the lesson; the caller discards results
// from turns it has already left. Follows the rules in CLAUDE.md's SpeechRecognition
// section: start() is guarded, the previous instance is released first, and nothing
// relies on onend alone.
export function useTutorVoice({ onPreempted } = {}) {
  const recRef = useRef(null);
  const settleRef = useRef(null);
  const timersRef = useRef([]);
  const utterRef = useRef(null); // Chrome can GC a live utterance and lose its onend
  const ownerRef = useRef({ onPreempted });
  ownerRef.current.onPreempted = onPreempted;

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const settle = useCallback((value) => {
    const fn = settleRef.current;
    settleRef.current = null;
    clearTimers();
    fn?.(value);
  }, []);

  const cancel = useCallback(() => {
    releaseRecognition(recRef.current);
    recRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    settle(null);
  }, [settle]);

  const claim = useCallback(() => {
    if (activeOwner && activeOwner !== ownerRef.current) activeOwner.onPreempted?.();
    activeOwner = ownerRef.current;
  }, []);

  const speak = useCallback((text, rate = 0.85) => new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve('spoken');
      return;
    }
    settle(null);
    settleRef.current = resolve;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = TTS_LANG;
    const voice = getSelectedVoice();
    if (voice) utter.voice = voice;
    utter.rate = rate;
    const done = () => { if (utterRef.current === utter) settle('spoken'); };
    utter.onend = done;
    utter.onerror = done;
    utterRef.current = utter;
    // onend can fail to fire, on long utterances especially. Never let that strand
    // the lesson: an estimate of the speaking time plus margin ends the turn anyway.
    timersRef.current.push(setTimeout(done, (text.length * 110) / Math.max(rate, 0.1) + 4000));
    window.speechSynthesis.speak(utter);
  }), [settle]);

  const listen = useCallback(() => new Promise((resolve) => {
    const SR = getSpeechRecognition();
    if (!SR) {
      resolve({ type: 'micUnavailable' });
      return;
    }
    settle(null);
    releaseRecognition(recRef.current);
    recRef.current = null;
    settleRef.current = resolve;

    const rec = new SR();
    rec.lang = TTS_LANG;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    const current = () => recRef.current === rec;
    const finish = (value) => {
      if (!current()) return;
      releaseRecognition(rec);
      recRef.current = null;
      settle(value);
    };
    rec.onresult = (e) => {
      const first = e.results[0];
      const alternatives = [];
      for (let i = 0; i < first.length; i++) alternatives.push(first[i].transcript);
      finish({ type: 'heard', alternatives });
    };
    rec.onerror = (e) => finish(MIC_FATAL.has(e?.error) ? { type: 'micUnavailable' } : { type: 'noSpeech' });
    rec.onend = () => finish({ type: 'noSpeech' });
    recRef.current = rec;

    const begin = (retry) => {
      if (!current()) return;
      try {
        rec.start();
      } catch {
        // Usually a previous recognition still winding down, so try once more.
        if (retry) timersRef.current.push(setTimeout(() => begin(false), MIC_RETRY_MS));
        else finish({ type: 'micUnavailable' });
        return;
      }
      timersRef.current.push(setTimeout(() => {
        if (!current()) return;
        // stop() rather than abort(), so a pending transcript is still delivered.
        try { rec.stop(); } catch { /* already dead */ }
        timersRef.current.push(setTimeout(() => finish({ type: 'noSpeech' }), STOP_GRACE_MS));
      }, LISTEN_LIMIT_MS));
    };
    begin(true);
  }), [settle]);

  useEffect(() => {
    const owner = ownerRef.current;
    return () => {
      cancel();
      if (activeOwner === owner) activeOwner = null;
    };
  }, [cancel]);

  return { speak, listen, cancel, claim };
}
