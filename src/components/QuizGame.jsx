import { useEffect, useMemo, useState } from 'react';
import { buildQuiz, QUIZ_LENGTH, vocabPool, weeksInScope, shareQuiz } from '../utils/quizGame';
import { struggleList } from '../utils/wordStats';
import { storageKey } from '../utils/storageKey';
import { PHASES } from '../data/studyData';
import { loadGame, saveGame, recordQuiz, quizDay, liveStreak } from '../utils/gameStore';
import { todayStr, recordActivity } from '../utils/streak';
import { getCurrentWeekN } from '../utils/schedule';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';
import { Confetti } from './Confetti';
import { UiText } from '../i18n/UiText';

// "Sfida del giorno" — ten questions pulled from every kind of course content:
// vocabulary both directions, a grammar drill, two verses, a prayer line, a
// comprehension check. Same round for everyone on a given date (see
// quizGame.js), and only the first round of the day counts.
//
// Deliberately multiple-choice: recognition is the right demand for a two-minute
// game, and the typed-production surfaces already exist in Practice. For the
// same reason a round does NOT grade into the SRS — a one-in-four guess is not
// evidence of recall, and polluting the scheduler with it would make the real
// review sessions lie.

const LIGHTNING_SECONDS = 60;

function readStore(name) {
  try { return JSON.parse(localStorage.getItem(storageKey(name))) || {}; } catch { return {}; }
}

function Prompt({ q }) {
  return (
    <div className="quiz-prompt-wrap">
      <div className={`quiz-prompt${q.promptLang === 'en' ? ' quiz-prompt--en' : ''}`}>
        {q.prompt}
      </div>
      {q.audio && q.promptLang !== 'en' && <SpeakerButton word={q.audio} size={18} />}
    </div>
  );
}

export function QuizGame() {
  const today = todayStr();
  const currentWeek = getCurrentWeekN();

  const [store, setStore] = useState(loadGame);
  const [scope, setScope] = useState(currentWeek ? 'sofar' : 'all');
  const [round, setRound] = useState(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(LIGHTNING_SECONDS);
  const [shared, setShared] = useState(false);

  const weekMax = scope === 'sofar' && currentWeek ? currentWeek : null;
  const played = quizDay(store, today);
  const stats = store.quiz.stats;
  const streak = liveStreak(stats, today);

  // Today's official round. A replay gets a different salt, so it is a genuinely
  // different set of questions rather than the same ten again.
  const todayQuestions = useMemo(
    () => buildQuiz({ date: today, weekMax }),
    [today, weekMax],
  );

  // Vocabulary the learner keeps missing in Practice, for the focus round.
  const trickyTerms = useMemo(() => {
    const cards = vocabPool(weeksInScope(PHASES, null));
    return struggleList(cards, readStore('srs'), readStore('pronun'), { limit: 8 }).map((r) => r.card.it);
  }, []);

  // mode: 'daily' (official, counts) | 'lightning' | 'focus' (practice, don't count)
  function start(replay = false, mode = 'daily') {
    const salt = `replay|${Date.now()}`;
    let questions;
    if (mode === 'lightning') questions = buildQuiz({ date: today, weekMax, salt, count: 60 });
    else if (mode === 'focus') questions = buildQuiz({ date: today, salt, terms: trickyTerms });
    else questions = replay ? buildQuiz({ date: today, weekMax, salt }) : todayQuestions;
    setTimeLeft(LIGHTNING_SECONDS);
    setShared(false);
    // `recordQuiz` itself counts only the day's first finish, so a replay needs
    // no flag here — it still updates the day's best score.
    setRound({ questions, mode });
    setIndex(0);
    setPicked(null);
    setResults([]);
  }

  function choose(optionIndex) {
    if (picked !== null) return;
    setPicked(optionIndex);
    // A short buzz where the device offers one: a tick for right, two for wrong.
    try {
      navigator.vibrate?.(optionIndex === round.questions[index].answer ? 15 : [30, 40, 30]);
    } catch { /* no haptics */ }
  }

  function next() {
    const q = round.questions[index];
    const log = [...results, { q, picked, correct: picked === q.answer }];
    setResults(log);
    setPicked(null);
    if (index + 1 >= round.questions.length) {
      const score = log.filter((r) => r.correct).length;
      if (round.mode === 'daily') setStore((s) => saveGame(recordQuiz(s, today, score, log.length)));
      recordActivity('practiced');
      setIndex(index + 1);
      return;
    }
    setIndex(index + 1);
  }

  const lightning = round?.mode === 'lightning';
  const lightningOver = lightning && timeLeft <= 0;

  // Lightning: a one-second ticker; at zero the round ends with what was answered.
  useEffect(() => {
    if (!lightning || index >= round.questions.length) return undefined;
    if (timeLeft <= 0) {
      setIndex(round.questions.length);
      recordActivity('practiced');
      return undefined;
    }
    const t = setTimeout(() => setTimeLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [lightning, timeLeft, index, round]);

  // Lightning moves on by itself shortly after an answer — no tapping Avanti.
  useEffect(() => {
    if (!lightning || picked === null || lightningOver) return undefined;
    const t = setTimeout(next, 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightning, picked]);

  // Desktop: 1-4 pick an option, Enter / Space moves on once answered.
  useEffect(() => {
    if (!round || index >= round.questions.length) return undefined;
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const q = round.questions[index];
      if (picked === null) {
        const n = Number(e.key);
        if (n >= 1 && n <= q.options.length) choose(n - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function shareRound() {
    try {
      await navigator.clipboard.writeText(shareQuiz(results, {
        date: today,
        title: round.mode === 'lightning' ? 'Sfida ⚡' : round.mode === 'focus' ? 'Sfida 🎯' : 'Sfida',
      }));
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  // ── start screen ──────────────────────────────────────────────────────────
  if (!round) {
    return (
      <div className="game-start">
        <div className="game-head-title">Sfida del giorno</div>
        <p className="game-start-sub">
          Ten questions across everything the course teaches — words, grammar,
          the week's verses, the prayers. Same round for everyone today.
        </p>

        {currentWeek && (
          <div className="quiz-scope">
            <button
              className={`fc-mode-btn${scope === 'sofar' ? ' active' : ''}`}
              onClick={() => setScope('sofar')}
            >
              Fino alla sett. {currentWeek}
            </button>
            <button
              className={`fc-mode-btn${scope === 'all' ? ' active' : ''}`}
              onClick={() => setScope('all')}
            >
              Tutto il corso
            </button>
          </div>
        )}

        {played && (
          <div className="quiz-done-note">
            Oggi hai fatto <b>{played.score}/{played.total}</b>. Puoi rigiocare — non conta due volte.
          </div>
        )}

        <div className="game-start-actions">
          <button className="game-start-btn" onClick={() => start(!!played)}>
            {played ? 'Rigioca' : `Inizia · ${Math.min(QUIZ_LENGTH, todayQuestions.length)} domande`}
          </button>
        </div>
        <div className="quiz-extra-modes">
          <button className="prac-drill-btn" onClick={() => start(true, 'lightning')}>
            ⚡ <UiText k="game.quiz.lightning" />
          </button>
          <button
            className="prac-drill-btn"
            disabled={trickyTerms.length === 0}
            onClick={() => start(true, 'focus')}
            title={trickyTerms.length === 0 ? 'No tricky words yet' : undefined}
          >
            🎯 <UiText k={trickyTerms.length ? 'game.quiz.focus' : 'game.quiz.focusNone'} />
          </button>
        </div>

        <div className="game-stats">
          <div className="game-stat"><b>{stats.played}</b><span>sfide</span></div>
          <div className="game-stat">
            <b>{stats.asked ? Math.round((stats.correct / stats.asked) * 100) : 0}%</b>
            <span>corrette</span>
          </div>
          <div className="game-stat"><b>{streak}</b><span>di fila</span></div>
          <div className="game-stat"><b>{stats.best}</b><span>record</span></div>
        </div>
      </div>
    );
  }

  // ── end screen ────────────────────────────────────────────────────────────
  if (index >= round.questions.length) {
    const score = results.filter((r) => r.correct).length;
    const missed = results.filter((r) => !r.correct);
    const perfect = score === results.length;
    return (
      <div className="prac-end">
        {perfect && <Confetti />}
        <div className="prac-end-score">{score}/{results.length}</div>
        <div className="prac-end-label">{perfect ? 'Tutto giusto!' : 'Sfida completata'}</div>
        {missed.length > 0 && (
          <div className="trap-end-review">
            <div className="trap-end-review-title">Da rivedere:</div>
            <ul className="trap-end-list">
              {missed.map((r, i) => (
                <li key={i}>
                  <span className="trap-end-cat">{r.q.label.it}</span>
                  <span className="trap-end-it">
                    {r.q.prompt} → <b>{r.q.options[r.q.answer]}</b>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {round.mode !== 'daily' && (
          <div className="quiz-done-note">
            {lightning && <><b><UiText k="game.quiz.timeUp" /></b>{' '}</>}
            <UiText k="game.quiz.unofficial" />
          </div>
        )}
        <div className="prac-end-actions">
          <button className="prac-restart-btn" onClick={() => setRound(null)}>Torna all'inizio</button>
          <button className="prac-drill-btn" onClick={() => start(true, round.mode)}>Un'altra sfida</button>
          <button className="prac-drill-btn" onClick={shareRound}>
            <UiText k={shared ? 'game.quiz.copied' : 'game.quiz.share'} />
          </button>
        </div>
      </div>
    );
  }

  // ── a question ────────────────────────────────────────────────────────────
  const q = round.questions[index];
  const answered = picked !== null;
  // Consecutive right answers so far (counting this one once it is answered).
  let combo = 0;
  for (let i = results.length - 1; i >= 0 && results[i].correct; i--) combo++;
  if (answered && picked === q.answer) combo++;

  return (
    <div className="quiz-play">
      <div className="quiz-bar">
        <div
          className="quiz-bar-fill"
          style={{ width: `${lightning ? (timeLeft / LIGHTNING_SECONDS) * 100 : (index / round.questions.length) * 100}%` }}
        />
      </div>
      <div className="quiz-meta">
        <span className="quiz-kind">{q.label.it}</span>
        <span className="quiz-count">
          {lightning ? `⏱ ${timeLeft}s · ${results.filter((r) => r.correct).length} ✓` : `${index + 1} / ${round.questions.length}`}
        </span>
      </div>

      <Prompt q={q} />
      <div className="quiz-combo" aria-live="polite">
        {combo >= 3 ? <>🔥 {combo} · <UiText k="game.streak.cheer" /></> : ''}
      </div>

      <div className="quiz-options">
        {q.options.map((opt, i) => {
          const state = !answered
            ? ''
            : i === q.answer
              ? ' quiz-opt--right'
              : i === picked
                ? ' quiz-opt--wrong'
                : ' quiz-opt--dim';
          return (
            <button
              key={i}
              className={`quiz-opt${state}`}
              data-key={i + 1}
              onClick={() => choose(i)}
              disabled={answered}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && lightning && (
        <div className={`quiz-verdict${picked === q.answer ? ' ok' : ' no'}`}>
          {picked === q.answer ? 'Giusto' : `La risposta era: ${q.options[q.answer]}`}
        </div>
      )}
      {answered && !lightning && (
        <div className="quiz-after">
          <div className={`quiz-verdict${picked === q.answer ? ' ok' : ' no'}`}>
            {picked === q.answer ? 'Giusto' : `La risposta era: ${q.options[q.answer]}`}
          </div>
          {q.explainIt && (
            <div className="quiz-explain">
              <WordGloss text={q.explainIt} />
              <SpeakerButton word={q.explainIt} size={15} />
            </div>
          )}
          {q.explainEn && <div className="quiz-explain-en">{q.explainEn}</div>}
          {q.source && <div className="quiz-source">{q.source}</div>}
          <button className="prac-drill-btn" onClick={next}>
            {index + 1 >= round.questions.length ? 'Risultato' : 'Avanti'}
          </button>
        </div>
      )}
    </div>
  );
}
