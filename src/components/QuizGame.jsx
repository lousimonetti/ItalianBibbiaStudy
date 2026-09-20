import { useMemo, useState } from 'react';
import { buildQuiz, QUIZ_LENGTH } from '../utils/quizGame';
import { loadGame, saveGame, recordQuiz, quizDay, liveStreak } from '../utils/gameStore';
import { todayStr, recordActivity } from '../utils/streak';
import { getCurrentWeekN } from '../utils/schedule';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';
import { Confetti } from './Confetti';

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

  function start(replay = false) {
    const questions = replay
      ? buildQuiz({ date: today, weekMax, salt: `replay|${Date.now()}` })
      : todayQuestions;
    // `recordQuiz` itself counts only the day's first finish, so a replay needs
    // no flag here — it still updates the day's best score.
    setRound({ questions });
    setIndex(0);
    setPicked(null);
    setResults([]);
  }

  function choose(optionIndex) {
    if (picked !== null) return;
    setPicked(optionIndex);
  }

  function next() {
    const q = round.questions[index];
    const log = [...results, { q, picked, correct: picked === q.answer }];
    setResults(log);
    setPicked(null);
    if (index + 1 >= round.questions.length) {
      const score = log.filter((r) => r.correct).length;
      setStore((s) => saveGame(recordQuiz(s, today, score, log.length)));
      recordActivity('practiced');
      setIndex(index + 1);
      return;
    }
    setIndex(index + 1);
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
        <div className="prac-end-actions">
          <button className="prac-restart-btn" onClick={() => setRound(null)}>Torna all'inizio</button>
          <button className="prac-drill-btn" onClick={() => start(true)}>Un'altra sfida</button>
        </div>
      </div>
    );
  }

  // ── a question ────────────────────────────────────────────────────────────
  const q = round.questions[index];
  const answered = picked !== null;

  return (
    <div className="quiz-play">
      <div className="quiz-bar">
        <div className="quiz-bar-fill" style={{ width: `${(index / round.questions.length) * 100}%` }} />
      </div>
      <div className="quiz-meta">
        <span className="quiz-kind">{q.label.it}</span>
        <span className="quiz-count">{index + 1} / {round.questions.length}</span>
      </div>

      <Prompt q={q} />

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
              onClick={() => choose(i)}
              disabled={answered}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
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
