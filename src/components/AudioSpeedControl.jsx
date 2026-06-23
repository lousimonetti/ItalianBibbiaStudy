import { useAudioSpeed } from '../hooks/useAudioSpeed';
import { SPEEDS } from '../utils/audioSpeed';

// Header control: cycles the app-wide audio speed (Slow → Normal → Fast).
// Every speaker button that doesn't pass an explicit rate follows this.
export function AudioSpeedControl() {
  const { speedId, setSpeed } = useAudioSpeed();
  const idx = SPEEDS.findIndex((s) => s.id === speedId);
  const current = SPEEDS[idx] || SPEEDS[1];
  const next = SPEEDS[(idx + 1) % SPEEDS.length];

  return (
    <button
      className={`audio-speed-toggle audio-speed-${current.id}`}
      onClick={() => setSpeed(next.id)}
      aria-label={`Audio speed: ${current.label}. Tap for ${next.label}.`}
      title={`Audio speed: ${current.label} — tap for ${next.label}`}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 3a5 5 0 015 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 11a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 11l2.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="1" fill="currentColor" />
      </svg>
      <span className="audio-speed-label">{current.label}</span>
    </button>
  );
}
