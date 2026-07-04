import { weekPhrases } from '../utils/chunks';
import { SpeakerButton } from './SpeakerButton';
import { UiText } from '../i18n/UiText';

// "Frasi fisse" (plan-speaking.md S1): the week's formulaic chunks with a
// speaker, natural gloss, and — the mindset lever — an optional literal
// word-by-word rendering showing how Italian construes the meaning. Renders
// nothing when the week ships no phrases.
export function PhraseList({ week }) {
  const phrases = weekPhrases(week);
  if (!phrases.length) return null;

  return (
    <div className="detail-section" style={{ marginTop: 14 }}>
      <div className="detail-label"><UiText k="detail.phrases" /></div>
      <div className="phrase-box">
        {phrases.map((p, i) => (
          <div className="phrase-row" key={i}>
            <div className="phrase-main">
              <span className="phrase-it">{p.it}</span>
              <SpeakerButton word={p.it} size={14} />
            </div>
            <div className="phrase-glosses">
              <span className="phrase-en">{p.en}</span>
              {p.lit && (
                <span className="phrase-lit" title="Literal word-by-word — how Italian frames it">
                  lett. “{p.lit}”
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
