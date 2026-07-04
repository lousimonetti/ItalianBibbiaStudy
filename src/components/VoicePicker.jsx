import { useState } from 'react';
import { useVoices } from '../hooks/useVoices';
import { isIOS } from '../utils/platform';

// Header control: choose which Italian voice the app uses for spoken audio.
// The list is whatever the device/browser provides (we can't bundle voices with
// no backend).
//
// On non-iOS we hide entirely when there's nothing to choose (0–1 voices). On
// iOS we still show a small "Voices" affordance even with a single voice, because
// iOS ships only a compact default until the user downloads better ones — and
// the whole point is to tell them how (we can't install voices for them).
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
          aria-label="How to add more Italian voices on iPhone or iPad"
          title="Add more Italian voices"
        >
          {showPicker ? 'ⓘ' : '+ Voices'}
        </button>
      )}

      {ios && hintOpen && (
        <div className="voice-help" role="status">
          <strong>Add natural Italian voices</strong> on iPhone/iPad:
          <div className="voice-help-path">
            Settings → Accessibility → Read &amp; Speak → Voices → Italiano
          </div>
          <span className="voice-help-note">
            (On iOS 25 or earlier the menu is called <em>Spoken Content</em>.)
          </span>{' '}
          Pick an <strong>Enhanced</strong> or <strong>Premium</strong> voice and tap the
          download (cloud) icon, then reopen this app and tap a speaker — the new
          voice appears here.
        </div>
      )}
    </span>
  );
}
