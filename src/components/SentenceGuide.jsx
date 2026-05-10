import { useState } from 'react';

const PATTERNS = [
  { label: 'Subject + verb',            it: 'Io leggo.',             en: 'I read.' },
  { label: 'Subject + verb + object',   it: 'Io leggo la Bibbia.',   en: 'I read the Bible.' },
  { label: 'Subject + verb + adjective',it: 'La parola è vera.',     en: 'The word is true.' },
  { label: 'Negation',                  it: 'Non capisco.',          en: 'I don\'t understand.' },
  { label: 'Question',                  it: 'Cosa significa?',       en: 'What does it mean?' },
  { label: 'Past (passato prossimo)',   it: 'Ho letto il capitolo.', en: 'I have read the chapter.' },
  { label: 'Connectors',               it: 'e · ma · perché · quindi', en: 'and · but · because · so' },
];

export function SentenceGuide() {
  const [open, setOpen] = useState(false);

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
