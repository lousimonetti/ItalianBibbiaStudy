import { useState, useMemo } from 'react';
import { PHASES } from '../data/studyData';
import { IPAGuide } from './IPAGuide';

function buildCards(phases) {
  const cards = [];
  for (const phase of phases) {
    for (const week of phase.weeks) {
      for (const [it, en, ex, ipa] of week.vocab) {
        cards.push({ it, en, ex, ipa, weekN: week.n, reading: week.r, phaseId: phase.id });
      }
    }
  }
  return cards;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_CARDS = buildCards(PHASES);

function SessionEnd({ known, total, againCount, onRestart, onDrillAgain }) {
  const pct = Math.round((known / total) * 100);
  return (
    <div className="prac-end">
      <div className="prac-end-score">{pct}%</div>
      <div className="prac-end-label">
        {known} of {total} cards known
      </div>
      {againCount > 0 && (
        <div className="prac-end-sub">{againCount} card{againCount !== 1 ? 's' : ''} to review again</div>
      )}
      <div className="prac-end-actions">
        {againCount > 0 && (
          <button className="prac-drill-btn" onClick={onDrillAgain}>
            Drill {againCount} again
          </button>
        )}
        <button className="prac-restart-btn" onClick={onRestart}>
          New session
        </button>
      </div>
    </div>
  );
}

export function PracticeMode() {
  const [filter, setFilter] = useState('all');
  const [session, setSession] = useState(null);
  const [flipped, setFlipped] = useState(false);

  const filtered = useMemo(
    () => (filter === 'all' ? ALL_CARDS : ALL_CARDS.filter(c => c.phaseId === filter)),
    [filter]
  );

  function startSession(cards) {
    setSession({ cards: shuffle(cards), index: 0, known: 0, again: [] });
    setFlipped(false);
  }

  function handleKnown() {
    setSession(s => ({ ...s, index: s.index + 1, known: s.known + 1 }));
    setFlipped(false);
  }

  function handleAgain() {
    setSession(s => ({ ...s, index: s.index + 1, again: [...s.again, s.cards[s.index]] }));
    setFlipped(false);
  }

  // Session complete
  if (session && session.index >= session.cards.length) {
    return (
      <SessionEnd
        known={session.known}
        total={session.cards.length}
        againCount={session.again.length}
        onRestart={() => setSession(null)}
        onDrillAgain={() => startSession(session.again)}
      />
    );
  }

  // Active card
  if (session) {
    const card = session.cards[session.index];
    const total = session.cards.length;
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

        <div
          className={`prac-scene`}
          onClick={() => !flipped && setFlipped(true)}
          role="button"
          aria-label={flipped ? 'Card revealed' : 'Tap to reveal'}
        >
          <div className={`prac-card${flipped ? ' prac-flipped' : ''}`}>
            <div className="prac-face prac-front">
              <span className="prac-word">{card.it}</span>
              <span className="prac-tap-hint">tap to reveal</span>
            </div>
            <div className="prac-face prac-back">
              <span className="prac-translation">{card.en}</span>
              <span className="prac-ipa">{card.ipa}</span>
              <span className="prac-example">"{card.ex}"</span>
            </div>
          </div>
        </div>

        <div className="prac-card-meta">Week {card.weekN} · {card.reading}</div>

        {flipped ? (
          <div className="prac-actions">
            <button className="prac-again-btn" onClick={handleAgain}>Still learning</button>
            <button className="prac-known-btn" onClick={handleKnown}>Got it ✓</button>
          </div>
        ) : (
          <div className="prac-actions">
            <button className="prac-reveal-btn" onClick={() => setFlipped(true)}>Reveal</button>
          </div>
        )}
      </div>
    );
  }

  // Filter / start screen
  return (
    <div className="prac-start-screen">
      <div className="prac-intro-card">
        <div className="prac-intro-title">Built-in flashcards</div>
        <div className="prac-intro-body">
          Practice vocabulary in your browser — no Anki needed. Tap a card to
          reveal the translation, then mark whether you knew it. Cards marked
          "Still learning" are offered again at the end of each session.
        </div>
      </div>

      <div className="prac-filter-label">Choose cards</div>
      <div className="prac-filter-grid">
        <button
          className={`prac-filter-btn${filter === 'all' ? ' prac-filter-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <span className="prac-filter-name">All phases</span>
          <span className="prac-filter-count">259 cards</span>
        </button>
        {PHASES.map(p => {
          const count = ALL_CARDS.filter(c => c.phaseId === p.id).length;
          return (
            <button
              key={p.id}
              className={`prac-filter-btn${filter === p.id ? ' prac-filter-active' : ''}`}
              onClick={() => setFilter(p.id)}
              style={filter === p.id ? { borderColor: p.badgeColor, background: p.badgeBg, color: p.badgeColor } : {}}
            >
              <span className="prac-filter-name">{p.title.replace(/: .+/, '')}</span>
              <span className="prac-filter-sub">{p.book}</span>
              <span className="prac-filter-count">{count} cards</span>
            </button>
          );
        })}
      </div>

      <button className="prac-go-btn" onClick={() => startSession(filtered)}>
        Start — {filtered.length} cards
      </button>

      <IPAKeyPanel />
    </div>
  );
}

function IPAKeyPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="prac-ipa-panel">
      <button className="prac-ipa-toggle" onClick={() => setOpen(v => !v)}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Pronunciation key — what do those symbols mean?
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <IPAGuide compact />}
    </div>
  );
}
