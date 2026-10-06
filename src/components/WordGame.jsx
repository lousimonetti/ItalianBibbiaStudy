import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MAX_GUESSES, fold, getDailyWord, getPracticeWord, isKnownWord, scoreGuess, keyboardStates,
  gameStatus, shareGrid,
} from '../utils/wordGame';
import { loadGame, saveGame, setWordProgress, wordDay, liveStreak } from '../utils/gameStore';
import { todayStr, recordActivity } from '../utils/streak';
import { SpeakerButton } from './SpeakerButton';
import { Confetti } from './Confetti';
import { HAS_IPA } from '../utils/locale';
import { storageKey } from '../utils/storageKey';
import { useImmersion } from '../i18n/ImmersionContext';
import { UI_STRINGS } from '../i18n/strings';
import { UiText } from '../i18n/UiText';

const HOWTO_KEY = storageKey('game-howto');
const HINT_AFTER = 3;

function readSeen() {
  try { return localStorage.getItem(HOWTO_KEY) === '1'; } catch { return false; }
}
function writeSeen() {
  try { localStorage.setItem(HOWTO_KEY, '1'); } catch { /* not remembered */ }
}

// Inline (not modal) so the keyboard keeps working while it is open.
function HowToPlay({ onClose }) {
  const rows = [
    ['correct', 'S', 'correct'], ['present', 'O', 'present'], ['absent', 'L', 'absent'],
  ];
  return (
    <div className="game-howto" role="region" aria-label="How to play">
      <div className="game-howto-title"><UiText k="game.howto.title" /></div>
      <p><UiText k="game.howto.body" /></p>
      <ul className="game-howto-list">
        {rows.map(([k, letter, state]) => (
          <li key={k}>
            <div className={`game-sample game-sample--${state}`}>{letter}</div>
            <span><UiText k={`game.howto.${k}`} /></span>
          </li>
        ))}
      </ul>
      <p className="game-howto-note"><UiText k="game.howto.note" /></p>
      <button className="prac-drill-btn" onClick={onClose}><UiText k="game.howto.close" /></button>
    </div>
  );
}

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

// `practice` is a word object for an unrecorded extra round; `onExit` returns
// to the daily. Practice never touches the stats, the day record or the streak.
export function WordGame({ practice = null, onExit = null }) {
  const { immersive } = useImmersion();
  const say = useCallback((key, vars = {}) => {
    const e = UI_STRINGS[key];
    const t = immersive ? e.it : e.en;
    return t.replace(/\{(\w+)\}/g, (_, v) => vars[v]);
  }, [immersive]);
  const today = todayStr();
  const answer = useMemo(() => practice || getDailyWord(today), [today, practice]);

  const [store, setStore] = useState(loadGame);
  const saved = practice ? null : wordDay(store, today);
  const [guesses, setGuesses] = useState(() => saved?.guesses || []);
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState('');
  // A guess the course dictionary doesn't know is a warning, not a wall: the
  // dictionary is this course's word list, not all of Italian, so refusing
  // outright would mean refusing real words. Enter a second time plays it.
  const [unknownPending, setUnknownPending] = useState('');
  const [shared, setShared] = useState(false);
  const [extra, setExtra] = useState(null);
  const [showHowTo, setShowHowTo] = useState(() => !readSeen());
  const [hints, setHints] = useState(0);
  const [revealRow, setRevealRow] = useState(-1);
  const [shake, setShake] = useState(false);
  const closeHowTo = () => { writeSeen(); setShowHowTo(false); };
  const rejectGuess = useCallback((msg) => {
    setMessage(msg);
    setShake(true);
    setTimeout(() => setShake(false), 450);
  }, []);

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
    setRevealRow(next.length - 1);
    setTyped('');
    setUnknownPending('');
    const nextStatus = gameStatus(next, answer.word);
    if (!practice) setStore((s) => saveGame(setWordProgress(s, today, next, nextStatus)));
    if (nextStatus !== 'playing') {
      setMessage('');
      if (!practice) recordActivity('practiced');
    }
  }, [guesses, answer, today, practice]);

  const submit = useCallback(() => {
    if (over || !answer) return;
    const guess = fold(typed);
    if (guess.length !== len) {
      rejectGuess(say('game.msg.length', { n: len }));
      return;
    }
    if (!isKnownWord(guess) && unknownPending !== guess) {
      setUnknownPending(guess);
      rejectGuess(say('game.msg.unknown'));
      return;
    }
    commit(guess);
  }, [typed, len, over, answer, unknownPending, commit, rejectGuess, say]);

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
    const text = shareGrid(guesses, answer.word, { date: today })
      + (hints ? `\n💡 ×${hints}` : '');
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      setMessage(say('game.msg.copyFail'));
    }
  }

  if (extra && !practice) {
    // Remount per word so each practice round starts from a clean grid.
    return <WordGame key={extra.word} practice={extra} onExit={() => setExtra(null)} />;
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
  const canHint = !over && guesses.length >= HINT_AFTER && hints < 2;

  return (
    <div className="game-word">
      {status === 'won' && <Confetti />}

      <div className="game-head">
        <div className="game-head-title">{practice ? <UiText k="game.practice.title" /> : 'Parola del giorno'}</div>
        <div className="game-head-sub">
          {len} lettere · {MAX_GUESSES} tentativi · una parola del corso
        </div>
      </div>

      {showHowTo ? (
        <HowToPlay onClose={closeHowTo} />
      ) : (
        <button className="game-howto-btn" onClick={() => setShowHowTo(true)}>
          ? <UiText k="game.howto.open" />
        </button>
      )}

      <div className="game-grid" style={{ '--game-cols': len }}>
        {rows.map((row, r) => (
          <div
            className={`game-row${r === revealRow ? ' game-row--reveal' : ''}${r === guesses.length && shake ? ' game-row--shake' : ''}`}
            key={r}
          >
            {row.map((cell, c) => (
              <Tile key={c} letter={cell.letter} state={cell.state} filled={!!cell.letter} />
            ))}
          </div>
        ))}
      </div>

      <div className={`game-msg${message ? ' game-msg--on' : ''}`} role="status">{message}</div>

      {!over && hints > 0 && (
        <div className="game-hints">
          <span><UiText k="game.hint.meaning" />: <b>{answer.en}</b></span>
          {hints > 1 && (
            <span><UiText k="game.hint.first" /> <b>{answer.word[0].toUpperCase()}</b></span>
          )}
        </div>
      )}
      {canHint && (
        <button className="game-hint-btn" onClick={() => setHints((h) => h + 1)}>
          <UiText k={hints === 0 ? 'game.hint.gloss' : 'game.hint.letter'} />
        </button>
      )}

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
            {!practice && (
              <button className="prac-drill-btn" onClick={share}>
                {shared ? 'Copiato ✓' : 'Condividi il risultato'}
              </button>
            )}
            <button
              className="prac-drill-btn"
              onClick={() => (practice
                ? onExit()
                : setExtra(getPracticeWord(Date.now(), answer.word)))}
            >
              <UiText k={practice ? 'game.practice.back' : 'game.practice.another'} />
            </button>
          </div>
          <div className="game-reveal-next">
            {practice
              ? <UiText k="game.practice.note" />
              : 'Una parola nuova ogni giorno a mezzanotte.'}
          </div>
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

      {!practice && <div className="game-stats">
        <div className="game-stat"><b>{stats.played}</b><span>giocate</span></div>
        <div className="game-stat">
          <b>{stats.played ? Math.round((stats.won / stats.played) * 100) : 0}%</b><span>vinte</span>
        </div>
        <div className="game-stat"><b>{streak}</b><span>di fila</span></div>
        <div className="game-stat"><b>{stats.best}</b><span>record</span></div>
      </div>}
    </div>
  );
}
