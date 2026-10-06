import { useState } from 'react';
import { WordGame } from './WordGame';
import { QuizGame } from './QuizGame';
import { UiText } from '../i18n/UiText';
import { loadGame, wordDay, quizDay } from '../utils/gameStore';
import { todayStr } from '../utils/streak';

// A check once today's game is finished, a dot while it is still waiting.
function Marker({ done }) {
  return done
    ? <span className="game-done" aria-label="done today">✓</span>
    : <span className="game-todo" aria-label="not played yet" />;
}

// The Gioco tab — two daily games over the course's own content. Both are
// deterministic per date, both are playable offline, and both tick the study
// streak. Deliberately small: a game that takes five minutes is a game people
// come back to, and coming back is the point.
export function GameTab() {
  const [mode, setMode] = useState('word');
  // Re-read on every render: switching modes remounts the game, so a round
  // finished a moment ago is already in storage by the time this runs.
  const store = loadGame();
  const today = todayStr();
  const wordDone = (() => { const d = wordDay(store, today); return !!d && d.status !== 'playing'; })();
  const quizDone = !!quizDay(store, today);

  return (
    <div className="fc-wrap">
      <div className="fc-mode-toggle">
        <button
          className={`fc-mode-btn${mode === 'word' ? ' active' : ''}`}
          onClick={() => setMode('word')}
        >
          <UiText k="game.word" /><Marker done={wordDone} />
        </button>
        <button
          className={`fc-mode-btn${mode === 'quiz' ? ' active' : ''}`}
          onClick={() => setMode('quiz')}
        >
          <UiText k="game.quiz" /><Marker done={quizDone} />
        </button>
      </div>

      {mode === 'word' ? <WordGame /> : <QuizGame />}
    </div>
  );
}
