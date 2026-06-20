import { useImmersion } from './ImmersionContext';
import { UI_STRINGS } from './strings';

// Renders a chrome string by key. Default (immersion off) renders the English
// exactly as before. In immersion mode it renders the Italian with the English
// as a hover/long-press tooltip (the comprehensibility guard), underlined with
// a faint dotted hint. Works inside buttons (it's a span, not interactive).
export function UiText({ k }) {
  const { immersive } = useImmersion();
  const entry = UI_STRINGS[k];

  if (!entry) return k;
  if (!immersive) return entry.en;

  return (
    <span className="ui-it" title={entry.en} aria-label={entry.en}>
      {entry.it}
    </span>
  );
}
