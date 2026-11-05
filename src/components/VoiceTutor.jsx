import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WordGloss } from './WordGloss';
import { buildLesson, createTutor, next, snapshot } from '../utils/tutorEngine';
import { useTutorVoice } from '../hooks/useTutorVoice';
import { useAudioSpeed } from '../hooks/useAudioSpeed';
import { getSpeechRecognition } from '../utils/speech';
import { loadTutor, resumeFor, saveResume, recordLesson } from '../utils/tutorStore';
import { applyLessonToReview } from '../utils/verseReview';
import { recordActivity } from '../utils/streak';

const SLOW_RATE = 0.6;

const STEP_LABEL = {
  intro: 'Getting started',
  listen: 'Listen',
  repeat: 'Repeat after me',
  focus: 'Tricky words',
  ask: 'Answer aloud',
  recall: 'Say the missing word',
  recap: 'Finishing up',
};

function StepContent({ state, step }) {
  const activeLine = state.queue[0]?.line;
  switch (step.kind) {
    case 'listen':
      return (
        <div className="tutor-lines">
          {step.lines.map((line, i) => (
            <div key={i} className={`tutor-line${activeLine === i ? ' tutor-line-active' : ''}`}>
              <WordGloss text={line.t} />
            </div>
          ))}
        </div>
      );
    case 'repeat':
      return (
        <div className="tutor-target">
          <WordGloss text={step.text} />
          {step.en && <div className="tutor-en">{step.en}</div>}
        </div>
      );
    case 'focus':
      return <div className="tutor-target tutor-target-word"><WordGloss text={state.focusWords[state.sub] ?? ''} /></div>;
    case 'ask':
      return <div className="tutor-target"><WordGloss text={step.q} /></div>;
    case 'recall':
      return (
        <div className="tutor-target">
          {state.stepOk === null
            ? <>{step.before} <span className="tutor-blank" aria-label="missing word">_____</span> {step.after}</>
            : <WordGloss text={step.full} />}
          {step.en && <div className="tutor-en">{step.en}</div>}
        </div>
      );
    default:
      return null;
  }
}

function Feedback({ feedback, onOverride }) {
  if (!feedback) return null;
  const title = feedback.tone === 'ok' ? 'Bene!' : feedback.tone === 'silent' ? 'Non ho sentito' : 'Quasi…';
  return (
    <div className={`tutor-feedback tutor-feedback-${feedback.tone}`}>
      <strong>{title}</strong>
      {feedback.heard && <span className="tutor-heard">Heard: “{feedback.heard}”</span>}
      {feedback.tone !== 'ok' && feedback.heard && (
        <button type="button" className="qa-override" onClick={onOverride}>I said it right</button>
      )}
    </div>
  );
}

function TypedAnswer({ onSubmit }) {
  const [text, setText] = useState('');
  return (
    <form
      className="tutor-typed"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text);
        setText('');
      }}
    >
      <input
        className="xform-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type it in Italian…"
        aria-label="Your answer"
        autoFocus
      />
      <button type="submit" className="tutor-btn tutor-btn-primary">Check</button>
    </form>
  );
}

// "Lezione guidata": a hands-free spoken lesson on one week's reading. All the
// teaching logic lives in tutorEngine; this component only carries out its effects
// and reports back. A token marks the current speech turn, so a callback from a turn
// that was cancelled can never drive the lesson.
export function VoiceTutor({ week, compact = false }) {
  const lesson = useMemo(() => buildLesson(week), [week]);
  const [state, setState] = useState(null);
  const [summary, setSummary] = useState(null);
  const [record, setRecord] = useState(() => loadTutor().weeks[week.n] ?? null);
  const [resume, setResume] = useState(() => resumeFor(week.n));
  const stateRef = useRef(null);
  const tokenRef = useRef(0);
  const wakeRef = useRef(null);
  const { rate: normalRate } = useAudioSpeed();
  const dispatchRef = useRef(null);

  const voice = useTutorVoice({
    onPreempted: () => dispatchRef.current?.({ type: 'command', command: 'stop' }),
  });

  const releaseWake = () => {
    wakeRef.current?.release?.().catch?.(() => {});
    wakeRef.current = null;
  };

  const finishLesson = useCallback((result) => {
    releaseWake();
    applyLessonToReview(result);
    if (result.total > 0) recordActivity('practiced');
    if (result.completed) {
      recordLesson(result);
      setRecord(loadTutor().weeks[result.weekN] ?? null);
      setResume(null);
      setSummary(result);
      setState(null);
      stateRef.current = null;
    } else {
      setResume(resumeFor(result.weekN));
      setState(null);
      stateRef.current = null;
    }
  }, []);

  const dispatch = useCallback((event) => {
    const prev = stateRef.current;
    if (!prev) return;
    const { state: nextState, effects } = next(prev, event);
    stateRef.current = nextState;
    setState(nextState);
    if (nextState.phase !== 'done' && nextState.i !== prev.i) {
      saveResume(nextState.lesson.weekN, snapshot(nextState));
    }
    for (const effect of effects) {
      if (effect.type === 'cancel') {
        tokenRef.current += 1;
        voice.cancel();
      } else if (effect.type === 'speak') {
        const token = ++tokenRef.current;
        const rate = effect.utterance.rate === 'slow' ? Math.min(SLOW_RATE, normalRate) : normalRate;
        voice.speak(effect.utterance.text, rate).then((r) => {
          if (r && token === tokenRef.current) dispatchRef.current?.({ type: 'spoken' });
        });
      } else if (effect.type === 'listen') {
        const token = ++tokenRef.current;
        voice.listen().then((r) => {
          if (r && token === tokenRef.current) dispatchRef.current?.(r);
        });
      } else if (effect.type === 'finish') {
        finishLesson(effect.summary);
      }
    }
  }, [voice, normalRate, finishLesson]);

  useEffect(() => { dispatchRef.current = dispatch; }, [dispatch]);

  const active = !!state;

  // A hidden page can't speak or listen reliably, so hold the lesson on its current
  // step until the learner comes back and taps Resume.
  useEffect(() => {
    if (!active) return undefined;
    const onChange = () => { if (document.hidden) dispatchRef.current?.({ type: 'pause' }); };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, [active]);

  useEffect(() => releaseWake, []);

  if (!lesson.steps.length) return null;

  // Runs inside the tap, because iOS Safari only allows the first speech from a gesture.
  function begin(fromResume) {
    const snap = fromResume && resume && resume.i < lesson.steps.length ? resume : null;
    voice.claim();
    setSummary(null);
    const initial = createTutor(lesson, { typing: !getSpeechRecognition(), resume: snap });
    stateRef.current = initial;
    setState(initial);
    // A hands-free lesson shouldn't end because the phone's screen went to sleep.
    navigator.wakeLock?.request?.('screen').then((lock) => { wakeRef.current = lock; }).catch(() => {});
    dispatch({ type: 'start' });
  }

  if (!state) {
    return (
      <div className={`tutor-card${compact ? ' tutor-card-compact' : ''}`}>
        <div className="tutor-card-text">
          <span className="tutor-title">Lezione guidata</span>
          <span className="tutor-sub">
            A spoken lesson on this week's passage, about 5–8 minutes
            {record ? ` · best ${record.best}%` : ''}
          </span>
          {summary && (
            <div className="tutor-summary" role="status">
              <strong>Lesson finished: {summary.ok} of {summary.total} correct ({summary.score}%).</strong>
              {summary.missed.length > 0 && (
                <span> {summary.missed.join(', ')} will come back in verse review.</span>
              )}
            </div>
          )}
        </div>
        <div className="tutor-card-actions">
          {resume && <button className="tutor-btn tutor-btn-primary" onClick={() => begin(true)}>Resume lesson</button>}
          <button className={`tutor-btn${resume ? '' : ' tutor-btn-primary'}`} onClick={() => begin(false)}>
            {resume ? 'Start over' : summary || record ? 'Start again' : 'Start lesson'}
          </button>
        </div>
      </div>
    );
  }

  const step = state.lesson.steps[state.i];
  const caption = state.queue[0];
  const interactive = ['repeat', 'focus', 'ask', 'recall'].includes(step?.kind);
  const paused = state.phase === 'paused';
  const send = (command) => dispatch({ type: 'command', command });

  return (
    <div className="tutor-panel" role="region" aria-label="Voice lesson">
      <div className="tutor-progress" aria-hidden="true">
        <div className="tutor-progress-fill" style={{ width: `${Math.round((state.i / state.lesson.steps.length) * 100)}%` }} />
      </div>
      <div className="tutor-head">
        <span className="tutor-step">{STEP_LABEL[step?.kind] ?? ''}</span>
        <span className="tutor-status" role="status">
          {state.phase === 'listening' && <><span className="qa-live-dot" /> Your turn, speak now</>}
          {state.phase === 'speaking' && 'Tutor speaking…'}
          {state.phase === 'typing' && 'Your turn, type your answer'}
          {paused && (state.pausedReason === 'silent' ? "Paused, I couldn't hear you" : 'Paused')}
        </span>
      </div>

      {step && <StepContent state={state} step={step} />}

      {caption && caption.en !== undefined && step?.kind !== 'listen' && (
        <div className="tutor-caption">
          {caption.text}
          {caption.en && caption.en !== step?.en && <span className="tutor-caption-en"> ({caption.en})</span>}
        </div>
      )}

      <Feedback feedback={state.feedback} onOverride={() => dispatch({ type: 'override' })} />

      {state.phase === 'typing' && <TypedAnswer onSubmit={(text) => dispatch({ type: 'typed', text })} />}

      <div className="tutor-controls">
        {paused ? (
          <button className="tutor-btn tutor-btn-primary" onClick={() => dispatch({ type: 'resume' })}>Resume</button>
        ) : (
          <button className="tutor-btn" onClick={() => dispatch({ type: 'pause' })}>Pause</button>
        )}
        <button className="tutor-btn" disabled={paused} onClick={() => send('repeat')}>Repeat</button>
        <button className="tutor-btn" disabled={paused || state.slow} onClick={() => send('slower')}>
          {state.slow ? 'Slow' : 'Slower'}
        </button>
        <button className="tutor-btn" disabled={paused} onClick={() => send('skip')}>Skip</button>
        <button className="tutor-btn" onClick={() => send('stop')}>Stop</button>
        {interactive && getSpeechRecognition() && (
          <button className="tutor-btn" onClick={() => dispatch({ type: 'setTyping', on: !state.typing })}>
            {state.typing ? 'Use mic' : 'Type instead'}
          </button>
        )}
      </div>

      {!state.typing && (
        <div className="tutor-hint">
          You can also say <em>ripeti</em>, <em>più lentamente</em>, <em>avanti</em> or <em>basta</em>.
        </div>
      )}
      {state.typing && !getSpeechRecognition() && (
        <div className="tutor-hint">This browser can't listen, so you can type your answers instead.</div>
      )}
    </div>
  );
}
