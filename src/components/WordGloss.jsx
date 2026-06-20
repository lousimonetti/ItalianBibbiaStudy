import { useState, useMemo, useEffect } from 'react';
import { tokenize, lookupWord } from '../utils/vocabIndex';
import { GlossPopover } from './GlossPopover';

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
        if (!tok.isWord || !tok.entry) {
          return <span key={i}>{tok.text}</span>;
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
