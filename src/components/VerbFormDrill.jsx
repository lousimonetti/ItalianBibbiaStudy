import { useState } from 'react';
import { VERB_FORMS, FORM_CATEGORIES } from '../../course/verbForms';
import {
  verdict as judge, confusedWith, orderForms, loadFormStats, saveFormResult, accuracyFor,
} from '../utils/verbForms';
import { SpeakerButton } from './SpeakerButton';
import { recordActivity } from '../utils/streak';

// "Tempi della lettura" — the reading tenses. A form is shown; you name its
// infinitive. This is deliberately a RECOGNITION drill: the passato remoto and
// the trapassato prossimo are what CEI narrative is written in, and the course
// teaches neither, but a reader never has to produce them — only to map them
// back to a verb they know. Each answer reveals the passato prossimo equivalent,
// so the unknown tense is always anchored to the taught one.
//
// Weakest category first, sharing the trap drill's scheduler. FlashcardsTab
// hides this mode when the course ships no dataset.
const SESSION_SIZE = 12;

export function VerbFormDrill() {
  const [session, setSession] = useState(null);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(null); // null | 'correct' | 'confused' | 'wrong'

  function start(pool = VERB_FORMS) {
    const items = orderForms(pool, loadFormStats()).slice(0, SESSION_SIZE);
    setSession({ items, index: 0, results: [] });
    setTyped('');
    setChecked(null);
  }

  function handleCheck() {
    const item = session.items[session.index];
    const v = judge(item, typed, VERB_FORMS);
    if (v === 'empty') return;
    setChecked(v);
    saveFormResult(item.cat, v === 'correct');
    recordActivity('practiced');
  }

  function handleNext() {
    setSession((s) => ({
      ...s,
      index: s.index + 1,
      results: [...s.results, { item: s.items[s.index], verdict: checked }],
    }));
    setTyped('');
    setChecked(null);
  }

  // ── start screen ────────────────────────────────────────────────────────
  if (!session) {
    const stats = loadFormStats();
    return (
      <div className="prac-start">
        <div className="prac-start-title">Tempi della lettura</div>
        <p className="prac-start-sub">
          The tenses this course reads but never taught. You are not learning to
          write these — only to see <b>disse</b> and think <i>dire</i> without stopping.
        </p>

        <div className="vf-cats">
          {Object.entries(FORM_CATEGORIES).map(([key, cat]) => {
            const acc = accuracyFor(stats, key);
            return (
              <div className="vf-cat" key={key}>
                <div className="vf-cat-head">
                  <span className="vf-cat-it">{cat.it}</span>
                  <span className="vf-cat-acc">
                    {acc === null ? 'new' : `${Math.round(acc * 100)}%`}
                  </span>
                </div>
                <div className="vf-cat-en">{cat.en}</div>
                <div className="vf-cat-tip">{cat.tip}</div>
              </div>
            );
          })}
        </div>

        <div className="prac-start-actions">
          <button className="prac-start-btn" onClick={() => start()}>
            Start · {Math.min(SESSION_SIZE, VERB_FORMS.length)} forms
          </button>
        </div>
      </div>
    );
  }

  // ── session end ─────────────────────────────────────────────────────────
  if (session.index >= session.items.length) {
    const { results } = session;
    const right = results.filter((r) => r.verdict === 'correct').length;
    const missed = results.filter((r) => r.verdict !== 'correct');
    return (
      <div className="prac-end">
        <div className="prac-end-score">{Math.round((right / results.length) * 100)}%</div>
        <div className="prac-end-label">{right} of {results.length} forms recognised</div>
        {missed.length > 0 && (
          <div className="trap-end-review">
            <div className="trap-end-review-title">Worth a second look:</div>
            <ul className="trap-end-list">
              {missed.map(({ item }, i) => (
                <li key={i}>
                  <span className="trap-end-cat">{item.form}</span>
                  <span className="trap-end-it">{item.inf} · {item.pp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="prac-end-actions">
          <button className="prac-restart-btn" onClick={() => start()}>New session</button>
          {missed.length > 0 && (
            <button className="prac-restart-btn" onClick={() => start(missed.map((m) => m.item))}>
              Drill these {missed.length}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── active card ─────────────────────────────────────────────────────────
  const item = session.items[session.index];
  const total = session.items.length;
  const pct = (session.index / total) * 100;
  const cat = FORM_CATEGORIES[item.cat];
  const mixup = checked === 'confused' ? confusedWith(typed, VERB_FORMS) : null;

  return (
    <div className="prac-session">
      <div className="prac-top-row">
        <span className="prac-counter">{session.index + 1} / {total}</span>
        <button className="prac-exit-btn" onClick={() => setSession(null)}>Exit</button>
      </div>

      <div className="prac-bar-bg">
        <div className="prac-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="prac-typed-card">
        <div className="trap-category" title={cat?.en}>{cat?.it}</div>

        <div className="vf-form">
          {item.form}
          <SpeakerButton word={item.form} size={18} />
        </div>
        <div className="prac-typed-sub">Which verb is this? Type the infinitive.</div>

        <input
          className={`prac-input${checked ? (checked === 'correct' ? ' prac-input-correct' : ' prac-input-wrong') : ''}`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !checked && typed.trim()) handleCheck(); }}
          placeholder="infinito…"
          autoFocus
          disabled={!!checked}
          aria-label="The infinitive"
        />

        {checked && (
          <div className="prac-typed-result">
            {checked === 'correct' ? (
              <span className="prac-result-ok">Giusto!</span>
            ) : checked === 'confused' ? (
              <span className="trap-result-trap">That is {mixup}, not this one</span>
            ) : (
              <span className="prac-result-no">Not quite</span>
            )}
            <span className="prac-answer prac-answer-sentence">{item.inf}</span>
            <span className="vf-bridge">
              <b>{item.form}</b> = <b>{item.pp}</b> — {item.en}
            </span>
            {item.note && <span className="trap-note">{item.note}</span>}
          </div>
        )}
      </div>

      <div className="prac-actions">
        {checked ? (
          <button className="prac-known-btn" onClick={handleNext}>
            {session.index + 1 < total ? 'Next →' : 'Finish'}
          </button>
        ) : (
          <button className="prac-reveal-btn" onClick={handleCheck} disabled={!typed.trim()}>
            Check
          </button>
        )}
      </div>
    </div>
  );
}
