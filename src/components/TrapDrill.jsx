import { useState } from 'react';
import { TRAPS, TRAP_CATEGORIES } from '../../course/traps';
import { verdict as judge, orderByWeakness, loadTrapStats, saveTrapResult, accuracyFor } from '../utils/contrastive';
import { SpeakerButton } from './SpeakerButton';
import { DictationMic } from './DictationMic';
import { recordActivity } from '../utils/streak';

// "Trappole inglesi" (plan-speaking.md S5): each item is a spot where
// translating from English produces wrong Italian. Type (or dictate) the
// Italian; a predicted interference answer gets its targeted note instead of
// a generic ✗. Weakest categories are served first. FlashcardsTab hides this
// mode when the course ships no dataset.
const SESSION_SIZE = 12;

export function TrapDrill() {
  const [session, setSession] = useState(null);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(null); // null | 'correct' | 'trap' | 'other'

  function start() {
    const items = orderByWeakness(TRAPS, loadTrapStats()).slice(0, SESSION_SIZE);
    setSession({ items, index: 0, results: [] });
    setTyped('');
    setChecked(null);
  }

  function handleCheck() {
    const item = session.items[session.index];
    const v = judge(item, typed);
    if (v === 'empty') return;
    setChecked(v);
    saveTrapResult(item.trap, v === 'correct');
    recordActivity('practiced');
  }

  function handleNext() {
    setSession(s => ({
      ...s,
      index: s.index + 1,
      results: [...s.results, { item: s.items[s.index], verdict: checked }],
    }));
    setTyped('');
    setChecked(null);
  }

  function appendDictation(t) {
    setTyped(s => (s && !/\s$/.test(s) ? s + ' ' : s) + t);
  }

  // ── session end ─────────────────────────────────────────────────────────
  if (session && session.index >= session.items.length) {
    const { results } = session;
    const right = results.filter(r => r.verdict === 'correct').length;
    const trapped = results.filter(r => r.verdict === 'trap');
    return (
      <div className="prac-end">
        <div className="prac-end-score">{Math.round((right / results.length) * 100)}%</div>
        <div className="prac-end-label">{right} of {results.length} traps dodged</div>
        {trapped.length > 0 && (
          <div className="trap-end-review">
            <div className="trap-end-review-title">Where English grabbed the wheel:</div>
            <ul className="trap-end-list">
              {trapped.map(({ item }, i) => (
                <li key={i}>
                  <span className="trap-end-cat">{TRAP_CATEGORIES[item.trap]?.it}</span>
                  <span className="trap-end-it">{item.it}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="prac-end-actions">
          <button className="prac-restart-btn" onClick={start}>New session</button>
        </div>
      </div>
    );
  }

  // ── active card ─────────────────────────────────────────────────────────
  if (session) {
    const item = session.items[session.index];
    const total = session.items.length;
    const pct = (session.index / total) * 100;
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
          <div className="trap-category" title={TRAP_CATEGORIES[item.trap]?.en}>
            {TRAP_CATEGORIES[item.trap]?.it}
          </div>
          <div className="prac-recall-prompt">{item.en}</div>
          <div className="prac-typed-sub">Say it the Italian way — type or dictate</div>
          <input
            className={`prac-input${checked ? (checked === 'correct' ? ' prac-input-correct' : ' prac-input-wrong') : ''}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !checked && typed.trim()) handleCheck(); }}
            placeholder="Scrivi qui…"
            autoFocus
            disabled={!!checked}
            aria-label="Your answer"
          />
          {!checked && (
            <div className="trap-mic-row">
              <DictationMic onText={appendDictation} label="Parla" stopLabel="Ferma"
                title="Dictate your answer in Italian" />
            </div>
          )}

          {checked && (
            <div className="prac-typed-result">
              {checked === 'correct' ? (
                <span className="prac-result-ok">Giusto!</span>
              ) : checked === 'trap' ? (
                <span className="trap-result-trap">Trappola inglese!</span>
              ) : (
                <span className="prac-result-no">Not quite</span>
              )}
              <span className="prac-answer prac-answer-sentence">{item.it}</span>
              <SpeakerButton word={item.it} size={18} />
              <span className={`trap-note${checked === 'trap' ? ' trap-note-hit' : ''}`}>{item.note}</span>
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

  // ── start screen ────────────────────────────────────────────────────────
  const stats = loadTrapStats();
  const seen = Object.keys(TRAP_CATEGORIES).filter(id => accuracyFor(stats, id) !== null);
  return (
    <div className="prac-start-screen">
      <div className="prac-intro-card">
        <div className="prac-intro-title">Trappole inglesi · English interference traps</div>
        <div className="prac-intro-body">
          These are the exact places where thinking in English produces wrong
          Italian — <em>piacere</em> working backwards, pronouns before the verb,
          false friends, <em>ho fame</em> instead of "I am hungry". Translate each
          sentence the <strong>Italian</strong> way; if you fall into the predicted
          English pattern, you'll get a note showing how Italian frames it. The
          drill serves your weakest categories first.
        </div>
      </div>

      {seen.length > 0 && (
        <div className="trap-stats">
          <div className="prac-filter-label">Your categories</div>
          <div className="trap-stats-grid">
            {seen
              .sort((a, b) => (accuracyFor(stats, a) ?? 0) - (accuracyFor(stats, b) ?? 0))
              .map(id => {
                const acc = Math.round(accuracyFor(stats, id) * 100);
                return (
                  <span key={id}
                    className={`trap-stat-chip${acc < 60 ? ' trap-stat-weak' : ''}`}
                    title={TRAP_CATEGORIES[id].en}>
                    {TRAP_CATEGORIES[id].it} · {acc}%
                  </span>
                );
              })}
          </div>
        </div>
      )}

      <button className="prac-go-btn" onClick={start}>
        Start — {Math.min(SESSION_SIZE, TRAPS.length)} of {TRAPS.length} traps
      </button>
    </div>
  );
}
