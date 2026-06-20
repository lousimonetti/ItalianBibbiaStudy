import { useState } from 'react';

// Generic Italian sentence openers that fit reflective Bible-study journaling.
// Clicking one drops it into the entry to break the blank-page barrier.
const STARTERS = [
  'Oggi ho letto…',
  'Questo passo parla di…',
  'Ho imparato che…',
  'Mi colpisce che…',
  'Voglio ricordare…',
];

// Lowers the blank-page barrier: surfaces the week's grammar focus, a few Italian
// sentence starters, and the week's vocabulary as click-to-insert chips. Pure
// presentation over existing week data — onInsert appends to the entry.
export function JournalScaffold({ week, onInsert }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="jrn-scaffold">
      <button className="jrn-scaffold-toggle" onClick={() => setOpen((v) => !v)}>
        <span>Aiuto per scrivere — sentence starters & vocab</span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="jrn-scaffold-body">
          {week.grammar?.title && (
            <div className="jrn-scaffold-grammar">
              <span className="jrn-scaffold-grammar-label">Grammatica:</span> {week.grammar.title}
            </div>
          )}

          <div className="jrn-scaffold-label">Inizia una frase</div>
          <div className="jrn-scaffold-chips">
            {STARTERS.map((s) => (
              <button key={s} className="jrn-chip" onClick={() => onInsert(s)}>{s}</button>
            ))}
          </div>

          <div className="jrn-scaffold-label">Usa il vocabolario</div>
          <div className="jrn-scaffold-chips">
            {week.vocab.map(([it, en]) => (
              <button key={it} className="jrn-chip jrn-chip-vocab" title={en} onClick={() => onInsert(it)}>
                {it}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
