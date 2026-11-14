import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  startRun, advance, currentStep, isFinished, progress, summarize, adaptLesson,
  checkStep, isReady, isGraded, srsGrades,
} from '../utils/lessonPlan';
import { splitBlank } from '../utils/grammarDrill';
import { recordLesson, DEVOTION_KEY } from '../utils/lessonStore';
import { recordActivity, currentStreak } from '../utils/streak';
import { playSfx, soundOn, setSoundOn } from '../utils/sfx';
import { praiseFor, COMBO_MIN, nextCombo, soundFor } from '../utils/lessonFeedback';
import { useSrs } from '../hooks/useSrs';
import { useAudioSpeed } from '../hooks/useAudioSpeed';
import { getSelectedVoice } from '../utils/voicePreference';
import { TTS_LANG, HAS_IPA } from '../utils/locale';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';
import { WikiImage } from './WikiImage';
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
  if (step.say) return step.say;
  switch (step.kind) {
    case 'cloze': return step.card.ex;
    case 'recall': return step.card.it;
    case 'drill': return step.q.replace(/_{2,}/, step.a);
    case 'transform': return step.answer;
    case 'build': return step.text;
    case 'choice': return step.direction === 'en-it' || step.audio ? step.term : '';
    default: return '';
  }
}

function FlameIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8.5 1c.5 2-1 3-1.8 4.2C5.6 7 5 8.2 5 9.7a3 3 0 006 .1c0-1-.4-1.9-1-2.6.2.9-.4 1.6-1 1.8.7-1.3-.1-2.8-1.5-4.1C8.4 3.4 9 2 8.5 1z" />
    </svg>
  );
}

function SoundIcon({ on }) {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 6h2.5L8 3v10L4.5 10H2V6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      {on ? (
        <path d="M10.5 5.5a3.5 3.5 0 010 5M12.3 3.8a6 6 0 010 8.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      ) : (
        <path d="M10.8 6l3.4 4M14.2 6l-3.4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      )}
    </svg>
  );
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

// A prayer line, a mystery or a word from a story, presented before it is
// practised: the Italian (spoken as it appears), its meaning, and whatever the
// lesson attached — a picture, the sentence it came from, a note.
function LineStep({ step }) {
  return (
    <div className="lesson-intro">
      {step.eyebrow && <div className="lesson-eyebrow">{step.eyebrow}</div>}
      {step.image && <WikiImage title={step.image} alt={step.en} className="lesson-image" />}
      <div className={`lesson-word${step.it.length > 22 ? ' lesson-word--line' : ''}`}>
        <span><WordGloss text={step.it} /></span>
        <SpeakerButton word={step.say || step.it} size={24} />
      </div>
      <div className="lesson-meaning">{step.en}</div>
      {step.example && (
        <div className="lesson-example">
          <span className="lesson-example-it">
            <WordGloss text={step.example} />
            <SpeakerButton word={step.example} size={16} />
          </span>
        </div>
      )}
      {step.note && <div className="lesson-prompt-sub">{step.note}</div>}
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
      playSfx('match');
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
      <div className="lesson-instruction">{step.instruction || 'Match each word to its meaning'}</div>
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
    case 'line':
      return <LineStep step={step} />;
    case 'match':
      return <MatchStep step={step} onDone={onMatchDone} />;
    case 'tip':
      return (
        <div className="lesson-tip">
          <div className="lesson-eyebrow">{step.eyebrow || 'Grammar'}</div>
          <div className="lesson-tip-title">{step.title}</div>
          <p className="lesson-tip-body">{step.body}</p>
        </div>
      );
    case 'choice':
      return (
        <>
          <div className="lesson-instruction">
            {step.audio
              ? 'Listen — what does it mean?'
              : step.instruction
                || (step.direction === 'it-en' ? 'What does this mean?' : 'How do you say this in Italian?')}
          </div>
          <div className={`lesson-prompt${step.sentence || step.prompt.length > 40 ? ' lesson-prompt-sentence' : ''}`}>
            {/* A listening step keeps the word hidden until it is answered. */}
            {(!step.audio || verdict) && step.prompt}
            {step.direction === 'it-en' && <SpeakerButton word={step.prompt} size={step.audio && !verdict ? 36 : 20} />}
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

function Summary({ lesson, summary, weekDone, bestCombo, streak, onClose }) {
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
      <div className="lesson-stats">
        {bestCombo >= COMBO_MIN && (
          <span className="lesson-stat">
            <span className="lesson-stat-num">{bestCombo}</span> in a row
          </span>
        )}
        {streak > 0 && (
          <span className="lesson-stat lesson-stat--streak">
            <FlameIcon /> <span className="lesson-stat-num">{streak}</span> day{streak === 1 ? '' : 's'} streak
          </span>
        )}
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
  // Right answers in a row, first tries only. A miss or a retry step ends it.
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sound, setSound] = useState(soundOn);
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
    const first = lesson.steps[0];
    if (first?.kind === 'intro') speak(first.card.it, rate);
    else if (first?.kind === 'line') speak(first.say, rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(finalRun) {
    const sum = summarize(finalRun);
    for (const { term, grade } of srsGrades(lesson, finalRun, getStore())) recordReview(term, grade);
    // The streak first: recording the lesson announces itself, and listeners
    // (the Today goals) re-read the streak when it does.
    setStreak(currentStreak(recordActivity('practiced')));
    playSfx('done');
    // A saint's-story lesson belongs to the day and is not recorded at all.
    let firstTime = true;
    if (lesson.store !== 'none') {
      const store = recordLesson(lesson.key, sum.pct, lesson.store === 'devotion' ? DEVOTION_KEY : undefined);
      firstTime = store.done[lesson.key]?.times === 1;
    }
    setWeekDone(!!onComplete?.(lesson, firstTime));
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
    else if (upcoming.kind === 'line') speak(upcoming.say, rate);
    else if (upcoming.kind === 'choice' && upcoming.audio) speak(upcoming.term, rate);
  }

  function check(v = value) {
    if (!step || verdict || !isReady(step, v)) return;
    const result = checkStep(step, v);
    setVerdict(result);
    const inARow = nextCombo(combo, result.correct, step.retry);
    setCombo(inARow);
    if (inARow > bestCombo) setBestCombo(inARow);
    playSfx(soundFor(result.correct, inARow));
    if (!result.correct) navigator.vibrate?.(60);
  }

  function toggleSound() {
    setSoundOn(!sound);
    setSound(!sound);
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
        <button
          className="lesson-sound"
          onClick={toggleSound}
          aria-pressed={sound}
          aria-label={sound ? 'Answer sounds on — turn off' : 'Answer sounds off — turn on'}
          title={sound ? 'Answer sounds: on' : 'Answer sounds: off'}
        >
          <SoundIcon on={sound} />
        </button>
        <span className="lesson-top-label">{lesson.label || `Week ${lesson.weekN} · ${lesson.title}`}</span>
        {!summary && combo >= COMBO_MIN && (
          <span className="lesson-combo" key={combo} role="status">
            <FlameIcon size={13} /> {combo} di fila
          </span>
        )}
      </div>

      {summary ? (
        <div className="lesson-body"><Summary lesson={lesson} summary={summary} weekDone={weekDone} bestCombo={bestCombo} streak={streak} onClose={onClose} /></div>
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
                <span className="lesson-verdict-head">{verdict.correct ? praiseFor(run.index) : 'Non proprio'}</span>
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
