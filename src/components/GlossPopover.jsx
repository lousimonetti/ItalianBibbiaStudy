import { SpeakerButton } from './SpeakerButton';

// Small translation card shown when a glossable word is tapped. Presentational
// only — open/close state is owned by the parent WordGloss.
export function GlossPopover({ entry }) {
  return (
    <span className="gloss-pop" role="tooltip">
      <span className="gloss-pop-head">
        <span className="gloss-pop-it">{entry.it}</span>
        <SpeakerButton word={entry.it} size={15} />
      </span>
      <span className="gloss-pop-en">{entry.en}</span>
      {entry.ipa && <span className="gloss-pop-ipa">{entry.ipa}</span>}
    </span>
  );
}
