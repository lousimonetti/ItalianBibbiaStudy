import { useCallback, useEffect, useRef, useState } from 'react';
import { WordGloss } from './WordGloss';
import { useTutorVoice } from '../hooks/useTutorVoice';
import { useAudioSpeed } from '../hooks/useAudioSpeed';
import { getSpeechRecognition } from '../utils/speech';
import { createConversa, next, STREAK_TURNS } from '../utils/conversaEngine';
import { conversaSystem, translatePrompt } from '../utils/tutorPrompts';
import { streamChat, warmUp } from '../utils/ollamaClient';
import { localSpeechAvailable } from '../utils/tutorAI';
import { recordActivity } from '../utils/streak';
import { TTS_LANG } from '../utils/locale';

const SLOW_RATE = 0.6;

const ERROR_HELP = {
  connect: "Couldn't reach Ollama. Check that it's running and allows this site.",
  model: "Ollama doesn't have that model. Pick another in Local AI settings.",
  timeout: 'Ollama took too long to answer.',
  server: 'Ollama had a problem answering.',
};

// One tutor reply, with its English fetched only when asked for.
function TutorTurn({ text, model }) {
  const [en, setEn] = useState('');
  const [status, setStatus] = useState('idle');
  const abortRef = useRef(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const translate = async () => {
    abortRef.current = new AbortController();
    setStatus('loading');
    setEn('');
    try {
      await streamChat({
        model,
        ...translatePrompt(text),
        signal: abortRef.current.signal,
        onDelta: (piece) => setEn((so) => so + piece),
      });
      setStatus('done');
    } catch (e) {
      if (e?.name !== 'AbortError') setStatus('failed');
    }
  };

  return (
    <div className="conversa-turn">
      <WordGloss text={text} />{' '}
      {status === 'idle' && <button type="button" className="qa-override" onClick={translate}>In English</button>}
      {status === 'failed' && <button type="button" className="qa-override" onClick={translate}>Try again</button>}
      {(status === 'loading' || status === 'done') && <div className="conversa-en">{en || '…'}</div>}
    </div>
  );
}

function TypedTurn({ onSubmit }) {
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
        placeholder="Type in Italian…"
        aria-label="Your reply"
        autoFocus
      />
      <button type="submit" className="tutor-btn tutor-btn-primary">Send</button>
    </form>
  );
}

// "Conversa": a free spoken conversation about the week's passage, with replies from a
// model running on this computer. The conversation logic lives in conversaEngine; this
// carries out its effects and reports back. Nothing here touches a score or review, and
// the conversation disappears when it closes.
export function Conversa({ week, model, missedWords = [], onClose }) {
  const [state, setState] = useState(null);
  const [finished, setFinished] = useState(null);
  const [errorKind, setErrorKind] = useState(null);
  const [localSpeech, setLocalSpeech] = useState(false);
  const stateRef = useRef(null);
  const tokenRef = useRef(0);
  const abortRef = useRef(null);
  const dispatchRef = useRef(null);
  const localRef = useRef(false);
  const { rate: normalRate } = useAudioSpeed();
  // A key rather than the array, so a fresh but equal array doesn't restart the conversation.
  const hardKey = missedWords.join('\n');

  const voice = useTutorVoice({
    onPreempted: () => dispatchRef.current?.({ type: 'command', command: 'stop' }),
  });
  const voiceRef = useRef(voice);

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const dispatch = useCallback((event) => {
    const prev = stateRef.current;
    if (!prev) return;
    const { state: nextState, effects } = next(prev, event);
    stateRef.current = nextState;
    setState(nextState);
    for (const effect of effects) {
      if (effect.type === 'cancel') {
        tokenRef.current += 1;
        voice.cancel();
        stopGenerating();
      } else if (effect.type === 'speak') {
        const token = ++tokenRef.current;
        const rate = effect.utterance.rate === 'slow' ? Math.min(SLOW_RATE, normalRate) : normalRate;
        voice.speak(effect.utterance.text, rate).then((r) => {
          if (r && token === tokenRef.current) dispatchRef.current?.({ type: 'spoken' });
        });
      } else if (effect.type === 'listen') {
        const token = ++tokenRef.current;
        voice.listen({ local: localRef.current }).then((r) => {
          if (r && token === tokenRef.current) dispatchRef.current?.(r);
        });
      } else if (effect.type === 'generate') {
        stopGenerating();
        const controller = new AbortController();
        abortRef.current = controller;
        setErrorKind(null);
        const { id } = effect;
        streamChat({
          model,
          system: effect.system,
          messages: effect.messages,
          signal: controller.signal,
          onDelta: (text) => dispatchRef.current?.({ type: 'delta', id, text }),
        }).then(
          () => dispatchRef.current?.({ type: 'generated', id }),
          (e) => {
            if (e?.name === 'AbortError') return;
            setErrorKind(e?.kind ?? 'server');
            dispatchRef.current?.({ type: 'failed', id, reason: 'error' });
          },
        );
      } else if (effect.type === 'finish') {
        stopGenerating();
        if (effect.summary.turns >= STREAK_TURNS) recordActivity('practiced');
        setFinished(effect.summary);
      }
    }
  }, [voice, normalRate, model, stopGenerating]);

  useEffect(() => { dispatchRef.current = dispatch; }, [dispatch]);

  useEffect(() => { voiceRef.current = voice; }, [voice]);

  // Starts the conversation, and fully stops it on cleanup, so a remount starts afresh.
  // React's StrictMode mounts twice in development: a start-once guard left the second
  // mount waiting forever on an opening line the first mount's cleanup had cancelled.
  useEffect(() => {
    const words = hardKey ? hardKey.split('\n') : [];
    let live = true;
    voiceRef.current.claim();
    const initial = createConversa(week, { typing: !getSpeechRecognition(), missedWords: words });
    stateRef.current = initial;
    setState(initial);
    setFinished(null);
    dispatchRef.current?.({ type: 'start' });
    // The authored opening line plays while the model loads, so the wait goes unnoticed.
    warmUp({ model, system: conversaSystem(week, { missedWords: words }) });
    localSpeechAvailable(getSpeechRecognition(), TTS_LANG).then((ok) => {
      if (!live) return;
      localRef.current = ok;
      setLocalSpeech(ok);
    });
    return () => {
      live = false;
      tokenRef.current += 1;
      voiceRef.current.cancel();
      stopGenerating();
      stateRef.current = null;
    };
  }, [week, model, hardKey, stopGenerating]);

  useEffect(() => {
    const onChange = () => { if (document.hidden) dispatchRef.current?.({ type: 'pause' }); };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  if (!state) return null;

  if (finished) {
    return (
      <div className="tutor-panel" role="region" aria-label="Conversation">
        <div className="tutor-summary" role="status">
          <strong>
            Conversation finished: you took {finished.turns} {finished.turns === 1 ? 'turn' : 'turns'}.
          </strong>{' '}
          It wasn't graded or saved.
        </div>
        <div className="tutor-controls">
          <button className="tutor-btn tutor-btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    );
  }

  const send = (command) => dispatch({ type: 'command', command });
  const paused = state.phase === 'paused';
  const failed = state.phase === 'failed';
  const liveReply = [...state.reply, state.buffer].join(' ').trim();

  return (
    <div className="tutor-panel" role="region" aria-label="Conversation">
      <div className="tutor-head">
        <span className="tutor-step">Conversa</span>
        <span className="tutor-status" role="status">
          {state.phase === 'listening' && <><span className="qa-live-dot" /> Your turn, speak now</>}
          {state.phase === 'speaking' && 'Tutor speaking…'}
          {state.phase === 'thinking' && 'Thinking…'}
          {state.phase === 'typing' && 'Your turn, type your reply'}
          {paused && (state.pausedReason === 'silent' ? "Paused, I couldn't hear you" : 'Paused')}
          {failed && 'No answer'}
        </span>
      </div>

      <div className="conversa-log">
        {state.history.map((turn, i) => (turn.role === 'user'
          ? <div key={i} className="conversa-turn conversa-turn-learner">{turn.content}</div>
          : <TutorTurn key={i} text={turn.content} model={model} />))}
        {liveReply && <div className="conversa-turn">{liveReply}</div>}
      </div>

      {state.glossed && (
        <div className="tutor-glossed" role="status">
          <strong>{state.glossed.word}</strong>: {state.glossed.en}
        </div>
      )}

      {failed && (
        <div className="tutor-ai-error" role="alert">{ERROR_HELP[errorKind] ?? ERROR_HELP.server}</div>
      )}

      {state.phase === 'typing' && <TypedTurn onSubmit={(text) => dispatch({ type: 'typed', text })} />}

      <div className="tutor-controls">
        {failed ? (
          <>
            <button className="tutor-btn tutor-btn-primary" onClick={() => dispatch({ type: 'retry' })}>Try again</button>
            <button className="tutor-btn" onClick={() => dispatch({ type: 'rephrase' })}>Say something else</button>
          </>
        ) : paused ? (
          <button className="tutor-btn tutor-btn-primary" onClick={() => dispatch({ type: 'resume' })}>Resume</button>
        ) : (
          <>
            <button className="tutor-btn" onClick={() => dispatch({ type: 'pause' })}>Pause</button>
            <button className="tutor-btn" disabled={state.generating} onClick={() => send('repeat')}>Repeat</button>
            <button className="tutor-btn" disabled={state.generating || state.slow} onClick={() => send('slower')}>
              {state.slow ? 'Slow' : 'Slower'}
            </button>
            <button className="tutor-btn" disabled={state.generating} onClick={() => send('skip')}>New topic</button>
          </>
        )}
        <button className="tutor-btn" onClick={() => send('stop')}>Stop</button>
        {getSpeechRecognition() && !failed && !paused && (
          <button className="tutor-btn" onClick={() => dispatch({ type: 'setTyping', on: !state.typing })}>
            {state.typing ? 'Use mic' : 'Type instead'}
          </button>
        )}
      </div>

      <div className="conversa-note">
        AI replies come from {model} on this computer and can be wrong, so trust the reading over the tutor. Nothing is
        graded or saved.{' '}
        {state.typing ? '' : localSpeech
          ? 'Your speech is recognized on this device.'
          : "Your browser's speech service may send your voice online to recognize it. Type instead to avoid that."}
      </div>
    </div>
  );
}
