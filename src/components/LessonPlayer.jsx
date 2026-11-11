import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  startRun, advance, currentStep, isFinished, progress, summarize, adaptLesson,
  checkStep, isReady, isGraded, srsGrades,
} from '../utils/lessonPlan';
import { splitBlank } from '../utils/grammarDrill';
import { recordLesson } from '../utils/lessonStore';
import { recordActivity } from '../utils/streak';
import { useSrs } from '../hooks/useSrs';
import { useAudioSpeed } from '../hooks/useAudioSpeed';
import { getSelectedVoice } from '../utils/voicePreference';
import { TTS_LANG, HAS_IPA } from '../utils/locale';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';
import { Confetti } from './Confetti';
import { UiText } from '../i18n/UiText';

// Say a new word as it appears — hearing it first is the point of the "meet
// the word" step. Runs inside the tap that advanced the lesson, so browsers
// allow it; silently does nothing where speech is unavailable.
function speak(text, rate) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = TTS_LANG;
    const voice = getSelectedVoice();
    if (voice) utter.voice = voice;
    utter.rate = rate;
    window.speechSynthesis.speak(utter);
  } catch {
    // speech is an enhancement, never a requirement
  }
}

// The Italian worth hearing once a step is answered — the whole sentence where
// there is one. Empty when the answer shown is English or a bare Vero/Falso.
function italianFor(step) {
  switch (step.kind) {
    case 'cloze': return step.card.ex;
    case 'recall': return step.card.it;
    case 'drill': return step.q.replace(/_{2,}/, step.a);
    case 'transform': return step.answer;
    case 'build': return step.text;
    case 'choice': return step.direction === 'en-it' ? step.term : '';
    default: return '';
  }
}

function IntroStep({ step }) {
  const { card } = step;
  return (
    <div className="lesson-intro">
      <div className="lesson-eyebrow">New word</div>
      <div className="lesson-word">
        {card.it}
        <SpeakerButton word={card.it} size={24} />
      </div>
      {HAS_IPA && card.ipa && <div className="lesson-ipa">{card.ipa}</div>}
      <div className="lesson-meaning">{card.en}</div>
      {card.ex && (
        <div className="lesson-example">
          <span className="lesson-example-it">
            <WordGloss text={card.ex} />
            <SpeakerButton word={card.ex} size={16} />
          </span>
          {card.exEn && <span className="lesson-example-en">{card.exEn}</span>}
        </div>
      )}
    </div>
  );
}

// Tap one tile on each side. A right pair locks; a wrong pair flashes and
// clears. Ungraded — it is a warm-up, and the board cannot be left unfinished.
function MatchStep({ step, onDone }) {
  const [sel, setSel] = useState({ left: null, right: null });
  const [matched, setMatched] = useState([]);
  const [wrong, setWrong] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  function pick(side, idx) {
    if (matched.includes(idx) || wrong) return;
    const next = { ...sel, [side]: sel[side] === idx ? null : idx };
    if (next.left === null || next.right === null) { setSel(next); return; }
    if (next.left === next.right) {
      const all = [...matched, idx];
      setMatched(all);
      setSel({ left: null, right: null });
      if (all.length === step.pairs.length) onDone();
    } else {
      setSel(next);
      setWrong(next);
      timer.current = setTimeout(() => { setWrong(null); setSel({ left: null, right: null }); }, 600);
    }
  }

  const tile = (side, idx, label) => {
    const cls = matched.includes(idx) ? ' matched'
      : wrong && wrong[side] === idx ? ' wrong'
        : sel[side] === idx ? ' selected' : '';
    return (
      <button
        key={`${side}${idx}`}
        className={`lesson-tile${cls}`}
        disabled={matched.includes(idx)}
        aria-pressed={sel[side] === idx}
        onClick={() => pick(side, idx)}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="lesson-match">
      <div className="lesson-instruction">Match each word to its meaning</div>
      <div className="lesson-match-grid">
        <div className="lesson-match-col">{step.left.map((i) => tile('left', i, step.pairs[i].it))}</div>
        <div className="lesson-match-col">{step.right.map((i) => tile('right', i, step.pairs[i].en))}</div>
      </div>
    </div>
  );
}

function Options({ options, value, answer, verdict, onPick }) {
  return (
    <div className="lesson-options">
      {options.map((label, i) => {
        const cls = !verdict ? ''
          : i === answer ? ' correct'
            : i === value ? ' wrong' : ' dim';
        return (
          <button
            key={i}
            className={`lesson-option${cls}`}
            disabled={!!verdict}
            onClick={() => onPick(i)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function TypedInput({ value, setValue, verdict, placeholder = 'Scrivi qui…' }) {
  return (
    <input
      className={`lesson-input${verdict ? (verdict.correct ? ' correct' : ' wrong') : ''}`}
      value={value || ''}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      disabled={!!verdict}
      autoFocus
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      aria-label="Your answer"
    />
  );
}

function BuildStep({ step, value, setValue, verdict }) {
  const picked = value || [];
  return (
    <div className="lesson-build">
      <div className="lesson-instruction">
        {step.audio ? 'Listen, then put the words in order' : 'Put the words in order'}
      </div>
      {step.audio && <div className="lesson-listen"><SpeakerButton word={step.text} size={28} /></div>}
      {step.en && <div className="lesson-prompt-sub">{step.en}</div>}
      <div className={`lesson-build-picked${verdict ? (verdict.correct ? ' correct' : ' wrong') : ''}`}>
        {picked.length === 0 && <span className="lesson-build-hint">Tap the words below…</span>}
        {picked.map((ci) => (
          <button
            key={ci}
            className="prac-chip prac-chip-picked"
            disabled={!!verdict}
            onClick={() => setValue(picked.filter((x) => x !== ci))}
          >
            {step.chips[ci]}
          </button>
        ))}
      </div>
      <div className="lesson-build-pool">
        {step.chips.map((w, ci) => (picked.includes(ci) ? null : (
          <button key={ci} className="prac-chip" disabled={!!verdict} onClick={() => setValue([...picked, ci])}>
            {w}
          </button>
        )))}
      </div>
    </div>
  );
}

function StepBody({ step, value, setValue, verdict, onPick, onMatchDone }) {
  switch (step.kind) {
    case 'intro':
      return <IntroStep step={step} />;
    case 'match':
      return <MatchStep step={step} onDone={onMatchDone} />;
    case 'tip':
      return (
        <div className="lesson-tip">
          <div className="lesson-eyebrow">Grammar</div>
          <div className="lesson-tip-title">{step.title}</div>
          <p className="lesson-tip-body">{step.body}</p>
        </div>
      );
    case 'choice':
      return (
        <>
          <div className="lesson-instruction">
            {step.direction === 'it-en' ? 'What does this mean?' : 'How do you say this in Italian?'}
          </div>
          <div className="lesson-prompt">
            {step.prompt}
            {step.direction === 'it-en' && <SpeakerButton word={step.prompt} size={20} />}
          </div>
          <Options options={step.options} value={value} answer={step.answer} verdict={verdict} onPick={onPick} />
        </>
      );
    case 'mc':
      return (
        <>
          <div className="lesson-instruction">About the reading</div>
          <div className="lesson-prompt lesson-prompt-sentence"><WordGloss text={step.it} /></div>
          {step.en && <div className="lesson-prompt-sub">{step.en}</div>}
          <Options options={step.options} value={value} answer={step.answer} verdict={verdict} onPick={onPick} />
        </>
      );
    case 'tf':
      return (
        <>
          <div className="lesson-instruction">Vero o falso? — true or false, from the reading</div>
          <div className="lesson-prompt lesson-prompt-sentence"><WordGloss text={step.it} /></div>
          {step.en && <div className="lesson-prompt-sub">{step.en}</div>}
          <Options
            options={['Vero', 'Falso']}
            value={value === undefined || value === null ? null : value ? 0 : 1}
            answer={step.answer ? 0 : 1}
            verdict={verdict}
            onPick={(i) => onPick(i === 0)}
          />
        </>
      );
    case 'cloze':
      return (
        <>
          <div className="lesson-instruction">Fill the blank — {step.card.en}</div>
          <div className="lesson-prompt lesson-prompt-sentence">
            {step.before}
            <span className="lesson-blank">{verdict ? step.answer : '____'}</span>
            {step.after}
          </div>
          <TypedInput value={value} setValue={setValue} verdict={verdict} />
        </>
      );
    case 'recall':
      return (
        <>
          <div className="lesson-instruction">Type the Italian</div>
          <div className="lesson-prompt">{step.card.en}</div>
          <TypedInput value={value} setValue={setValue} verdict={verdict} />
        </>
      );
    case 'drill': {
      const { before, after } = splitBlank(step.q);
      return (
        <>
          <div className="lesson-instruction">Complete the sentence</div>
          <div className="lesson-prompt lesson-prompt-sentence">
            {before}
            <span className="lesson-blank">{verdict ? step.a : '____'}</span>
            {after}
          </div>
          {step.hint && <div className="lesson-prompt-sub">{step.hint}</div>}
          <TypedInput value={value} setValue={setValue} verdict={verdict} />
        </>
      );
    }
    case 'transform':
      return (
        <>
          <div className="lesson-instruction">{step.instruction}</div>
          <div className="lesson-prompt lesson-prompt-sentence">{step.base}</div>
          <TypedInput value={value} setValue={setValue} verdict={verdict} placeholder="Riscrivi la frase…" />
        </>
      );
    case 'build':
      return <BuildStep step={step} value={value} setValue={setValue} verdict={verdict} />;
    default:
      return null;
  }
}

function Summary({ lesson, summary, weekDone, onClose }) {
  const cheer = summary.pct >= 90 ? 'Perfetto!' : summary.pct >= 70 ? 'Bravo!' : 'Continua così!';
  return (
    <div className="lesson-summary">
      {summary.pct >= 70 && <Confetti />}
      <div className="lesson-cheer">{cheer}</div>
      <div className="lesson-summary-title">Lesson complete — {lesson.title}</div>
      <div className="lesson-score">{summary.pct}%</div>
      <div className="lesson-summary-sub">
        {summary.correct} of {summary.graded} right first time
      </div>
      {weekDone && (
        <div className="lesson-week-done">✓ Week {lesson.weekN} complete — every lesson finished</div>
      )}
      {lesson.words.length > 0 && (
        <>
          <div className="lesson-summary-sub">These words are now in your review:</div>
          <div className="lesson-summary-words">
            {lesson.words.map((w) => <span key={w} className="recycle-chip">{w}</span>)}
          </div>
        </>
      )}
      <button className="lesson-primary" onClick={onClose} autoFocus>
        <UiText k="lesson.continue" />
      </button>
    </div>
  );
}

// One exercise on screen at a time, a progress bar, a verdict after each
// answer, a summary at the end. All decisions live in lessonPlan.js; this
// component collects a value per step and carries out what the run says.
// `onComplete(lesson, firstTime)` runs once the lesson is recorded; returning
// true tells the summary that this finished the whole week.
export function LessonPlayer({ lesson: planned, onClose, onComplete }) {
  const { recordReview, getStore } = useSrs();
  // The plan is the same for everyone; what is dropped or repeated depends on
  // the words this learner already knows or keeps missing.
  const [lesson] = useState(() => adaptLesson(planned, getStore()));
  const [run, setRun] = useState(() => startRun(lesson));
  const [value, setValue] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [summary, setSummary] = useState(null);
  const [weekDone, setWeekDone] = useState(false);
  const { rate } = useAudioSpeed();
  const step = currentStep(run);

  // Hold the page behind the lesson still.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Speak the first word; later ones are spoken from the tap that reveals them.
  useEffect(() => {
    if (lesson.steps[0]?.kind === 'intro') speak(lesson.steps[0].card.it, rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(finalRun) {
    const sum = summarize(finalRun);
    for (const { term, grade } of srsGrades(lesson, finalRun, getStore())) recordReview(term, grade);
    // The streak first: recording the lesson announces itself, and listeners
    // (the Today goals) re-read the streak when it does.
    recordActivity('practiced');
    const store = recordLesson(lesson.key, sum.pct);
    setWeekDone(!!onComplete?.(lesson, store.done[lesson.key]?.times === 1));
    setSummary(sum);
  }

  function goNext(correct) {
    const next = advance(run, correct);
    setRun(next);
    setValue(null);
    setVerdict(null);
    if (isFinished(next)) { finish(next); return; }
    const upcoming = currentStep(next);
    if (upcoming.kind === 'intro') speak(upcoming.card.it, rate);
  }

  function check(v = value) {
    if (!step || verdict || !isReady(step, v)) return;
    setVerdict(checkStep(step, v));
  }

  // Tapping an option is the answer — no separate Check press.
  function pick(v) {
    if (verdict) return;
    setValue(v);
    check(v);
  }

  const graded = isGraded(step);
  const ready = step ? isReady(step, value) : false;
  const tapOnly = step && ['choice', 'mc', 'tf'].includes(step.kind);
  const spoken = step ? italianFor(step) : '';

  function primary() {
    if (summary || !step) return;
    if (!graded) { if (ready) goNext(null); return; }
    if (verdict) goNext(verdict.correct);
    else check();
  }

  // Enter drives the lesson from the keyboard. A focused button already turns
  // Enter into a click, so those are left alone to avoid acting twice.
  const primaryRef = useRef(primary);
  primaryRef.current = primary;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter' || e.target?.tagName === 'BUTTON') return;
      e.preventDefault();
      primaryRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return createPortal(
    <div className="lesson-overlay" role="dialog" aria-modal="true" aria-label={`Lesson: ${lesson.title}`}>
      <div className="lesson-top">
        <button className="lesson-close" onClick={onClose} aria-label="Close lesson">×</button>
        <div
          className="lesson-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress(run) * 100)}
        >
          <div className="lesson-bar-fill" style={{ width: `${progress(run) * 100}%` }} />
        </div>
        <span className="lesson-top-label">Week {lesson.weekN} · {lesson.title}</span>
      </div>

      {summary ? (
        <div className="lesson-body"><Summary lesson={lesson} summary={summary} weekDone={weekDone} onClose={onClose} /></div>
      ) : (
        <>
          <div className="lesson-body" key={run.index}>
            {step.retry && <div className="lesson-retry">One more try at this one</div>}
            {lesson.adapted && run.index === 0 && (
              <div className="lesson-adapted">
                {[
                  lesson.adapted.skipped > 0 && `Skipping ${lesson.adapted.skipped} word${lesson.adapted.skipped === 1 ? '' : 's'} you know well`,
                  lesson.adapted.extra > 0 && `extra practice on ${lesson.adapted.extra}`,
                ].filter(Boolean).join(' · ')}
              </div>
            )}
            <StepBody
              step={step}
              value={value}
              setValue={setValue}
              verdict={verdict}
              onPick={pick}
              onMatchDone={() => setValue(true)}
            />
          </div>

          <div className={`lesson-footer${verdict ? (verdict.correct ? ' correct' : ' wrong') : ''}`}>
            {verdict && (
              <div className="lesson-verdict" role="status">
                <span className="lesson-verdict-head">{verdict.correct ? 'Giusto!' : 'Non proprio'}</span>
                {verdict.answer && (
                  <span className="lesson-verdict-answer">
                    {verdict.answer}
                    {spoken && <SpeakerButton word={spoken} size={16} />}
                  </span>
                )}
                {verdict.note && <span className="lesson-verdict-note">{verdict.note}</span>}
              </div>
            )}
            {tapOnly && !verdict ? (
              <div className="lesson-footer-hint">Choose an answer</div>
            ) : (
              <button className="lesson-primary" onClick={primary} disabled={!verdict && !ready}>
                <UiText k={graded && !verdict ? 'lesson.check' : 'lesson.continue'} />
              </button>
            )}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
