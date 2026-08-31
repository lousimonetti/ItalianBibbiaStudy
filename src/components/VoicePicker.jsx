import { useState } from 'react';
import { useVoices } from '../hooks/useVoices';
import { isIOS } from '../utils/platform';

// Header control: choose which Italian voice the app uses for spoken audio.
// The list is whatever the device/browser provides (we can't bundle voices with
// no backend), deduped by name so one voice shipped at several compression
// tiers appears once.
//
// We hide entirely when there's nothing to choose (0–1 voices). On iOS we still
// show a small "ⓘ" affordance, because Safari offers exactly one Italian voice
// and users who have downloaded better ones in Settings reasonably expect to
// find them here — the panel explains why they aren't available rather than
// leaving an unexplained absence.
export function VoicePicker() {
  const { voices, selectedURI, setVoice } = useVoices();
  const [hintOpen, setHintOpen] = useState(false);
  const ios = isIOS();
  const showPicker = voices.length >= 2;

  if (!showPicker && !ios) return null;

  return (
    <span className="voice-picker-wrap">
      {showPicker && (
        <label className="voice-picker" title="Choose the voice used for spoken audio">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="6" y="1.5" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M3.5 7a4.5 4.5 0 009 0M8 11.5v3M5.5 14.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <select
            className="voice-picker-select"
            value={selectedURI}
            onChange={(e) => setVoice(e.target.value)}
            aria-label="Audio voice"
          >
            <option value="">Default voice</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {ios && (
        <button
          className="voice-help-btn"
          onClick={() => setHintOpen((o) => !o)}
          aria-expanded={hintOpen}
          aria-label="Why only one voice is available on iPhone and iPad"
          title="About the voice used for audio"
        >
          ⓘ
        </button>
      )}

      {ios && hintOpen && (
        <div className="voice-help" role="status">
          <strong>Safari offers only one Italian voice.</strong> On iPhone and
          iPad it hands web pages the built-in voice (Alice) and nothing else.
          <span className="voice-help-note">
            The Enhanced and Premium voices you can download under Settings →
            Accessibility → Spoken Content → Voices — Emma, Luca and the rest —
            are available to installed apps, but Safari does not pass them to a
            web page. Downloading them will not add anything to this list.
          </span>{' '}
          The audio here will always use Alice. It's a Safari limitation, not a
          setting you can change.
        </div>
      )}
    </span>
  );
}
