import { useState, useMemo, useEffect } from 'react';
import { tokenize, lookupWord } from '../utils/vocabIndex';
import { HAS_IPA } from '../utils/locale';
import { toIPA } from '../utils/it2ipa';
import { lookupCommon } from '../utils/it2en';
import { GlossPopover } from './GlossPopover';

const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// A word is worth a popover if we can show *something* useful: a vocab gloss, or
// (for any other word) generated IPA and/or speakable audio.
const canGlossUnknown = ttsSupported || HAS_IPA;

// Renders an Italian string with every word made tappable: tapping a word
// reveals a popover. Vocab words show their English translation, stored IPA, and
// a speaker; any other word shows an auto-generated approximate IPA and a speaker
// (tap-to-translate / pronunciation help). The original text is preserved exactly.
//
// `roles` is optional clause-skeleton markup (clauseSkeleton.analyze().tokens):
// a parallel array of { role, dim } that adds structural classes on top of the
// gloss affordance, so the reader keeps tap-to-translate while the skeleton view
// is on. It lines up index-for-index because both sides call the same tokenize().
export function WordGloss({ text, roles = null }) {
  const [openKey, setOpenKey] = useState(null);

  const tokens = useMemo(() => {
    return tokenize(text).map((tok) => {
      if (!tok.isWord) return { ...tok, entry: null };
      const vocab = lookupWord(tok.text);
      if (vocab) return { ...tok, entry: vocab };
      // Not in the vocab index: build an on-the-fly pronunciation entry.
      const commonEn = lookupCommon(tok.text);
      return {
        ...tok,
        entry: {
          it: tok.text,
          en: commonEn || '',
          ipa: HAS_IPA ? toIPA(tok.text) : '',
          approx: true,
        },
      };
    });
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

  // Structural classes for token i, when a skeleton analysis was supplied.
  const skel = (i) => {
    const mark = roles && roles.length === tokens.length ? roles[i] : null;
    if (!mark) return '';
    const role = mark.role && mark.role !== 'plain' ? ` sk-${mark.role}` : '';
    return `${role}${mark.dim ? ' sk-dim' : ''}`;
  };

  return (
    <span className={`wordgloss${roles ? ' wordgloss-skeleton' : ''}`}>
      {tokens.map((tok, i) => {
        if (!tok.isWord) {
          const cls = skel(i);
          return cls ? <span key={i} className={cls}>{tok.text}</span> : <span key={i}>{tok.text}</span>;
        }
        const isVocab = tok.entry && !tok.entry.approx;
        // An auto-generated entry is only worth a popover if it has IPA or audio
        // to show; otherwise render the word as plain text.
        const hasContent = tok.entry && (isVocab || canGlossUnknown);
        if (!hasContent) return <span key={i} className={skel(i)}>{tok.text}</span>;
        const open = openKey === i;
        return (
          <span key={i} className={`gloss-word-wrap${skel(i)}`}>
            <button
              type="button"
              className={`gloss-word${isVocab ? '' : ' gloss-word-plain'}${open ? ' gloss-word-open' : ''}`}
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
