import { useState } from 'react';
import { drillItems, splitBlank } from '../utils/grammarDrill';
import { checkAnswer } from '../utils/answer';
import { SpeakerButton } from './SpeakerButton';

// O3 — Grammar drill. Short fill-in-the-blank items targeting the week's grammar
// focus, anchored to vetted example sentences. Typed answers use the same
// forgiving matching as Recall/Cloze. Collapsible; renders nothing when the week
// has no authored drills.
function DrillRow({ item }) {
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(false);
  const { before, after } = splitBlank(item.q);
  const correct = checked && checkAnswer(item.a, typed);
  const filled = before + item.a + after;

  return (
    <div className="drill-row">
      <div className="drill-sentence">
        <span>{before}</span>
        <input
          className={`drill-input${checked ? (correct ? ' drill-ok' : ' drill-no') : ''}`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && typed.trim()) setChecked(true); }}
          placeholder="…"
          disabled={checked}
          aria-label="Fill the blank"
        />
        <span>{after}</span>
      </div>
      {item.hint && !checked && <div className="drill-hint">{item.hint}</div>}
      {!checked ? (
        <button className="drill-btn" onClick={() => setChecked(true)} disabled={!typed.trim()}>
          Check
        </button>
      ) : (
        <div className="drill-feedback">
          <span className={correct ? 'drill-verdict-ok' : 'drill-verdict-no'}>
            {correct ? 'Correct!' : 'Not quite'}
          </span>
          {!correct && <span className="drill-answer">{item.a}</span>}
          <span className="drill-filled">{filled}</span>
          <SpeakerButton word={filled} size={14} />
          <button
            className="drill-btn drill-btn-retry"
            onClick={() => { setChecked(false); setTyped(''); }}
          >
            Again
          </button>
        </div>
      )}
    </div>
  );
}

export function GrammarDrill({ week }) {
  const [open, setOpen] = useState(false);
  const items = drillItems(week);
  if (!items.length) return null;

  return (
    <div className="drill-panel">
      <button className="drill-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="drill-toggle-title">
          Grammar drill — {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="drill-body">
          <div className="drill-intro">
            Fill each blank — practice the grammar from this week in context.
          </div>
          {items.map((item, i) => <DrillRow key={i} item={item} />)}
        </div>
      )}
    </div>
  );
}
