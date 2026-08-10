import { useState } from 'react';
import { config } from '../../course/config';

// Sentence patterns are course data (they are specific to the target language),
// so they live in config.guide.sentencePatterns rather than being hardcoded
// here — a fork changes the course, not the component.
const PATTERNS = config.guide?.sentencePatterns ?? [];

export function SentenceGuide() {
  const [open, setOpen] = useState(false);

  if (!PATTERNS.length) return null;

  return (
    <div className="sent-guide">
      <button className="sent-guide-toggle" onClick={() => setOpen(v => !v)}>
        <span>Sentence structure reference</span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="sent-guide-body">
          {PATTERNS.map(({ label, it, en }) => (
            <div key={label} className="sent-guide-row">
              <div className="sent-guide-label">{label}</div>
              <div className="sent-guide-example">
                <span className="sent-guide-it">{it}</span>
                <span className="sent-guide-en">{en}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
