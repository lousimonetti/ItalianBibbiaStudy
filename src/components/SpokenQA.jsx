import { useState, useRef, useEffect } from 'react';
import { questionItems, matchesSpoken, ANSWER_SECONDS } from '../utils/spokenAnswer';
import { getSpeechRecognition, hasSpeechRecognition } from '../utils/speech';
import { TTS_LANG } from '../utils/locale';
import { SpeakerButton } from './SpeakerButton';
import { recordActivity } from '../utils/streak';

// "Rispondi subito" (plan-speaking.md S3): the app asks a question about the
// week's reading aloud and the learner answers ALOUD within a few seconds —
// retrieval speed under pressure is the operational definition of fluency.
// Placed per-week (not in PronunciationPractice) because the questions are
// anchored to this week's passage. Collapsible; hidden when the week has no
// questions or the browser has no speech recognition.
function QARow({ item }) {
  const [phase, setPhase] = useState('idle'); // idle | listening | done
  const [secondsLeft, setSecondsLeft] = useState(ANSWER_SECONDS);
  const [heard, setHeard] = useState('');
  const [ok, setOk] = useState(false);
  const [override, setOverride] = useState(false);
  const recRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    recRef.current?.stop();
  }, []);

  useEffect(() => {
    if (phase === 'listening' && secondsLeft <= 0) stop();
  }, [secondsLeft, phase]);

  function stop() {
    clearInterval(timerRef.current);
    recRef.current?.stop();
  }

  function listen() {
    const SR = getSpeechRecognition();
    const rec = new SR();
    rec.lang = TTS_LANG;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      let best = '';
      let bestOk = false;
      for (let i = 0; i < e.results[0].length; i++) {
        const text = e.results[0][i].transcript;
        if (!best) best = text;
        if (matchesSpoken(item, text)) { best = text; bestOk = true; break; }
      }
      setHeard(best);
      setOk(bestOk);
      setPhase('done');
      recordActivity('practiced');
    };
    rec.onerror = () => { setPhase('done'); setHeard(''); };
    rec.onend = () => { clearInterval(timerRef.current); };
    recRef.current = rec;
    setHeard('');
    setOverride(false);
    setSecondsLeft(ANSWER_SECONDS);
    setPhase('listening');
    rec.start();
    timerRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
  }

  function reset() {
    setPhase('idle');
    setHeard('');
    setOk(false);
    setOverride(false);
  }

  const correct = ok || override;

  return (
    <div className="qa-row">
      <div className="qa-question">
        <span>{item.q}</span>
        <SpeakerButton word={item.q} size={14} />
      </div>

      {phase === 'idle' && (
        <button className="drill-btn" onClick={listen}>
          Answer aloud ({ANSWER_SECONDS}s)
        </button>
      )}

      {phase === 'listening' && (
        <div className="qa-listening">
          <span className="qa-clock">{secondsLeft}s</span>
          <span className="qa-live-dot" /> listening…
          <button className="drill-btn drill-btn-retry" onClick={stop}>Done</button>
        </div>
      )}

      {phase === 'done' && (
        <div className="qa-result">
          <span className={correct ? 'drill-verdict-ok' : 'drill-verdict-no'}>
            {correct ? 'Bene!' : heard ? 'Hmm' : 'Non ho sentito'}
          </span>
          {heard && <span className="qa-heard">Heard: “{heard}”</span>}
          <span className="qa-model">
            {item.model || item.answers[0]}
            <SpeakerButton word={item.model || item.answers[0]} size={13} />
          </span>
          {!ok && (
            <button className="qa-override" onClick={() => setOverride(true)} disabled={override}>
              {override ? 'Counted ✓' : 'I said it right'}
            </button>
          )}
          <button className="drill-btn drill-btn-retry" onClick={reset}>Again</button>
        </div>
      )}
    </div>
  );
}

export function SpokenQA({ week }) {
  const [open, setOpen] = useState(false);
  const items = questionItems(week);
  if (!items.length || !hasSpeechRecognition) return null;

  return (
    <div className="drill-panel">
      <button className="drill-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="drill-toggle-title">
          Rispondi subito — {items.length} question{items.length !== 1 ? 's' : ''} · answer aloud, fast
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="drill-body">
          <div className="drill-intro">
            Hear each question, then speak your answer within {ANSWER_SECONDS} seconds —
            don't translate from English, just answer.
          </div>
          {items.map((item, i) => <QARow key={i} item={item} />)}
        </div>
      )}
    </div>
  );
}
