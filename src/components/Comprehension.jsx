import { useState } from 'react';
import { comprehensionItems, isCorrect } from '../utils/comprehension';

// O5 — Reading-comprehension checks. True/false or multiple-choice questions on
// the week's reading, each with an English gloss as a comprehensibility guard.
// Collapsible; renders nothing when the week has no authored questions.
function TFRow({ item }) {
  const [resp, setResp] = useState(null);
  const answered = resp !== null;
  const right = answered && isCorrect(item, resp);
  return (
    <div className="comp-row">
      <div className="comp-q">{item.it}</div>
      {item.en && <div className="comp-q-en">{item.en}</div>}
      <div className="comp-tf-btns">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            className={`comp-tf-btn${resp === v ? (isCorrect(item, v) ? ' comp-ok' : ' comp-no') : ''}`}
            onClick={() => !answered && setResp(v)}
            disabled={answered}
          >
            {v ? 'Vero' : 'Falso'}
          </button>
        ))}
      </div>
      {answered && (
        <div className={`comp-feedback${right ? ' comp-feedback-ok' : ' comp-feedback-no'}`}>
          {right ? '✓ Correct' : `✗ The answer is ${item.answer ? 'Vero' : 'Falso'}`}
          {item.explain && <span className="comp-explain">{item.explain}</span>}
        </div>
      )}
    </div>
  );
}

function MCRow({ item }) {
  const [resp, setResp] = useState(null);
  const answered = resp !== null;
  const right = answered && isCorrect(item, resp);
  return (
    <div className="comp-row">
      <div className="comp-q">{item.it}</div>
      {item.en && <div className="comp-q-en">{item.en}</div>}
      <div className="comp-mc-opts">
        {item.options.map((opt, i) => {
          const state = answered
            ? i === item.answer ? ' comp-ok' : i === resp ? ' comp-no' : ''
            : '';
          return (
            <button
              key={i}
              className={`comp-mc-btn${state}`}
              onClick={() => !answered && setResp(i)}
              disabled={answered}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`comp-feedback${right ? ' comp-feedback-ok' : ' comp-feedback-no'}`}>
          {right ? '✓ Correct' : `✗ The answer is "${item.options[item.answer]}"`}
          {item.explain && <span className="comp-explain">{item.explain}</span>}
        </div>
      )}
    </div>
  );
}

export function Comprehension({ week }) {
  const [open, setOpen] = useState(false);
  const items = comprehensionItems(week);
  if (!items.length) return null;

  return (
    <div className="comp-panel">
      <button className="comp-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="comp-toggle-title">
          Comprehension — {items.length} question{items.length !== 1 ? 's' : ''}
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="comp-body">
          <div className="comp-intro">Check your understanding of this week's reading.</div>
          {items.map((item, i) =>
            item.type === 'mc' ? <MCRow key={i} item={item} /> : <TFRow key={i} item={item} />
          )}
        </div>
      )}
    </div>
  );
}
