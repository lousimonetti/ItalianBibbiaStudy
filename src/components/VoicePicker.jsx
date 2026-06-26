import { useVoices } from '../hooks/useVoices';

// Header control: choose which Italian voice the app uses for spoken audio.
// The list is whatever the device/browser provides (we can't bundle voices with
// no backend). Hidden when there's nothing meaningful to choose (0–1 voices), so
// most desktops with a single system voice see no extra control.
export function VoicePicker() {
  const { voices, selectedURI, setVoice } = useVoices();

  if (voices.length < 2) return null;

  return (
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
  );
}
