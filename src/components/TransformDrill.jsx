import { useState } from 'react';
import { transformItems, checkTransform } from '../utils/transformDrill';
import { SpeakerButton } from './SpeakerButton';
import { recordActivity } from '../utils/streak';

// "Trasforma" (plan-speaking.md S2): manipulate an Italian sentence entirely
// within Italian (pluralize, change tense, swap a clitic). The instruction is
// in Italian; English never enters the loop. Exact-form checking, with a
// word-level diff on a miss so the learner sees which word they didn't
// transform. Collapsible; renders nothing when the week has no transforms.
function TransformRow({ item }) {
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState(null); // { correct, diff } | null

  function check() {
    const r = checkTransform(item, typed);
    setResult(r);
    recordActivity('practiced');
  }

  return (
    <div className="xform-row">
      <div className="xform-instr">{item.instruction}</div>
      <div className="xform-base">
        <span>{item.base}</span>
        <SpeakerButton word={item.base} size={13} />
      </div>
      <input
        className={`xform-input${result ? (result.correct ? ' drill-ok' : ' drill-no') : ''}`}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !result && typed.trim()) check(); }}
        placeholder="Trasforma qui…"
        disabled={!!result}
        aria-label="Your transformation"
      />
      {!result ? (
        <button className="drill-btn" onClick={check} disabled={!typed.trim()}>Check</button>
      ) : (
        <div className="drill-feedback">
          <span className={result.correct ? 'drill-verdict-ok' : 'drill-verdict-no'}>
            {result.correct ? 'Giusto!' : 'Non ancora'}
          </span>
          {!result.correct && (
            <span className="xform-diff">
              {result.diff.original.map((m, i) => (
                <span key={i} className={m.ok ? 'xform-w-ok' : 'xform-w-miss'}>{m.w} </span>
              ))}
            </span>
          )}
          <span className="xform-answer">
            {item.answer}
            <SpeakerButton word={item.answer} size={13} />
          </span>
          <button className="drill-btn drill-btn-retry" onClick={() => { setResult(null); setTyped(''); }}>
            Again
          </button>
        </div>
      )}
    </div>
  );
}

export function TransformDrill({ week }) {
  const [open, setOpen] = useState(false);
  const items = transformItems(week);
  if (!items.length) return null;

  return (
    <div className="drill-panel">
      <button className="drill-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="drill-toggle-title">
          Trasforma — {items.length} item{items.length !== 1 ? 's' : ''} · think in Italian
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="drill-body">
          <div className="drill-intro">
            Change each sentence as the Italian instruction says — no English, stay inside the grammar.
          </div>
          {items.map((item, i) => <TransformRow key={i} item={item} />)}
        </div>
      )}
    </div>
  );
}
