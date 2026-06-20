import { useState, useMemo } from 'react';
import { PHASES } from '../data/studyData';
import { IPAGuide } from './IPAGuide';
import { SpeakerButton } from './SpeakerButton';
import { UiText } from '../i18n/UiText';
import { useSrs } from '../hooks/useSrs';
import { usePronunStats } from '../hooks/usePronunStats';
import { struggleList } from '../utils/wordStats';
import { makeCloze, isClozeEligible } from '../utils/cloze';
import { checkAnswer } from '../utils/answer';

const STYLES = [
  { id: 'recognition', label: 'Recognition', sub: 'IT → EN, tap to reveal' },
  { id: 'recall', label: 'Recall', sub: 'EN → IT, type it' },
  { id: 'cloze', label: 'Cloze', sub: 'fill the blank' },
  { id: 'listening', label: 'Listening', sub: 'hear it, type it' },
];

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
          <UiText k="prac.newSession" />
        </button>
      </div>
    </div>
  );
}

export function PracticeMode() {
  const [filter, setFilter] = useState('all');
  const [style, setStyle] = useState('recognition');
  const [session, setSession] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [listenRate, setListenRate] = useState(0.85);
  const { recordReview, buildSession, getStats, getStore, version } = useSrs();
  const { getStore: getPronunStore, version: pronunVersion } = usePronunStats();

  const filtered = useMemo(
    () => (filter === 'all' ? ALL_CARDS : ALL_CARDS.filter(c => c.phaseId === filter)),
    [filter]
  );

  // Cloze only works on cards whose example literally contains the term.
  const clozeCards = useMemo(() => filtered.filter(isClozeEligible), [filtered]);

  // Recompute when the filter changes or after a review. `version` looks unused
  // to the linter, but getStats/buildSession read the SRS store from a ref that
  // mutates on each review — version is what forces the recompute.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const srsStats = useMemo(() => getStats(filtered), [filtered, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dueQueue = useMemo(() => buildSession(filtered), [filtered, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clozeQueue = useMemo(() => buildSession(clozeCards), [clozeCards, version]);
  // Struggle list combines SRS lapses/ease with pronunciation scores.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const struggles = useMemo(() => struggleList(filtered, getStore(), getPronunStore()), [filtered, version, pronunVersion]);

  const activeQueue = style === 'cloze' ? clozeQueue : dueQueue;

  function resetCardUi() {
    setFlipped(false);
    setTyped('');
    setChecked(false);
    setCorrect(false);
  }

  function startSession(cards) {
    if (!cards.length) return;
    setSession({ cards, index: 0, known: 0, again: [], style });
    resetCardUi();
  }

  function handleCheck() {
    const card = session.cards[session.index];
    // Listening is dictation — reveal and self-grade, no auto-verdict.
    if (session.style !== 'listening') {
      const expected = session.style === 'cloze' ? makeCloze(card.it, card.ex).answer : card.it;
      setCorrect(checkAnswer(expected, typed));
    }
    setChecked(true);
  }

  function handleKnown() {
    recordReview(session.cards[session.index].it, 'good');
    setSession(s => ({ ...s, index: s.index + 1, known: s.known + 1 }));
    resetCardUi();
  }

  function handleAgain() {
    recordReview(session.cards[session.index].it, 'again');
    setSession(s => ({ ...s, index: s.index + 1, again: [...s.again, s.cards[s.index]] }));
    resetCardUi();
  }

  // Session complete
  if (session && session.index >= session.cards.length) {
    return (
      <SessionEnd
        known={session.known}
        total={session.cards.length}
        againCount={session.again.length}
        onRestart={() => setSession(null)}
        onDrillAgain={() => startSession(shuffle(session.again))}
      />
    );
  }

  // Active card
  if (session) {
    const card = session.cards[session.index];
    const total = session.cards.length;
    const pct = (session.index / total) * 100;
    const isTyped = session.style !== 'recognition';
    const cloze = session.style === 'cloze' ? makeCloze(card.it, card.ex) : null;
    const showGrade = isTyped ? checked : flipped;

    return (
      <div className="prac-session">
        <div className="prac-top-row">
          <span className="prac-counter">{session.index + 1} / {total}</span>
          <button className="prac-exit-btn" onClick={() => setSession(null)}><UiText k="prac.exit" /></button>
        </div>

        <div className="prac-bar-bg">
          <div className="prac-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        {isTyped ? (
          <div className="prac-typed-card">
            {session.style === 'listening' ? (
              <div className="prac-listen-prompt">
                <SpeakerButton word={card.ex} size={30} rate={listenRate} />
                <div className="prac-listen-speeds">
                  <button
                    className={`prac-speed-btn${listenRate === 0.6 ? ' active' : ''}`}
                    onClick={() => setListenRate(0.6)}
                  >Slow</button>
                  <button
                    className={`prac-speed-btn${listenRate === 0.85 ? ' active' : ''}`}
                    onClick={() => setListenRate(0.85)}
                  >Normal</button>
                </div>
              </div>
            ) : session.style === 'cloze' ? (
              <div className="prac-cloze-sentence">
                {cloze.before}
                <span className="prac-blank">{checked ? cloze.answer : '____'}</span>
                {cloze.after}
              </div>
            ) : (
              <div className="prac-recall-prompt">{card.en}</div>
            )}
            <div className="prac-typed-sub">
              {session.style === 'listening' ? 'Listen and type what you hear'
                : session.style === 'cloze' ? `Fill the blank — ${card.en}`
                : 'Type the Italian'}
            </div>
            <input
              className={`prac-input${checked && session.style !== 'listening' ? (correct ? ' prac-input-correct' : ' prac-input-wrong') : ''}`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !checked && typed.trim()) handleCheck(); }}
              placeholder="Scrivi qui…"
              autoFocus
              disabled={checked}
              aria-label="Your answer"
            />
            {checked && (
              <div className="prac-typed-result">
                {session.style !== 'listening' && (
                  <span className={correct ? 'prac-result-ok' : 'prac-result-no'}>
                    {correct ? 'Correct!' : 'Not quite'}
                  </span>
                )}
                {session.style === 'listening' ? (
                  <>
                    <span className="prac-answer prac-answer-sentence">{card.ex}</span>
                    <span className="prac-translation">{card.en}</span>
                    <SpeakerButton word={card.ex} size={18} rate={listenRate} />
                  </>
                ) : (
                  <>
                    <span className="prac-answer">{card.it}</span>
                    {card.ipa && <span className="prac-ipa">{card.ipa}</span>}
                    <SpeakerButton word={card.it} size={18} />
                    {session.style === 'recall' && <span className="prac-example">"{card.ex}"</span>}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`prac-scene`}
            onClick={() => !flipped && setFlipped(true)}
            role="button"
            aria-label={flipped ? 'Card revealed' : 'Tap to reveal'}
          >
            <div className={`prac-card${flipped ? ' prac-flipped' : ''}`}>
              <div className="prac-face prac-front">
                <span className="prac-word">{card.it}</span>
                <SpeakerButton word={card.it} size={22} />
                <span className="prac-tap-hint"><UiText k="prac.tapHint" /></span>
              </div>
              <div className="prac-face prac-back">
                <span className="prac-translation">{card.en}</span>
                <span className="prac-ipa">{card.ipa}</span>
                <SpeakerButton word={card.it} size={18} />
                <span className="prac-example">"{card.ex}"</span>
              </div>
            </div>
          </div>
        )}

        <div className="prac-card-meta">Week {card.weekN} · {card.reading}</div>

        {showGrade ? (
          <div className="prac-actions">
            <button className="prac-again-btn" onClick={handleAgain}><UiText k="prac.again" /></button>
            <button className="prac-known-btn" onClick={handleKnown}><UiText k="prac.known" /></button>
          </div>
        ) : (
          <div className="prac-actions">
            {isTyped ? (
              <button
                className="prac-reveal-btn"
                onClick={handleCheck}
                disabled={session.style !== 'listening' && !typed.trim()}
              >
                {session.style === 'listening' ? 'Reveal' : 'Check'}
              </button>
            ) : (
              <button className="prac-reveal-btn" onClick={() => setFlipped(true)}><UiText k="prac.reveal" /></button>
            )}
          </div>
        )}

        <IPAKeyPanel />
      </div>
    );
  }

  // Filter / start screen
  return (
    <div className="prac-start-screen">
      <div className="prac-intro-card">
        <div className="prac-intro-title">Built-in flashcards · spaced repetition</div>
        <div className="prac-intro-body">
          Practice vocabulary in your browser — no Anki needed. Each session
          serves the words you're <strong>due</strong> to review (the scheduler
          spaces them further apart as you get them right, and brings them back
          sooner when you don't), plus a few new ones. Progress is saved on this
          device.
        </div>
      </div>

      <div className="prac-filter-label">Practice style</div>
      <div className="prac-style-grid">
        {STYLES.map(s => {
          const disabled = s.id === 'cloze' && clozeCards.length === 0;
          return (
            <button
              key={s.id}
              className={`prac-style-btn${style === s.id ? ' prac-style-active' : ''}`}
              onClick={() => setStyle(s.id)}
              disabled={disabled}
              title={disabled ? 'No cloze-eligible cards in this selection' : undefined}
            >
              <span className="prac-style-name">{s.label}</span>
              <span className="prac-style-sub">{s.sub}</span>
            </button>
          );
        })}
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

      <div className="prac-srs-stats">
        <span className="prac-srs-stat prac-srs-due">{srsStats.due} due</span>
        <span className="prac-srs-stat prac-srs-new">{srsStats.new} new</span>
        <span className="prac-srs-stat prac-srs-learned">{srsStats.learned} learned</span>
      </div>

      {activeQueue.length > 0 ? (
        <button className="prac-go-btn" onClick={() => startSession(activeQueue)}>
          Start — {activeQueue.length} card{activeQueue.length !== 1 ? 's' : ''}
        </button>
      ) : (
        <div className="prac-caught-up">
          <div className="prac-caught-up-msg">
            All caught up — nothing due right now. Come back later, or:
          </div>
          <button
            className="prac-go-btn prac-go-secondary"
            onClick={() => startSession(shuffle(style === 'cloze' ? clozeCards : filtered))}
          >
            Practice all {(style === 'cloze' ? clozeCards : filtered).length} anyway
          </button>
        </div>
      )}

      <StrugglePanel
        struggles={struggles}
        onDrill={() => {
          const cards = struggles.map(s => s.card);
          startSession(shuffle(style === 'cloze' ? cards.filter(isClozeEligible) : cards));
        }}
      />

      <IPAKeyPanel />
    </div>
  );
}

function StrugglePanel({ struggles, onDrill }) {
  const [open, setOpen] = useState(false);
  if (!struggles.length) return null;
  return (
    <div className="prac-struggle-panel">
      <button className="prac-struggle-toggle" onClick={() => setOpen(v => !v)}>
        <span className="prac-struggle-title">
          Parole difficili — {struggles.length} word{struggles.length !== 1 ? 's' : ''} you struggle with
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="prac-struggle-body">
          <ul className="prac-struggle-list">
            {struggles.map(({ card, reasons }) => (
              <li key={card.it} className="prac-struggle-item">
                <span className="prac-struggle-word">{card.it}</span>
                <span className="prac-struggle-en">{card.en}</span>
                {reasons.length > 0 && (
                  <span className="prac-struggle-reason">{reasons.join(' · ')}</span>
                )}
              </li>
            ))}
          </ul>
          <button className="prac-go-btn prac-struggle-drill" onClick={onDrill}>
            Drill these {struggles.length}
          </button>
        </div>
      )}
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
