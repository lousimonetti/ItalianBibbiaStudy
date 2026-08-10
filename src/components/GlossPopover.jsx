import { SpeakerButton } from './SpeakerButton';

// Small pronunciation/translation card shown when a glossable word is tapped.
// Presentational only — open/close state is owned by the parent WordGloss.
// Vocab words carry an English gloss; words generated on the fly (not in the
// vocab index) have no `en` and an `approx` IPA, so the EN line is omitted and
// the IPA is flagged as approximate.
export function GlossPopover({ entry }) {
  return (
    <span className="gloss-pop" role="tooltip">
      <span className="gloss-pop-head">
        <span className="gloss-pop-it">{entry.it}</span>
        <SpeakerButton word={entry.it} size={15} />
      </span>
      {entry.en && <span className="gloss-pop-en">{entry.en}</span>}
      {entry.ipa && (
        <span className="gloss-pop-ipa">
          {entry.ipa}
          {entry.approx && <span className="gloss-pop-approx" title="Auto-generated approximate pronunciation"> ≈</span>}
        </span>
      )}
      {/* An inflected form points back at the word it belongs to — naming that
          relationship ("ha creduto → credere") is most of what an English
          speaker has to internalise about Italian verbs. */}
      {entry.lemma && (
        <span className="gloss-pop-lemma">
          form of <strong>{entry.lemma}</strong>
        </span>
      )}
    </span>
  );
}
