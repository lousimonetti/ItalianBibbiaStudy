import { useState, useMemo, useEffect } from 'react';
import { tokenize, lookupWord } from '../utils/vocabIndex';
import { TTS_LANG } from '../utils/locale';
import { getRate } from '../utils/audioSpeed';
import { GlossPopover } from './GlossPopover';

const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function speakWord(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = TTS_LANG;
    u.rate = getRate();
    window.speechSynthesis.speak(u);
  } catch {
    // speech unavailable — ignore
  }
}

// Renders an Italian string with known vocabulary words made tappable: tapping
// a word reveals a popover with its English translation, IPA, and a speaker
// button (tap-to-translate / comprehensible input). Words not in the vocab
// index render as plain text. The original text is preserved exactly.
export function WordGloss({ text }) {
  const [openKey, setOpenKey] = useState(null);

  const tokens = useMemo(() => {
    return tokenize(text).map((tok) => ({
      ...tok,
      entry: tok.isWord ? lookupWord(tok.text) : null,
    }));
  }, [text]);

  useEffect(() => {
    if (openKey === null) return undefined;
    const onDown = (e) => {
      if (!e.target.closest?.('.gloss-word-wrap')) setOpenKey(null);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpenKey(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openKey]);

  return (
    <span className="wordgloss">
      {tokens.map((tok, i) => {
        if (!tok.isWord) return <span key={i}>{tok.text}</span>;
        // A word with no vocab entry (conjugation, name, function word): no
        // gloss, but still tap-to-hear when speech synthesis is available.
        if (!tok.entry) {
          return ttsSupported ? (
            <span
              key={i}
              className="gloss-tts"
              role="button"
              tabIndex={-1}
              title="Tap to hear"
              onClick={(e) => { e.stopPropagation(); speakWord(tok.text); }}
            >
              {tok.text}
            </span>
          ) : (
            <span key={i}>{tok.text}</span>
          );
        }
        const open = openKey === i;
        return (
          <span key={i} className="gloss-word-wrap">
            <button
              type="button"
              className={`gloss-word${open ? ' gloss-word-open' : ''}`}
              aria-expanded={open}
              onClick={(e) => {
                e.stopPropagation();
                setOpenKey(open ? null : i);
              }}
            >
              {tok.text}
            </button>
            {open && <GlossPopover entry={tok.entry} />}
          </span>
        );
      })}
    </span>
  );
}
