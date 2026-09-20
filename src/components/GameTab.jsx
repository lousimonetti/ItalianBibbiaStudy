import { useState } from 'react';
import { WordGame } from './WordGame';
import { QuizGame } from './QuizGame';
import { UiText } from '../i18n/UiText';

// The Gioco tab — two daily games over the course's own content. Both are
// deterministic per date, both are playable offline, and both tick the study
// streak. Deliberately small: a game that takes five minutes is a game people
// come back to, and coming back is the point.
export function GameTab() {
  const [mode, setMode] = useState('word');

  return (
    <div className="fc-wrap">
      <div className="fc-mode-toggle">
        <button
          className={`fc-mode-btn${mode === 'word' ? ' active' : ''}`}
          onClick={() => setMode('word')}
        >
          <UiText k="game.word" />
        </button>
        <button
          className={`fc-mode-btn${mode === 'quiz' ? ' active' : ''}`}
          onClick={() => setMode('quiz')}
        >
          <UiText k="game.quiz" />
        </button>
      </div>

      {mode === 'word' ? <WordGame /> : <QuizGame />}
    </div>
  );
}
