import { useMemo, useState } from 'react';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';
import { verseRefs } from '../utils/keyVerses';
import { verseChunks } from '../utils/verseChunks';
import { scrambleTokens, shuffleScramble, sameOrder, MIN_WORDS } from '../utils/scramble';
import { checkStage, stageCount, stageParts } from '../utils/verseRecall';
import { scoreRepeat, PASS_SCORE } from '../utils/tutorEngine';
import { useTutorVoice } from '../hooks/useTutorVoice';
import { useAudioSpeed } from '../hooks/useAudioSpeed';
import { getSpeechRecognition } from '../utils/speech';
import { recordActivity } from '../utils/streak';

// Fills in a verse's blanks, one input per word. Shared by Memorize and verse review.
export function VerseBlanks({ text, stage, onChecked, submitLabel = 'Check' }) {
  const parts = useMemo(() => stageParts(text, stage), [text, stage]);
  const blankCount = parts.filter((p) => p.blank).length;
  const [answers, setAnswers] = useState(() => Array(blankCount).fill(''));
  const [result, setResult] = useState(null);
  let blankIndex = -1;

  const submit = (e) => {
    e.preventDefault();
    if (result) return;
    const checked = checkStage(parts, answers);
    setResult(checked);
    onChecked(checked);
  };

  return (
    <form onSubmit={submit}>
      <div className="verse-blanks">
        {parts.map((part, i) => {
          if (!part.blank) return <span key={i}>{part.pre}{part.word}{part.post} </span>;
          blankIndex += 1;
          const index = blankIndex;
          const ok = result?.results[index];
          return (
            <span key={i}>
              {part.pre}
              <input
                className={`drill-input verse-blank-input${result ? (ok ? ' drill-ok' : ' drill-no') : ''}`}
                style={{ width: `${Math.max(part.word.length, 3) + 2}ch` }}
                value={answers[index]}
                disabled={!!result}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-label={`Missing word ${index + 1} of ${blankCount}`}
                onChange={(e) => {
                  const value = e.target.value;
                  setAnswers((prev) => prev.map((a, n) => (n === index ? value : a)));
                }}
              />
              {part.post}{' '}
            </span>
          );
        })}
      </div>
      {!result && <button type="submit" className="drill-btn">{submitLabel}</button>}
      {result && result.wrong > 0 && (
        <div className="verse-answer">
          <span className="drill-verdict-no">{result.wrong} to fix:</span> {text}
        </div>
      )}
    </form>
  );
}

function Memorize({ line }) {
  const [stage, setStage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const count = stageCount(line.t);
  const passed = result && result.wrong === 0;
  const finished = passed && stage === count - 1;

  const onChecked = (r) => {
    setResult(r);
    if (r.wrong === 0 && stage === count - 1) recordActivity('practiced');
  };
  const again = (nextStage) => {
    setStage(nextStage);
    setResult(null);
    setAttempt((a) => a + 1);
  };

  return (
    <div>
      <div className="verse-stage">Stage {stage + 1} of {count}</div>
      <VerseBlanks key={`${line.id}-${attempt}`} text={line.t} stage={stage} onChecked={onChecked} />
      {finished && <div className="drill-verdict-ok">Bene! You wrote the whole verse from memory.</div>}
      {result && (
        <div className="verse-actions">
          {passed && !finished && <button className="drill-btn" onClick={() => again(stage + 1)}>Next stage</button>}
          {!passed && <button className="drill-btn" onClick={() => again(stage)}>Try again</button>}
          {finished && <button className="drill-btn drill-btn-retry" onClick={() => again(0)}>Start over</button>}
        </div>
      )}
    </div>
  );
}

function BuildChunk({ chunk, onDone }) {
  const tokens = useMemo(() => scrambleTokens(chunk), [chunk]);
  const chips = useMemo(() => shuffleScramble(tokens), [tokens]);
  const [picked, setPicked] = useState([]);
  const complete = picked.length === tokens.length;
  const correct = complete && sameOrder(tokens, picked.map((i) => chips[i]));

  return (
    <div className="prac-build">
      <div className={`prac-build-picked${complete ? (correct ? ' prac-build-ok' : ' prac-build-no') : ''}`}>
        {picked.length === 0 && <span className="prac-build-hint">Tap the words in order</span>}
        {picked.map((chipIndex, i) => (
          <button
            key={`${chipIndex}-${i}`}
            className="prac-chip prac-chip-picked"
            disabled={correct}
            onClick={() => setPicked((p) => p.filter((_, n) => n !== i))}
          >
            {chips[chipIndex]}
          </button>
        ))}
      </div>
      <div className="prac-build-pool">
        {chips.map((chip, i) => (picked.includes(i) ? null : (
          <button key={i} className="prac-chip" onClick={() => setPicked((p) => [...p, i])}>{chip}</button>
        )))}
      </div>
      {correct && <button className="drill-btn" onClick={onDone}>Next</button>}
    </div>
  );
}

function Build({ line }) {
  const chunks = useMemo(
    () => verseChunks(line.t).filter((c) => scrambleTokens(c).length >= MIN_WORDS),
    [line.t],
  );
  const [index, setIndex] = useState(0);
  if (!chunks.length) return <div className="drill-intro">This verse is too short to rebuild. Try another one.</div>;
  if (index >= chunks.length) {
    return (
      <div className="verse-actions">
        <span className="drill-verdict-ok">Bene! You rebuilt the whole verse.</span>
        <button className="drill-btn drill-btn-retry" onClick={() => setIndex(0)}>Again</button>
      </div>
    );
  }
  return (
    <>
      {chunks.length > 1 && <div className="verse-stage">Part {index + 1} of {chunks.length}</div>}
      <BuildChunk
        key={`${line.id}-${index}`}
        chunk={chunks[index]}
        onDone={() => {
          if (index + 1 === chunks.length) recordActivity('practiced');
          setIndex(index + 1);
        }}
      />
    </>
  );
}

function ShadowRow({ text, voice, rate, busy, setBusy }) {
  const [result, setResult] = useState(null);
  const run = async () => {
    setBusy(text);
    setResult(null);
    const spoken = await voice.speak(text, rate);
    if (!spoken) { setBusy(null); return; }
    const heard = await voice.listen();
    if (heard?.type === 'heard') {
      const score = Math.max(...heard.alternatives.map((a) => scoreRepeat(text, a)));
      setResult({ score, heard: heard.alternatives[0] });
      recordActivity('practiced');
    } else if (heard) {
      setResult({ error: heard.type === 'micUnavailable' ? "The microphone isn't available." : "I didn't hear you." });
    }
    setBusy(null);
  };
  const active = busy === text;
  return (
    <div className="verse-shadow-row">
      <div className="verse-shadow-text"><WordGloss text={text} /></div>
      <button className="drill-btn" disabled={!!busy} onClick={run}>{active ? 'Listen, then repeat…' : 'Hear & repeat'}</button>
      {result?.error && <div className="drill-verdict-no">{result.error}</div>}
      {result && !result.error && (
        <div className={result.score >= PASS_SCORE ? 'drill-verdict-ok' : 'drill-verdict-no'}>
          {result.score}% · Heard: “{result.heard}”
        </div>
      )}
    </div>
  );
}

function Shadow({ line }) {
  const voice = useTutorVoice();
  const { rate } = useAudioSpeed();
  const [busy, setBusy] = useState(null);
  return (
    <div>
      {verseChunks(line.t).map((chunk) => (
        <ShadowRow key={chunk} text={chunk} voice={voice} rate={rate} busy={busy} setBusy={setBusy} />
      ))}
    </div>
  );
}

const MODES = [
  { id: 'memorize', label: 'Memorize' },
  { id: 'build', label: 'Build' },
  { id: 'shadow', label: 'Shadow', needsMic: true },
];

// "Versetti": one verse at a time, three ways to work on it.
export function VersePractice({ week }) {
  const lines = useMemo(() => verseRefs(week), [week]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('memorize');
  const [index, setIndex] = useState(0);
  if (!lines.length) return null;
  const line = lines[Math.min(index, lines.length - 1)];
  const modes = MODES.filter((m) => !m.needsMic || getSpeechRecognition());

  return (
    <div className="drill-panel">
      <button className="drill-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="drill-toggle-title">Versetti — memorize, build and shadow each verse</span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="drill-body">
          <div className="verse-pick" role="group" aria-label="Choose a verse">
            {lines.map((l, i) => (
              <button
                key={l.id}
                className={`verse-pick-btn${i === index ? ' active' : ''}`}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
              >
                {l.ref || i + 1}
              </button>
            ))}
          </div>
          <div className="verse-modes" role="group" aria-label="Practice style">
            {modes.map((m) => (
              <button
                key={m.id}
                className={`verse-mode-btn${mode === m.id ? ' active' : ''}`}
                aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="verse-ref">
            {line.fullRef || `Verse ${index + 1}`}
            <SpeakerButton word={line.t} size={14} />
          </div>
          {line.en && <div className="verse-en">{line.en}</div>}
          {mode === 'memorize' && <Memorize key={line.id} line={line} />}
          {mode === 'build' && <Build key={line.id} line={line} />}
          {mode === 'shadow' && <Shadow key={line.id} line={line} />}
        </div>
      )}
    </div>
  );
}

