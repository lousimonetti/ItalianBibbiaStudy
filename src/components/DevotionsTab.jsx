import { useState, useRef } from 'react';
import { devotionSections } from '../../course/devotions';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';
import { scorePronunciation } from '../utils/pronunciation';
import { usePronunStats } from '../hooks/usePronunStats';
import { recordActivity } from '../utils/streak';
import { checkDrill } from '../utils/answer';
import { TTS_LANG } from '../utils/locale';

// Memorized devotional texts — the strongest language material in the app, and
// previously the least used: it was read-only text with one whole-prayer TTS
// button, connected to nothing.
//
// What these texts have that nothing else does: the learner already knows the
// meaning by heart in English, so comprehension is free and all attention goes
// to form; they are formulaic chunks, which is the fastest route adults have to
// fluent production; and they are recited repeatedly, giving the distributed
// re-encounter the weekly vocabulary can't.
//
// Three modes per text: Read (line-aligned with translation), Shadow (hear a
// line, repeat it, get scored — reusing the pronunciation pipeline), and Recall
// (chunk cloze on the grammar-bearing word of each line).

const hasSpeechRecognition = !!(
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)
);

function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// The word a chunk card hides — the author's choice when given (picked for
// grammatical payload: sia, venga, dacci), else the longest word in the line.
function blankFor(line) {
  if (line.blank) return line.blank;
  const words = line.it.match(/[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*/g) || [];
  return words.sort((a, b) => b.length - a.length)[0] || '';
}

function splitOnBlank(line) {
  const words = line.it.match(/[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*/g) || [];
  // A one-word line ("Amen.") would blank its only word, leaving no context to
  // recall from — that's a blank stare, not a cloze. Skip it.
  if (words.length < 2) return null;
  const blank = blankFor(line);
  const idx = blank ? line.it.toLowerCase().indexOf(blank.toLowerCase()) : -1;
  if (idx < 0) return null;
  return {
    before: line.it.slice(0, idx),
    answer: line.it.slice(idx, idx + blank.length),
    after: line.it.slice(idx + blank.length),
  };
}

function ReadMode({ prayer }) {
  const [showEn, setShowEn] = useState(false);

  if (!prayer.lines) {
    // No line alignment authored — fall back to the whole-text view.
    return (
      <>
        <p className="prayer-text-it"><WordGloss text={prayer.it} /></p>
        <button
          className={`prayer-translation-toggle${showEn ? ' open' : ''}`}
          onClick={() => setShowEn((v) => !v)}
          aria-expanded={showEn}
        >
          <span>{showEn ? 'Hide English' : 'Show English'}</span>
          <ChevronIcon open={showEn} />
        </button>
        {showEn && <p className="prayer-text-en">{prayer.en}</p>}
      </>
    );
  }

  return (
    <>
      <button
        className={`prayer-translation-toggle${showEn ? ' open' : ''}`}
        onClick={() => setShowEn((v) => !v)}
        aria-expanded={showEn}
      >
        <span>{showEn ? 'Hide English' : 'Show English'}</span>
        <ChevronIcon open={showEn} />
      </button>
      <ol className="prayer-lines">
        {prayer.lines.map((line, i) => (
          <li className="prayer-line" key={i}>
            <span className="prayer-line-it">
              <WordGloss text={line.it} />
              <SpeakerButton word={line.it} size={13} />
            </span>
            {showEn && <span className="prayer-line-en">{line.en}</span>}
          </li>
        ))}
      </ol>
    </>
  );
}

function ShadowMode({ prayer }) {
  const [index, setIndex] = useState(0);
  const [micState, setMicState] = useState('idle');
  const [result, setResult] = useState(null);
  const [rate, setRate] = useState(0.85);
  const recRef = useRef(null);
  const { record } = usePronunStats();

  const lines = prayer.lines ?? [];
  if (!lines.length) {
    return <div className="prayer-mode-empty">This text has no line-by-line version yet.</div>;
  }
  if (!hasSpeechRecognition) {
    return (
      <div className="prayer-mode-empty">
        Shadowing needs speech recognition — available in Chrome or Edge on desktop,
        or Safari on iOS 14.5+. You can still use Read mode with per-line audio.
      </div>
    );
  }

  const line = lines[index];

  function handleMic() {
    if (micState === 'recording') {
      recRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = TTS_LANG;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    recRef.current = rec;
    setMicState('recording');
    setResult(null);

    rec.onresult = (e) => {
      setMicState('processing');
      let best = { recognized: '', score: 0 };
      for (let i = 0; i < e.results[0].length; i++) {
        const text = e.results[0][i].transcript;
        const score = scorePronunciation(line.it, text);
        if (score > best.score) best = { recognized: text, score };
      }
      setResult(best);
      // Scored per prayer line, keyed so it doesn't collide with vocab terms.
      record(`${prayer.id}:${index}`, best.score);
      recordActivity('practiced');
      setMicState('idle');
    };
    rec.onerror = (e) => {
      if (e.error !== 'aborted') setResult({ recognized: '', score: 0, error: e.error });
      setMicState('idle');
    };
    rec.onend = () => setMicState((s) => (s === 'recording' ? 'idle' : s));
    rec.start();
  }

  return (
    <div className="prayer-shadow">
      <div className="prayer-shadow-progress">Line {index + 1} of {lines.length}</div>

      <div className="prayer-shadow-line">
        <span className="prayer-shadow-it">{line.it}</span>
        <div className="prayer-shadow-controls">
          <SpeakerButton word={line.it} size={26} rate={rate} />
          <button
            className={`prac-speed-btn${rate === 0.6 ? ' active' : ''}`}
            onClick={() => setRate(0.6)}
          >Slow</button>
          <button
            className={`prac-speed-btn${rate === 0.85 ? ' active' : ''}`}
            onClick={() => setRate(0.85)}
          >Normal</button>
        </div>
        <span className="prayer-shadow-en">{line.en}</span>
      </div>

      <button
        className={`pronun-mic-btn pronun-mic-${micState}`}
        onClick={handleMic}
        disabled={micState === 'processing'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
          <path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span>
          {micState === 'recording' ? 'Listening… (tap to stop)'
            : micState === 'processing' ? 'Processing…'
              : 'Listen, then repeat it'}
        </span>
      </button>

      {result && (
        <div className="pronun-result">
          {result.error ? (
            <div className="pronun-recognized-error">Could not hear clearly — try again.</div>
          ) : (
            <>
              <div className={`pronun-score-badge ${result.score >= 85 ? 'pronun-score-great' : result.score >= 60 ? 'pronun-score-good' : 'pronun-score-low'}`}>
                {result.score}% — {result.score >= 85 ? 'Ottimo!' : result.score >= 60 ? 'Bene!' : 'Riprova'}
              </div>
              <div className="prayer-shadow-heard">Heard: “{result.recognized}”</div>
            </>
          )}
        </div>
      )}

      <div className="prac-actions">
        <button
          className="prac-again-btn"
          onClick={() => { setIndex((i) => Math.max(0, i - 1)); setResult(null); }}
          disabled={index === 0}
        >
          ← Previous
        </button>
        <button
          className="prac-known-btn"
          onClick={() => { setIndex((i) => Math.min(lines.length - 1, i + 1)); setResult(null); }}
          disabled={index >= lines.length - 1}
        >
          Next line →
        </button>
      </div>
    </div>
  );
}

function RecallMode({ prayer }) {
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const lines = (prayer.lines ?? []).map((l) => ({ line: l, parts: splitOnBlank(l) })).filter((x) => x.parts);

  if (!lines.length) {
    return <div className="prayer-mode-empty">This text has no line-by-line version yet.</div>;
  }

  return (
    <div className="prayer-recall">
      <div className="prayer-recall-intro">
        Fill the missing word in each line. These are the words that carry the
        grammar — the subjunctives, the fused prepositions, the attached pronouns.
      </div>
      <ol className="prayer-recall-list">
        {lines.map(({ line, parts }, i) => {
          const given = answers[i] ?? '';
          const isRevealed = !!revealed[i];
          const ok = isRevealed && checkDrill(parts.answer, given);
          return (
            <li className="prayer-recall-item" key={i}>
              <div className="prayer-recall-line">
                {parts.before}
                {isRevealed
                  ? <span className={`prayer-recall-answer${ok ? ' drill-ok-text' : ' drill-no-text'}`}>{parts.answer}</span>
                  : <input
                      className="drill-input prayer-recall-input"
                      value={given}
                      onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') setRevealed((r) => ({ ...r, [i]: true })); }}
                      aria-label={`Missing word in: ${line.en}`}
                    />}
                {parts.after}
                <SpeakerButton word={line.it} size={13} />
              </div>
              <div className="prayer-recall-en">{line.en}</div>
              {!isRevealed ? (
                <button className="drill-check" onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}>Check</button>
              ) : (
                <button
                  className="drill-check"
                  onClick={() => { setRevealed((r) => ({ ...r, [i]: false })); setAnswers((a) => ({ ...a, [i]: '' })); }}
                >Retry</button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const MODES = [
  { id: 'read', label: 'Read' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'recall', label: 'Recall' },
];

function PrayerCard({ prayer }) {
  const [mode, setMode] = useState('read');
  const hasLines = !!prayer.lines?.length;

  return (
    <div className="prayer-card">
      <div className="prayer-card-header">
        <div className="prayer-card-titles">
          <span className="prayer-title-it">{prayer.title}</span>
          <span className="prayer-title-en">{prayer.titleEn}</span>
        </div>
        <SpeakerButton word={prayer.it} size={18} />
      </div>

      {(prayer.note || prayer.noteEn) && (
        <p className="prayer-note">{prayer.note || prayer.noteEn}</p>
      )}

      {/* What this text teaches, and where it meets the syllabus. */}
      {prayer.focus && (
        <div className="prayer-focus">
          <span className="prayer-focus-label">Grammar in this text</span>
          <span className="prayer-focus-text">{prayer.focus.text}</span>
          {prayer.focus.weeks?.length > 0 && (
            <span className="prayer-focus-weeks">
              Course {prayer.focus.weeks.length === 1 ? 'week' : 'weeks'} {prayer.focus.weeks.join(' · ')}
            </span>
          )}
        </div>
      )}

      {hasLines && (
        <div className="prayer-modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`prayer-mode-btn${mode === m.id ? ' active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {mode === 'read' || !hasLines ? <ReadMode prayer={prayer} />
        : mode === 'shadow' ? <ShadowMode prayer={prayer} />
          : <RecallMode prayer={prayer} />}
    </div>
  );
}

function PrayerSection({ section }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="prayer-section">
      <button
        className="prayer-section-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="prayer-section-titles">
          <span className="prayer-section-title">{section.title}</span>
          <span className="prayer-section-title-en">{section.titleEn}</span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="prayer-section-body">
          {(section.intro || section.introEn) && (
            <p className="prayer-section-intro">{section.intro || section.introEn}</p>
          )}
          <div className="prayer-list">
            {section.prayers.map((prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DevotionsTab() {
  if (!devotionSections.length) return null;
  return (
    <div className="prayers-wrap">
      <div className="prayers-header">
        <h2 className="prayers-heading">Preghiere</h2>
        <p className="prayers-subheading">Catholic Prayers in Italian</p>
      </div>
      <div className="prayers-why">
        You already know these by heart in English — which makes them the easiest
        Italian you will ever understand, and the best material for building
        chunks you can actually say. <strong>Read</strong> them line by line,
        <strong> Shadow</strong> them aloud for pronunciation, or
        <strong> Recall</strong> the word that carries the grammar.
      </div>
      {devotionSections.map((section) => (
        <PrayerSection key={section.id} section={section} />
      ))}
    </div>
  );
}
