import { useState } from 'react';
import { PHASES } from '../data/studyData';
import { PracticeMode } from './PracticeMode';

const PHASE_FILES = [
  { id: 'p1', label: 'Phase 1 — John (56 cards)',            file: 'phase-1-john',         cards: 56 },
  { id: 'p2', label: 'Phase 2 — Luke (70 cards)',            file: 'phase-2-luke',         cards: 70 },
  { id: 'p3', label: 'Phase 3 — Acts (70 cards)',            file: 'phase-3-acts',         cards: 70 },
  { id: 'p4', label: 'Phase 4 — Romans & Psalms (63 cards)', file: 'phase-4-romans-psalms',cards: 63 },
];

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1v9m0 0L5 7m3 3 3-3M2 12v1.5A1.5 1.5 0 003.5 15h9A1.5 1.5 0 0014 13.5V12"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AnkiLink({ href, label }) {
  return (
    <a className="anki-dl-btn" href={href} download>
      <DownloadIcon />
      {label}
    </a>
  );
}

export function FlashcardsTab() {
  const [activePhase, setActivePhase] = useState(null);
  const [mode, setMode] = useState('anki');

  return (
    <div className="fc-wrap">

      {/* Mode toggle */}
      <div className="fc-mode-toggle">
        <button
          className={`fc-mode-btn${mode === 'anki' ? ' active' : ''}`}
          onClick={() => setMode('anki')}
        >
          Anki Decks
        </button>
        <button
          className={`fc-mode-btn${mode === 'practice' ? ' active' : ''}`}
          onClick={() => setMode('practice')}
        >
          Practice (built-in)
        </button>
      </div>

      {mode === 'practice' && <PracticeMode />}

      {mode === 'anki' && <>

      {/* Header */}
      <div className="fc-header">
        <div>
          <div className="fc-title">Anki Decks</div>
          <div className="fc-subtitle">259 cards across 37 weeks — import into Anki on any device</div>
        </div>
        <AnkiLink href="anki/complete.apkg" label="Download all 259 cards" />
      </div>

      {/* How-to */}
      <div className="fc-howto">
        <div className="fc-howto-label">How to import</div>
        <div className="fc-howto-steps">
          <span>1. Download a deck below</span>
          <span className="fc-dot">·</span>
          <span>2. Open Anki on desktop or phone</span>
          <span className="fc-dot">·</span>
          <span>3. File → Import (desktop) or tap the deck file on mobile</span>
        </div>
      </div>

      {/* Phase decks */}
      <div className="fc-section-label">By phase</div>
      <div className="fc-phase-grid">
        {PHASE_FILES.map((p) => (
          <div key={p.id} className="fc-phase-card">
            <div className="fc-phase-name">{p.label}</div>
            <AnkiLink href={`anki/${p.file}.apkg`} label="Download deck" />
          </div>
        ))}
      </div>

      {/* Per-week decks */}
      <div className="fc-section-label" style={{ marginTop: 24 }}>By week</div>
      {PHASES.map((phase) => (
        <div key={phase.id} className="fc-phase-block">
          <button
            className="fc-phase-toggle"
            onClick={() => setActivePhase(activePhase === phase.id ? null : phase.id)}
            style={{ borderLeftColor: phase.badgeColor }}
          >
            <span>
              <span className="badge" style={{ background: phase.badgeBg, color: phase.badgeColor }}>
                {phase.badgeLabel}
              </span>
              <span className="fc-phase-toggle-title">{phase.title}</span>
              <span className="fc-phase-toggle-book">{phase.book}</span>
            </span>
            <span className="fc-phase-chevron">
              {activePhase === phase.id ? '−' : '+'}
            </span>
          </button>

          {activePhase === phase.id && (
            <div className="fc-week-list">
              {phase.weeks.map((week) => {
                const n = String(week.n).padStart(2, '0');
                return (
                  <div key={week.n} className="fc-week-row">
                    <div className="fc-week-info">
                      <span className="fc-week-num">Week {week.n}</span>
                      <span className="fc-week-reading">{week.r}</span>
                      <span className="fc-week-date">{week.d}</span>
                    </div>
                    <div className="fc-week-preview">
                      {week.vocab.slice(0, 3).map(([it, en]) => (
                        <span key={it} className="fc-vocab-chip" title={en}>{it}</span>
                      ))}
                      <span className="fc-vocab-more">+{week.vocab.length - 3} more</span>
                    </div>
                    <a className="anki-dl-btn anki-dl-sm" href={`anki/week-${n}.apkg`} download>
                      <DownloadIcon />
                      {week.vocab.length} cards
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Card format note */}
      <div className="fc-note">
        <strong>Card format:</strong> Italian term on front. English translation + CEI 2008 example sentence + week reference on back.
        Each deck imports as a separate sub-deck so your existing Anki cards are not affected.
      </div>

      </>}
    </div>
  );
}
