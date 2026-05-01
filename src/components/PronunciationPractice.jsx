import { useState, useRef, useMemo } from 'react';
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

function normalize(s) {
  return s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1).fill(0);
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function scorePronunciation(target, recognized) {
  const t = normalize(target);
  const r = normalize(recognized);
  const dist = levenshtein(t, r);
  return Math.round((1 - dist / Math.max(t.length, r.length, 1)) * 100);
}

function getScoreInfo(score) {
  if (score >= 85) return { label: 'Ottimo!', cls: 'pronun-score-great' };
  if (score >= 60) return { label: 'Bene!', cls: 'pronun-score-good' };
  return { label: 'Riprova', cls: 'pronun-score-low' };
}

const hasSpeechRecognition = !!(
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)
);

function MicButton({ state, onClick }) {
  return (
    <button
      className={`pronun-mic-btn pronun-mic-${state}`}
      onClick={onClick}
      disabled={state === 'processing'}
      aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
        <path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span>
        {state === 'recording' ? 'Listening… (tap to stop)' : state === 'processing' ? 'Processing…' : 'Tap to speak'}
      </span>
    </button>
  );
}

function IPAKeyPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="prac-ipa-panel">
      <button className="prac-ipa-toggle" onClick={() => setOpen(v => !v)}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Pronunciation key — what do those symbols mean?
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <IPAGuide compact />}
    </div>
  );
}

export function PronunciationPractice() {
  const [filter, setFilter] = useState('all');
  const [session, setSession] = useState(null);
  const [micState, setMicState] = useState('idle'); // idle | recording | processing
  const [result, setResult] = useState(null); // { recognized, score } | { error }
  const recRef = useRef(null);

  const filtered = useMemo(
    () => (filter === 'all' ? ALL_CARDS : ALL_CARDS.filter(c => c.phaseId === filter)),
    [filter]
  );

  if (!hasSpeechRecognition) {
    return (
      <div className="pronun-unsupported">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--text-faint)' }}>
          <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="pronun-unsupported-title">Microphone not available</div>
        <div className="pronun-unsupported-body">
          Speech recognition requires Chrome or Edge on desktop, or Safari on iOS 14.5+.
          Try opening this app in one of those browsers to use pronunciation practice.
        </div>
      </div>
    );
  }

  function startSession(cards) {
    setSession({ cards: shuffle(cards), index: 0, scores: [] });
    setResult(null);
    setMicState('idle');
  }

  function handleMic() {
    if (micState === 'recording') {
      recRef.current?.stop();
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'it-IT';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    recRef.current = rec;

    setMicState('recording');
    setResult(null);

    rec.onresult = (e) => {
      setMicState('processing');
      const card = session.cards[session.index];
      // Try all alternatives, keep the best-scoring one
      let best = { recognized: '', score: 0 };
      for (let i = 0; i < e.results[0].length; i++) {
        const text = e.results[0][i].transcript;
        const score = scorePronunciation(card.it, text);
        if (score > best.score) best = { recognized: text, score };
      }
      setResult(best);
      setMicState('idle');
    };

    rec.onerror = (e) => {
      if (e.error !== 'aborted') {
        setResult({ recognized: '', score: 0, error: e.error });
      }
      setMicState('idle');
    };

    rec.onend = () => {
      setMicState(s => (s === 'recording' ? 'idle' : s));
    };

    rec.start();
  }

  function handleNext() {
    if (!result) return;
    const card = session.cards[session.index];
    const newScores = [...session.scores, { card, ...result }];
    setSession(s => ({ ...s, index: s.index + 1, scores: newScores }));
    setResult(null);
    setMicState('idle');
  }

  function handleRetry() {
    setResult(null);
    setMicState('idle');
  }

  // Session complete
  if (session && session.index >= session.cards.length) {
    const { scores } = session;
    const avg = scores.length
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
      : 0;
    const excellent = scores.filter(s => s.score >= 85).length;
    const good = scores.filter(s => s.score >= 60 && s.score < 85).length;
    const needsWork = scores.filter(s => s.score < 60);

    return (
      <div className="prac-end">
        <div className="prac-end-score">{avg}%</div>
        <div className="prac-end-label">Average pronunciation score</div>
        <div className="pronun-end-breakdown">
          <span className="pronun-breakdown-item pronun-breakdown-great">✓ {excellent} excellent</span>
          <span className="pronun-breakdown-item pronun-breakdown-good">~ {good} good</span>
          <span className="pronun-breakdown-item pronun-breakdown-low">↺ {needsWork.length} needs work</span>
        </div>
        <div className="prac-end-actions">
          {needsWork.length > 0 && (
            <button className="prac-drill-btn" onClick={() => startSession(needsWork.map(s => s.card))}>
              Drill {needsWork.length} again
            </button>
          )}
          <button className="prac-restart-btn" onClick={() => setSession(null)}>New session</button>
        </div>
      </div>
    );
  }

  // Active session
  if (session) {
    const card = session.cards[session.index];
    const total = session.cards.length;
    const pct = (session.index / total) * 100;
    const scoreInfo = result && !result.error ? getScoreInfo(result.score) : null;

    return (
      <div className="prac-session">
        <div className="prac-top-row">
          <span className="prac-counter">{session.index + 1} / {total}</span>
          <button className="prac-exit-btn" onClick={() => { recRef.current?.stop(); setSession(null); }}>
            Exit
          </button>
        </div>

        <div className="prac-bar-bg">
          <div className="prac-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="pronun-card">
          <span className="pronun-word">{card.it}</span>
          <span className="pronun-ipa">{card.ipa}</span>
          <span className="pronun-translation">{card.en}</span>
        </div>

        <div className="pronun-mic-area">
          <MicButton state={micState} onClick={handleMic} />
        </div>

        {result && (
          <div className="pronun-result">
            {result.error ? (
              <div className="pronun-recognized-error">
                Could not hear clearly — check your microphone and try again.
              </div>
            ) : (
              <>
                <div className={`pronun-score-badge ${scoreInfo.cls}`}>
                  {result.score}% — {scoreInfo.label}
                </div>
                <div className="pronun-recognized">
                  <span className="pronun-recognized-label">Heard:</span>
                  <span className="pronun-recognized-text">"{result.recognized}"</span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="prac-card-meta">Week {card.weekN} · {card.reading}</div>

        {result && (
          <div className="prac-actions">
            <button className="prac-again-btn" onClick={handleRetry}>Try again</button>
            <button className="prac-known-btn" onClick={handleNext}>
              {session.index + 1 < total ? 'Next →' : 'Finish'}
            </button>
          </div>
        )}

        <IPAKeyPanel />
      </div>
    );
  }

  // Start screen
  return (
    <div className="prac-start-screen">
      <div className="prac-intro-card">
        <div className="prac-intro-title">Pronunciation practice</div>
        <div className="prac-intro-body">
          Say each Italian word aloud into your microphone. The app listens using
          your browser's built-in Italian speech recognition and scores how closely
          your pronunciation matches. Scores above 85% are excellent.
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
