import { useState, useRef, useEffect } from 'react';
import { TTS_LANG } from '../utils/locale';
import { getSpeechRecognition, hasSpeechRecognition } from '../utils/speech';
import { ROUNDS, countWords, summarizeRounds, sprintDelta } from '../utils/fluencySprint';
import { recordActivity } from '../utils/streak';

// Nation's 4/3/2 fluency sprint on the week's journal prompt: speak on the
// same topic three times — 60s, 45s, 30s. The shrinking limit forces faster
// retrieval of the *same* message, which is what automatizes production.
// Collapsible panel inside the week's journal editor; hidden entirely when
// speech recognition is unavailable.
export function FluencySprint({ week, onInsert }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | running | between | done
  const [roundIdx, setRoundIdx] = useState(0);
  const [transcripts, setTranscripts] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [liveWords, setLiveWords] = useState(0);
  const bufRef = useRef('');
  const recRef = useRef(null);
  const activeRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => () => {
    activeRef.current = false;
    clearInterval(timerRef.current);
    recRef.current?.stop();
  }, []);

  // Countdown reaching zero ends the round. endRound is stable per render and
  // only meaningful while running, so keying on secondsLeft/phase is enough.
  useEffect(() => {
    if (phase === 'running' && secondsLeft <= 0) endRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  if (!hasSpeechRecognition) return null;

  function startRound(idx) {
    const SR = getSpeechRecognition();
    bufRef.current = '';
    setLiveWords(0);
    setRoundIdx(idx);
    setSecondsLeft(ROUNDS[idx]);
    setPhase('running');

    const rec = new SR();
    rec.lang = TTS_LANG;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const text = e.results[i][0].transcript.trim();
          if (text) {
            bufRef.current = (bufRef.current + ' ' + text).trim();
            setLiveWords(countWords(bufRef.current));
          }
        }
      }
    };
    rec.onend = () => {
      // Chrome stops on silence; restart until the round timer says stop.
      if (activeRef.current) {
        try { rec.start(); } catch { /* round is ending anyway */ }
      }
    };
    rec.onerror = () => {};
    recRef.current = rec;
    activeRef.current = true;
    rec.start();

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSecondsLeft(s => s - 1), 1000);
  }

  function endRound() {
    clearInterval(timerRef.current);
    activeRef.current = false;
    recRef.current?.stop();
    const text = bufRef.current.trim();
    setTranscripts(ts => [...ts, text]);
    if (text) recordActivity('practiced');
    setPhase(roundIdx + 1 < ROUNDS.length ? 'between' : 'done');
  }

  function reset() {
    clearInterval(timerRef.current);
    activeRef.current = false;
    recRef.current?.stop();
    setTranscripts([]);
    setRoundIdx(0);
    setPhase('idle');
  }

  const summary = summarizeRounds(transcripts);
  const delta = sprintDelta(summary);
  const lastSpoken = [...transcripts].reverse().find(t => t.trim());

  return (
    <div className="sprint-panel">
      <button className="sprint-toggle" onClick={() => setOpen(v => !v)}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 1.5v2M8 5.5A4.5 4.5 0 103.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 10V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="sprint-title" title="Fluency sprint: speak on this week's prompt 3 times — 60s, 45s, 30s">
          Sprint 4/3/2 — parla, poi ripeti più veloce
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="sprint-body">
          {phase === 'idle' && (
            <>
              <div className="sprint-explain">
                Speak about the prompt above, out loud, three times: <strong>60s → 45s → 30s</strong>.
                Same message each round — the shrinking clock trains you to retrieve
                Italian faster instead of translating in your head.
              </div>
              <button className="sprint-go-btn" onClick={() => startRound(0)}>
                Round 1 — {ROUNDS[0]}s
              </button>
            </>
          )}

          {phase === 'running' && (
            <div className="sprint-live">
              <div className="sprint-clock">{secondsLeft}s</div>
              <div className="sprint-live-meta">
                Round {roundIdx + 1} / {ROUNDS.length} · <span className="sprint-live-dot" /> listening
                · {liveWords} word{liveWords !== 1 ? 's' : ''}
              </div>
              <button className="sprint-stop-btn" onClick={endRound}>Stop early</button>
            </div>
          )}

          {(phase === 'between' || phase === 'done') && (
            <>
              <table className="sprint-table">
                <thead>
                  <tr><th>Round</th><th>Time</th><th>Words</th><th>WPM</th></tr>
                </thead>
                <tbody>
                  {summary.map(r => (
                    <tr key={r.round}>
                      <td>{r.round}</td>
                      <td>{r.seconds}s</td>
                      <td>{r.words}</td>
                      <td>{r.wpm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {phase === 'between' && (
                <button className="sprint-go-btn" onClick={() => startRound(roundIdx + 1)}>
                  Round {roundIdx + 2} — {ROUNDS[roundIdx + 1]}s · same story, faster
                </button>
              )}

              {phase === 'done' && (
                <>
                  {delta !== null && (
                    <div className={`sprint-delta${delta >= 0 ? ' sprint-delta-up' : ''}`}>
                      {delta >= 0 ? `+${delta}% faster` : `${delta}% slower`} than round 1
                    </div>
                  )}
                  <div className="sprint-actions">
                    {lastSpoken && onInsert && (
                      <button className="sprint-insert-btn" onClick={() => onInsert(lastSpoken)}>
                        Insert transcript into journal
                      </button>
                    )}
                    <button className="sprint-stop-btn" onClick={reset}>Restart</button>
                  </div>
                </>
              )}
            </>
          )}

          {phase !== 'idle' && week?.prompt?.it && (
            <div className="sprint-prompt-echo">“{week.prompt.it}”</div>
          )}
        </div>
      )}
    </div>
  );
}
