import { useState, useEffect, useRef, useMemo } from 'react';
import { rosary } from '../../course/rosary';
import { devotionSections } from '../../course/devotions';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';
import { recordActivity, todayStr } from '../utils/streak';
import {
  ORDINALS, setForDay, buildSteps, sectionSteps, capitalize,
  loadRosary, resumeFor, savePosition, clearPosition, recordComplete,
} from '../utils/rosary';

// A guided Rosary in Italian, bead by bead. The Prayers tab teaches each text;
// this tab is where they are used the way they are meant to be — fifty Hail
// Marys is fifty re-encounters with the same chunks, which no drill can match.
//
// The prayer texts come from the course's devotions (one source of truth); the
// course's rosary.js supplies the mysteries and the order.

// The first devotion with each id — the Leonine section repeats the Ave Maria
// under its own id, so there is no ambiguity for the ids rosary.js names.
const PRAYERS = new Map(
  devotionSections.flatMap((s) => s.prayers).reverse().map((p) => [p.id, p]),
);

const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

function sectionLabel(section) {
  if (section === 'intro') return { it: 'Introduzione', en: 'Opening prayers' };
  if (section === 'closing') return { it: 'Conclusione', en: 'Closing prayers' };
  return { it: `Decina ${section + 1} di 5`, en: `Decade ${section + 1} of 5` };
}

function Bead({ step, state }) {
  const cls = `rosary-bead rosary-bead--${step.bead} rosary-bead--${state}`;
  if (step.bead === 'cross') {
    return (
      <span className={cls} aria-hidden="true">
        <svg width="12" height="16" viewBox="0 0 12 16"><path d="M6 1v14M1.5 5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </span>
    );
  }
  return <span className={cls} aria-hidden="true" />;
}

function BeadStrip({ steps, current }) {
  const group = sectionSteps(steps, current);
  return (
    <div className="rosary-beads" role="img" aria-label={`Step ${group.indexOf(current) + 1} of ${group.length} in this part`}>
      {group.map((s) => (
        <Bead key={s.index} step={s} state={s.index < current.index ? 'done' : s.index === current.index ? 'current' : 'todo'} />
      ))}
    </div>
  );
}

function PrayerStep({ step, showEn }) {
  const prayer = PRAYERS.get(step.prayerId);
  if (!prayer) return <div className="prayer-mode-empty">Missing prayer: {step.prayerId}</div>;
  return (
    <>
      <div className="rosary-step-head">
        <div className="prayer-card-titles">
          <span className="rosary-step-title">
            {prayer.title}
            {step.count && <span className="rosary-count"> {step.count.n}/{step.count.of}</span>}
          </span>
          <span className="prayer-title-en">{prayer.titleEn}</span>
        </div>
        <SpeakerButton word={prayer.it} size={20} />
      </div>
      {step.virtue && (
        <p className="rosary-intention">
          Per la <WordGloss text={step.virtue.it} /> <span className="rosary-intention-en">· for {step.virtue.en}</span>
        </p>
      )}
      {prayer.lines ? (
        <ol className="prayer-lines rosary-lines">
          {prayer.lines.map((line, i) => (
            <li className="prayer-line" key={i}>
              <span className="prayer-line-it"><WordGloss text={line.it} /></span>
              {showEn && <span className="prayer-line-en">{line.en}</span>}
            </li>
          ))}
        </ol>
      ) : (
        <>
          <p className="prayer-text-it"><WordGloss text={prayer.it} /></p>
          {showEn && <p className="prayer-text-en">{prayer.en}</p>}
        </>
      )}
    </>
  );
}

function MysteryStep({ step, set, showEn }) {
  const d = step.section;
  return (
    <div className="rosary-mystery">
      <span className="rosary-mystery-kicker">
        {capitalize(ORDINALS[d])} mistero {set.adjective}
      </span>
      <span className="rosary-mystery-title">{capitalize(step.mystery.it)}</span>
      <span className="prayer-title-en">{step.mystery.en} · {step.mystery.ref}</span>
      <p className="rosary-announce">
        <WordGloss text={step.text} />
        <SpeakerButton word={step.text} size={16} />
      </p>
      {showEn && (
        <p className="prayer-line-en">
          In the {['first', 'second', 'third', 'fourth', 'fifth'][d]} {set.titleEn.replace(/ Mysteries$/, '').toLowerCase()} mystery we contemplate {step.mystery.en.replace(/^The /, 'the ')}.
        </p>
      )}
      {step.mystery.fruitEn && (
        <p className="rosary-fruit">Fruit of the mystery: {step.mystery.fruitEn}</p>
      )}
    </div>
  );
}

function StartScreen({ set, setSet, today, resume, stats, onBegin, onResume }) {
  const todaysSet = setForDay(new Date().getDay(), rosary.sets);
  return (
    <>
      {resume && (
        <div className="rosary-resume">
          <span>You stopped at step {resume.step + 1} of today's Rosary.</span>
          <button className="prac-known-btn" onClick={onResume}>Riprendi · Resume</button>
        </div>
      )}
      <div className="rosary-sets" role="radiogroup" aria-label="Mysteries">
        {rosary.sets.map((s) => (
          <button
            key={s.id}
            role="radio"
            aria-checked={s.id === set.id}
            className={`prayer-mode-btn${s.id === set.id ? ' active' : ''}`}
            onClick={() => setSet(s)}
          >
            {s.title.replace('Misteri ', '')}
            {s.id === todaysSet.id && <span className="rosary-today"> · oggi</span>}
          </button>
        ))}
      </div>
      <div className="prayer-card">
        <div className="prayer-card-titles">
          <span className="prayer-title-it">{set.title}</span>
          <span className="prayer-title-en">
            {set.titleEn} · {set.days.map((d) => DAY_NAMES[d]).join(', ')}
          </span>
        </div>
        <ol className="rosary-mystery-list">
          {set.mysteries.map((m, i) => (
            <li key={i}>
              <span className="rosary-mystery-list-it">{capitalize(m.it)}</span>
              <span className="rosary-mystery-list-en">{m.en} · {m.ref}</span>
            </li>
          ))}
        </ol>
        <button className="prac-known-btn rosary-begin" onClick={onBegin}>
          Inizia il Rosario · Begin
        </button>
      </div>
      {stats.completed > 0 && (
        <p className="rosary-tally">
          Rosaries prayed in Italian: {stats.completed}{stats.last === today ? ' — including today' : ''}
        </p>
      )}
    </>
  );
}

export function RosaryTab() {
  const today = todayStr();
  const [stats, setStats] = useState(loadRosary);
  const resume = resumeFor(stats, today);
  const [set, setSet] = useState(() =>
    (resume && rosary?.sets.find((s) => s.id === resume.setId)) || setForDay(new Date().getDay(), rosary?.sets ?? []));
  const [stepIndex, setStepIndex] = useState(null); // null = start screen
  const [finished, setFinished] = useState(false);
  const [showEn, setShowEn] = useState(false);
  const topRef = useRef(null);
  const steps = useMemo(() => (rosary && set ? buildSteps(rosary, set) : []), [set]);

  const guided = stepIndex !== null && !finished;

  function goTo(i) {
    setStepIndex(i);
    setStats(savePosition(today, set.id, i));
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView?.({ block: 'start' });
  }

  function next() {
    if (stepIndex < steps.length - 1) return goTo(stepIndex + 1);
    setStats(recordComplete(today));
    recordActivity('practiced');
    setFinished(true);
  }

  function prev() {
    if (stepIndex > 0) goTo(stepIndex - 1);
  }

  // Arrow keys step through the beads — the prayer is said with eyes on the
  // text, not hunting for a button.
  const navRef = useRef({ next, prev });
  navRef.current = { next, prev };
  useEffect(() => {
    if (!guided) return undefined;
    const onKey = (e) => {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') navRef.current.next();
      if (e.key === 'ArrowLeft') navRef.current.prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guided]);

  if (!rosary || !set) return null;

  const step = guided ? steps[stepIndex] : null;
  const label = step ? sectionLabel(step.section) : null;

  return (
    <div className="prayers-wrap rosary-wrap" ref={topRef}>
      <div className="prayers-header">
        <h2 className="prayers-heading">Il Santo Rosario</h2>
        <p className="prayers-subheading">A guided Rosary in Italian, bead by bead</p>
      </div>

      {stepIndex === null && (
        <>
          <div className="prayers-why">
            Five decades means the Ave Maria fifty times: the same Italian, said
            aloud, until it is yours. Each mystery is announced the way an
            Italian parish announces it. Tap any word for its meaning, or the
            speaker to hear the whole prayer.
          </div>
          <StartScreen
            set={set}
            setSet={setSet}
            today={today}
            resume={resume}
            stats={stats}
            onBegin={() => { setFinished(false); goTo(0); }}
            onResume={() => {
              const s = rosary.sets.find((x) => x.id === resume.setId) || set;
              setSet(s);
              setFinished(false);
              setStepIndex(resume.step);
            }}
          />
        </>
      )}

      {guided && (
        <div className="prayer-card rosary-guide">
          <div className="rosary-progress-top">
            <span className="rosary-section">
              {label.it} <span className="prayer-title-en">· {label.en}</span>
            </span>
            <span className="rosary-set-name">{set.title}</span>
          </div>
          <div className="bar-bg rosary-bar">
            <div className="bar-fill" style={{ width: `${Math.round(((stepIndex + 1) / steps.length) * 100)}%` }} />
          </div>
          <BeadStrip steps={steps} current={step} />

          {step.kind === 'mystery'
            ? <MysteryStep step={step} set={set} showEn={showEn} />
            : <PrayerStep step={step} showEn={showEn} />}

          <button
            className={`prayer-translation-toggle${showEn ? ' open' : ''}`}
            onClick={() => setShowEn((v) => !v)}
            aria-expanded={showEn}
          >
            <span>{showEn ? 'Hide English' : 'Show English'}</span>
          </button>

          <div className="prac-actions">
            <button className="prac-again-btn" onClick={prev} disabled={stepIndex === 0}>← Indietro</button>
            <button className="prac-known-btn" onClick={next}>
              {stepIndex === steps.length - 1 ? 'Amen — finish' : 'Avanti →'}
            </button>
          </div>
          <button
            className="rosary-exit"
            onClick={() => setStepIndex(null)}
          >
            Pause — back to the mysteries (your place is kept for today)
          </button>
        </div>
      )}

      {finished && (
        <div className="prayer-card rosary-done">
          <span className="rosary-mystery-title">Sia lodato Gesù Cristo.</span>
          <span className="prayer-title-en">Praised be Jesus Christ.</span>
          <p className="rosary-tally">
            You prayed the {set.titleEn} in Italian — fifty Ave Marias. Rosaries prayed: {stats.completed}.
          </p>
          <button
            className="prac-known-btn"
            onClick={() => { setFinished(false); setStepIndex(null); setStats(clearPosition()); }}
          >
            Back to the mysteries
          </button>
        </div>
      )}
    </div>
  );
}
