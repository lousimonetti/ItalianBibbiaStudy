import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MAX_GUESSES, fold, getDailyWord, isKnownWord, scoreGuess, keyboardStates,
  gameStatus, shareGrid,
} from '../utils/wordGame';
import { loadGame, saveGame, setWordProgress, wordDay, liveStreak } from '../utils/gameStore';
import { todayStr, recordActivity } from '../utils/streak';
import { SpeakerButton } from './SpeakerButton';
import { Confetti } from './Confetti';
import { HAS_IPA } from '../utils/locale';

// "Parola del giorno" — one Italian word a day, six tries, drawn from the
// course's own vocabulary. The point isn't the puzzle: it's the card at the end,
// which hands back the gloss, the pronunciation and the verse the word lives in.
// Everything deterministic lives in src/utils/wordGame.js; this file is the
// grid, the keyboard and the reveal.

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function Tile({ letter, state, filled }) {
  const cls = ['game-tile', state ? `game-tile--${state}` : '', filled ? 'game-tile--filled' : '']
    .filter(Boolean).join(' ');
  return <div className={cls}>{letter || ''}</div>;
}

export function WordGame() {
  const today = todayStr();
  const answer = useMemo(() => getDailyWord(today), [today]);

  const [store, setStore] = useState(loadGame);
  const saved = wordDay(store, today);
  const [guesses, setGuesses] = useState(() => saved?.guesses || []);
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState('');
  // A guess the course dictionary doesn't know is a warning, not a wall: the
  // dictionary is this course's word list, not all of Italian, so refusing
  // outright would mean refusing real words. Enter a second time plays it.
  const [unknownPending, setUnknownPending] = useState('');
  const [shared, setShared] = useState(false);

  const status = answer ? gameStatus(guesses, answer.word) : 'playing';
  const over = status !== 'playing';
  const len = answer ? answer.word.length : 0;
  const keyStates = useMemo(
    () => (answer ? keyboardStates(guesses, answer.word) : {}),
    [guesses, answer],
  );

  const commit = useCallback((guess) => {
    const next = [...guesses, guess];
    setGuesses(next);
    setTyped('');
    setUnknownPending('');
    const nextStatus = gameStatus(next, answer.word);
    setStore((s) => saveGame(setWordProgress(s, today, next, nextStatus)));
    if (nextStatus !== 'playing') {
      setMessage('');
      recordActivity('practiced');
    }
  }, [guesses, answer, today]);

  const submit = useCallback(() => {
    if (over || !answer) return;
    const guess = fold(typed);
    if (guess.length !== len) {
      setMessage(`Serve una parola di ${len} lettere`);
      return;
    }
    if (!isKnownWord(guess) && unknownPending !== guess) {
      setUnknownPending(guess);
      setMessage('Non è nel vocabolario del corso — invio di nuovo per giocarla comunque');
      return;
    }
    commit(guess);
  }, [typed, len, over, answer, unknownPending, commit]);

  const press = useCallback((key) => {
    if (over) return;
    setMessage('');
    if (key === 'enter') { submit(); return; }
    if (key === 'back') { setTyped((t) => t.slice(0, -1)); setUnknownPending(''); return; }
    setTyped((t) => (t.length >= len ? t : t + key));
  }, [over, submit, len]);

  // Physical keyboard, for anyone playing at a desk.
  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') { press('enter'); return; }
      if (e.key === 'Backspace') { press('back'); return; }
      const ch = fold(e.key);
      if (ch.length === 1 && e.key.length === 1) press(ch);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  // The message is transient — it should not sit on screen for the rest of the
  // round. The pending-override warning stays until the player acts on it.
  useEffect(() => {
    if (!message || unknownPending) return undefined;
    const t = setTimeout(() => setMessage(''), 2200);
    return () => clearTimeout(t);
  }, [message, unknownPending]);

  async function share() {
    const text = shareGrid(guesses, answer.word, { date: today });
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      setMessage('Copia non riuscita');
    }
  }

  if (!answer) {
    return <div className="game-empty">This course has no words short enough to play with yet.</div>;
  }

  const stats = store.word.stats;
  const streak = liveStreak(stats, today);
  const rows = Array.from({ length: MAX_GUESSES }, (_, r) => {
    if (r < guesses.length) {
      const g = fold(guesses[r]);
      const marks = scoreGuess(g, answer.word);
      return Array.from({ length: len }, (_, c) => ({ letter: g[c], state: marks[c] }));
    }
    if (r === guesses.length && !over) {
      return Array.from({ length: len }, (_, c) => ({ letter: typed[c], state: null }));
    }
    return Array.from({ length: len }, () => ({ letter: '', state: null }));
  });

  return (
    <div className="game-word">
      {status === 'won' && <Confetti />}

      <div className="game-head">
        <div className="game-head-title">Parola del giorno</div>
        <div className="game-head-sub">
          {len} lettere · {MAX_GUESSES} tentativi · una parola del corso
        </div>
      </div>

      <div className="game-grid" style={{ '--game-cols': len }}>
        {rows.map((row, r) => (
          <div className="game-row" key={r}>
            {row.map((cell, c) => (
              <Tile key={c} letter={cell.letter} state={cell.state} filled={!!cell.letter} />
            ))}
          </div>
        ))}
      </div>

      <div className={`game-msg${message ? ' game-msg--on' : ''}`} role="status">{message}</div>

      {over ? (
        <div className="game-reveal">
          <div className="game-reveal-verdict">
            {status === 'won'
              ? `Bravo! ${guesses.length}/${MAX_GUESSES}`
              : 'Domani va meglio — la parola era:'}
          </div>
          <div className="game-reveal-word">
            <span className="game-reveal-it">{answer.term}</span>
            <SpeakerButton word={answer.term} />
          </div>
          <div className="game-reveal-en">{answer.en}</div>
          {HAS_IPA && answer.ipa && <div className="game-reveal-ipa">{answer.ipa}</div>}
          {answer.ex && (
            <div className="game-reveal-ex">
              <span className="game-reveal-ex-it">{answer.ex}</span>
              <SpeakerButton word={answer.ex} size={16} />
              {answer.exEn && <div className="game-reveal-ex-en">{answer.exEn}</div>}
            </div>
          )}
          <div className="game-reveal-src">Settimana {answer.weekN} · {answer.reading}</div>
          <div className="game-reveal-actions">
            <button className="prac-drill-btn" onClick={share}>
              {shared ? 'Copiato ✓' : 'Condividi il risultato'}
            </button>
          </div>
          <div className="game-reveal-next">Una parola nuova ogni giorno a mezzanotte.</div>
        </div>
      ) : (
        <div className="game-keyboard">
          {ROWS.map((row, i) => (
            <div className="game-kb-row" key={row}>
              {i === 2 && (
                <button className="game-key game-key--wide" onClick={() => press('enter')}>
                  Invio
                </button>
              )}
              {row.split('').map((ch) => (
                <button
                  key={ch}
                  className={`game-key${keyStates[ch] ? ` game-key--${keyStates[ch]}` : ''}`}
                  onClick={() => press(ch)}
                  aria-label={ch}
                >
                  {ch}
                </button>
              ))}
              {i === 2 && (
                <button
                  className="game-key game-key--wide"
                  onClick={() => press('back')}
                  aria-label="Cancella"
                >
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="game-stats">
        <div className="game-stat"><b>{stats.played}</b><span>giocate</span></div>
        <div className="game-stat">
          <b>{stats.played ? Math.round((stats.won / stats.played) * 100) : 0}%</b><span>vinte</span>
        </div>
        <div className="game-stat"><b>{streak}</b><span>di fila</span></div>
        <div className="game-stat"><b>{stats.best}</b><span>record</span></div>
      </div>
    </div>
  );
}
