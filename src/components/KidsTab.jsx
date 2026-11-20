import { useEffect, useRef, useState } from 'react';
import { kids } from '../../course/kids';
import { devotionSections } from '../../course/devotions';
import { TTS_LANG } from '../utils/locale';
import { getSelectedVoice } from '../utils/voicePreference';
import { playSfx } from '../utils/sfx';
import { Confetti } from './Confetti';
import {
  allWords, kidPrayers, listenRound, memoryBoard, flipCard, closeMiss, isFaceUp, boardDone,
  loadKids, saveKids, markFound, addStars, setLocked, foundCount, cheer, TRY_AGAIN, HOLD_MS,
} from '../utils/kids';

// Bambini: a corner of the app a small child can play in, with or without a
// parent. Everything is by ear and by picture, so it works before a child can
// read: tap a picture to hear its name, hear a word and find its picture, turn
// over pairs. Words found go into a sticker album. Nothing here touches the
// parent's reviews, streak or progress (see src/utils/kids.js).

const HAS_TTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
const WORDS = allWords(kids);
const PRAYERS = kidPrayers(kids, devotionSections);
// Slower than the adult default: little ones need the gaps between sounds.
const KID_RATE = 0.75;
const NEXT_DELAY = 1500;
const MISS_DELAY = 1100;

function speak(text, { onstart, onend } = {}) {
  if (!HAS_TTS || !text) { onend?.(); return; }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = TTS_LANG;
    const voice = getSelectedVoice();
    if (voice) utter.voice = voice;
    utter.rate = KID_RATE;
    if (onstart) utter.onstart = onstart;
    if (onend) { utter.onend = onend; utter.onerror = onend; }
    window.speechSynthesis.speak(utter);
  } catch {
    onend?.();
  }
}

function hush() {
  try { if (HAS_TTS) window.speechSynthesis.cancel(); } catch { /* nothing to stop */ }
}

// Italian first and large, English small underneath for the grown-up.
function Bi({ it, en }) {
  return (
    <>
      <span className="kids-it">{it}</span>
      {en && <span className="kids-en">{en}</span>}
    </>
  );
}

function Pic({ pic, className = '' }) {
  return <span className={`kids-pic ${className}`} aria-hidden="true">{pic}</span>;
}

function BackButton({ onClick }) {
  return (
    <button className="kids-back" onClick={() => { hush(); onClick(); }} aria-label="Indietro (back)">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function Stars({ total, filled }) {
  return (
    <div className="kids-stars" role="img" aria-label={`${filled} di ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`kids-star${i < filled ? ' on' : ''}`} aria-hidden="true">★</span>
      ))}
    </div>
  );
}

function Finished({ stars, onAgain, onBack }) {
  useEffect(() => {
    playSfx('done');
    speak('Evviva! Hai finito!');
  }, []);
  return (
    <div className="kids-finished">
      <Confetti />
      <Pic pic="🎉" className="kids-pic--xl" />
      <p className="kids-finished-title"><Bi it="Evviva! Hai finito!" en="Hooray! All done!" /></p>
      <p className="kids-finished-stars">+{stars} ★</p>
      <div className="kids-row">
        <button className="kids-btn kids-btn--primary" onClick={onAgain}><Bi it="Ancora!" en="Again!" /></button>
        <button className="kids-btn" onClick={onBack}><Bi it="Basta così" en="That's enough" /></button>
      </div>
    </div>
  );
}

// ── Guarda e ascolta: one big picture at a time ─────────────────────────────

function LookCards({ theme, onBack }) {
  const [i, setI] = useState(0);
  const word = theme.words[i];
  const go = (d) => {
    const n = (i + d + theme.words.length) % theme.words.length;
    setI(n);
    speak(theme.words[n].it);
  };
  return (
    <div className="kids-screen">
      <div className="kids-top">
        <BackButton onClick={onBack} />
        <h3 className="kids-title"><Bi it="Guarda e ascolta" en="Look and listen" /></h3>
      </div>
      <button className="kids-card-big" onClick={() => speak(word.it)} aria-label={`${word.it}: ascolta`}>
        <Pic pic={word.pic} className="kids-pic--xl" />
        <Bi it={word.it} en={word.en} />
        {HAS_TTS && <span className="kids-tap-hint">🔊</span>}
      </button>
      <div className="kids-row kids-row--nav">
        <button className="kids-arrow" onClick={() => go(-1)} aria-label="Indietro (previous)">‹</button>
        <span className="kids-count">{i + 1} / {theme.words.length}</span>
        <button className="kids-arrow" onClick={() => go(1)} aria-label="Avanti (next)">›</button>
      </div>
    </div>
  );
}

// ── Ascolta e trova: hear a word, tap its picture ───────────────────────────

function ListenFind({ theme, onBack, onFound }) {
  const deal = () => listenRound(theme.words, Math.random, { questions: 6, options: 3 });
  const [round, setRound] = useState(deal);
  const [qi, setQi] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [right, setRight] = useState(null);
  const timer = useRef(null);
  const q = round[qi];

  useEffect(() => {
    if (q) speak(q.answer.it);
  }, [q]);
  useEffect(() => () => { clearTimeout(timer.current); hush(); }, []);

  if (qi >= round.length) {
    return (
      <div className="kids-screen">
        <div className="kids-top"><BackButton onClick={onBack} /></div>
        <Finished
          stars={round.length}
          onAgain={() => { setRound(deal()); setQi(0); setWrong([]); setRight(null); }}
          onBack={onBack}
        />
      </div>
    );
  }

  const pick = (opt) => {
    if (right) return;
    if (opt.it === q.answer.it) {
      setRight(opt.it);
      playSfx('correct');
      speak(`${q.answer.it}! ${cheer(qi)}`);
      onFound([q.answer.it], 1);
      timer.current = setTimeout(() => { setQi((n) => n + 1); setWrong([]); setRight(null); }, NEXT_DELAY);
    } else {
      setWrong((w) => (w.includes(opt.it) ? w : [...w, opt.it]));
      speak(`${TRY_AGAIN} ${q.answer.it}`);
    }
  };

  return (
    <div className="kids-screen">
      <div className="kids-top">
        <BackButton onClick={onBack} />
        <h3 className="kids-title"><Bi it="Ascolta e trova" en="Listen and find" /></h3>
      </div>
      <Stars total={round.length} filled={qi + (right ? 1 : 0)} />
      <button className="kids-hear" onClick={() => speak(q.answer.it)}>
        <span aria-hidden="true">🔊</span>
        {/* Without speech the game still works for a child who reads, or a
            parent reading the word aloud. */}
        {HAS_TTS ? <Bi it="Ascolta ancora" en="Hear it again" /> : <span className="kids-it" data-testid="kids-prompt">{q.answer.it}</span>}
      </button>
      <div className="kids-options">
        {q.options.map((opt) => {
          const state = right === opt.it ? ' right' : wrong.includes(opt.it) ? ' nope' : '';
          return (
            <button
              key={opt.it}
              className={`kids-option${state}`}
              onClick={() => pick(opt)}
              aria-label={opt.it}
            >
              <Pic pic={opt.pic} className="kids-pic--lg" />
              {right === opt.it && <span className="kids-option-word">{opt.it}</span>}
            </button>
          );
        })}
      </div>
      {right && <p className="kids-cheer" role="status">{cheer(qi)}</p>}
      {!right && wrong.length > 0 && <p className="kids-retry" role="status"><Bi it={TRY_AGAIN} en="Try again!" /></p>}
    </div>
  );
}

// ── Trova le coppie: memory pairs ───────────────────────────────────────────

function MemoryPairs({ theme, onBack, onFound }) {
  const deal = () => memoryBoard(theme.words, Math.random, 4);
  const [board, setBoard] = useState(deal);
  const timer = useRef(null);
  useEffect(() => () => { clearTimeout(timer.current); hush(); }, []);

  const tap = (i) => {
    const { board: next, event } = flipCard(board, i);
    if (event === 'ignored') return;
    setBoard(next);
    const word = next.cards[i].word;
    if (event === 'match') {
      playSfx('match');
      speak(`${word.it}! ${cheer(next.matched.length)}`);
      onFound([word.it], 1);
    } else {
      speak(word.it);
      if (event === 'miss') timer.current = setTimeout(() => setBoard((b) => closeMiss(b)), MISS_DELAY);
    }
  };

  if (boardDone(board)) {
    return (
      <div className="kids-screen">
        <div className="kids-top"><BackButton onClick={onBack} /></div>
        <Finished stars={board.matched.length} onAgain={() => { clearTimeout(timer.current); setBoard(deal()); }} onBack={onBack} />
      </div>
    );
  }

  return (
    <div className="kids-screen">
      <div className="kids-top">
        <BackButton onClick={onBack} />
        <h3 className="kids-title"><Bi it="Trova le coppie" en="Find the pairs" /></h3>
      </div>
      <Stars total={board.cards.length / 2} filled={board.matched.length} />
      <div className="kids-memory">
        {board.cards.map((c, i) => {
          const up = isFaceUp(board, i);
          const matched = board.matched.includes(c.word.it);
          return (
            <button
              key={c.key}
              className={`kids-mem-card${up ? ' up' : ''}${matched ? ' matched' : ''}`}
              onClick={() => tap(i)}
              aria-label={up ? c.word.it : `Carta ${i + 1}`}
              aria-pressed={up}
            >
              {up ? <Pic pic={c.word.pic} className="kids-pic--md" /> : <span className="kids-mem-back" aria-hidden="true">?</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── A theme: pick an activity ───────────────────────────────────────────────

const ACTIVITIES = [
  { id: 'look', pic: '👀', it: 'Guarda e ascolta', en: 'Look and listen' },
  { id: 'listen', pic: '👂', it: 'Ascolta e trova', en: 'Listen and find' },
  { id: 'pairs', pic: '🃏', it: 'Trova le coppie', en: 'Find the pairs' },
];

function ThemeScreen({ theme, store, onBack, onFound }) {
  const [activity, setActivity] = useState(null);
  const back = () => setActivity(null);
  if (activity === 'look') return <LookCards theme={theme} onBack={back} />;
  if (activity === 'listen') return <ListenFind theme={theme} onBack={back} onFound={onFound} />;
  if (activity === 'pairs') return <MemoryPairs theme={theme} onBack={back} onFound={onFound} />;
  return (
    <div className="kids-screen">
      <div className="kids-top">
        <BackButton onClick={onBack} />
        <h3 className="kids-title"><Pic pic={theme.pic} /> <Bi it={theme.it} en={theme.en} /></h3>
      </div>
      <div className="kids-activities">
        {ACTIVITIES.map((a) => (
          <button
            key={a.id}
            className="kids-activity"
            onClick={() => { setActivity(a.id); if (a.id === 'look') speak(theme.words[0].it); }}
          >
            <Pic pic={a.pic} className="kids-pic--lg" />
            <span className="kids-activity-label"><Bi it={a.it} en={a.en} /></span>
          </button>
        ))}
      </div>
      <p className="kids-found-line">
        {foundCount(store, theme.words)} / {theme.words.length} <Bi it="figurine" en="stickers" />
      </p>
    </div>
  );
}

// ── Album: every word, found ones in colour ─────────────────────────────────

function Album({ store, onBack }) {
  const total = WORDS.length;
  return (
    <div className="kids-screen">
      <div className="kids-top">
        <BackButton onClick={onBack} />
        <h3 className="kids-title"><Bi it="Il mio album" en="My sticker album" /></h3>
      </div>
      <p className="kids-found-line">{foundCount(store, WORDS)} / {total} <Bi it="figurine" en="stickers" /></p>
      {kids.themes.map((t) => (
        <section key={t.id} className="kids-album-theme">
          <h4 className="kids-album-head"><Bi it={t.it} en={t.en} /></h4>
          <div className="kids-album-grid">
            {t.words.map((w) => {
              const got = !!store.found[w.it];
              return (
                <button
                  key={w.it}
                  className={`kids-sticker${got ? ' got' : ''}`}
                  onClick={() => got && speak(w.it)}
                  aria-label={got ? w.it : 'Figurina da trovare (not found yet)'}
                  disabled={!got}
                >
                  <Pic pic={w.pic} className="kids-pic--md" />
                  {got && <span className="kids-sticker-word">{w.it}</span>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ── Preghiamo insieme: say a prayer along, one line at a time ───────────────

function PrayAlong({ onBack }) {
  const [prayer, setPrayer] = useState(null);
  const [line, setLine] = useState(-1);
  const playing = useRef(false);
  useEffect(() => () => { playing.current = false; hush(); }, []);

  const stop = () => { playing.current = false; hush(); setLine(-1); };
  const playFrom = (p, i) => {
    if (i >= p.lines.length) { playing.current = false; setLine(-1); return; }
    setLine(i);
    speak(p.lines[i].it, {
      onend: () => {
        if (!playing.current) return;
        // A breath between lines, so a child has room to repeat.
        setTimeout(() => { if (playing.current) playFrom(p, i + 1); }, 900);
      },
    });
  };
  const playAll = (p) => { playing.current = true; playFrom(p, 0); };

  if (!prayer) {
    return (
      <div className="kids-screen">
        <div className="kids-top">
          <BackButton onClick={onBack} />
          <h3 className="kids-title"><Bi it="Preghiamo insieme" en="Let's pray together" /></h3>
        </div>
        <div className="kids-activities">
          {PRAYERS.map((p) => (
            <button key={p.id} className="kids-activity" onClick={() => setPrayer(p)}>
              <Pic pic="🙏" className="kids-pic--lg" />
              <span className="kids-activity-label"><Bi it={p.title} en={p.titleEn} /></span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="kids-screen">
      <div className="kids-top">
        <BackButton onClick={() => { stop(); setPrayer(null); }} />
        <h3 className="kids-title"><Bi it={prayer.title} en={prayer.titleEn} /></h3>
      </div>
      {HAS_TTS && (
        <div className="kids-row">
          {line < 0
            ? <button className="kids-btn kids-btn--primary" onClick={() => playAll(prayer)}><Bi it="Ascolta tutta" en="Hear it all" /></button>
            : <button className="kids-btn" onClick={stop}><Bi it="Ferma" en="Stop" /></button>}
        </div>
      )}
      <ol className="kids-prayer">
        {prayer.lines.map((l, i) => (
          <li key={i}>
            <button
              className={`kids-prayer-line${i === line ? ' now' : ''}`}
              onClick={() => { playing.current = false; setLine(i); speak(l.it, { onend: () => setLine(-1) }); }}
            >
              <Bi it={l.it} en={l.en} />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Leaving full-screen mode: a grown-up holds the button ───────────────────

function HoldToExit({ onExit }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef(null);
  const start = () => {
    clearTimeout(timer.current);
    setHolding(true);
    timer.current = setTimeout(() => { setHolding(false); onExit(); }, HOLD_MS);
  };
  const cancel = () => { clearTimeout(timer.current); setHolding(false); };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      className={`kids-exit${holding ? ' holding' : ''}`}
      style={{ '--hold-ms': `${HOLD_MS}ms` }}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); start(); } }}
      onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') cancel(); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="kids-exit-fill" aria-hidden="true" />
      <span className="kids-exit-label">Grown-ups: hold to exit</span>
    </button>
  );
}

// ── The corner ──────────────────────────────────────────────────────────────

export function KidsTab() {
  const [store, setStore] = useState(loadKids);
  const [view, setView] = useState({ name: 'home' });
  const update = (fn) => setStore((s) => saveKids(fn(s)));
  const onFound = (its, stars) => update((s) => addStars(markFound(s, its), stars));
  const lock = (on) => update((s) => setLocked(s, on));

  // In full-screen mode the page behind must not scroll under a child's finger.
  useEffect(() => {
    if (!store.locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [store.locked]);
  useEffect(() => () => hush(), []);

  const home = () => setView({ name: 'home' });
  let body;
  if (view.name === 'theme') {
    body = <ThemeScreen theme={view.theme} store={store} onBack={home} onFound={onFound} />;
  } else if (view.name === 'album') {
    body = <Album store={store} onBack={home} />;
  } else if (view.name === 'pray') {
    body = <PrayAlong onBack={home} />;
  } else {
    body = (
      <div className="kids-screen">
        <div className="kids-hero">
          <h2 className="kids-hero-title"><Bi it="Angolo dei bambini" en="Kids' corner" /></h2>
          <div className="kids-hero-tools">
            <button
              className="kids-chip"
              onClick={() => setView({ name: 'album' })}
              aria-label={`Il mio album (sticker album): ${foundCount(store, WORDS)} / ${WORDS.length}`}
            >
              <span aria-hidden="true">📒</span> {foundCount(store, WORDS)}/{WORDS.length}
            </button>
            <span className="kids-chip kids-chip--stars" aria-label={`${store.stars} stelle (stars)`}>
              <span className="kids-star-ico" aria-hidden="true">★</span> {store.stars}
            </span>
          </div>
        </div>
        {!store.locked && (
          <div className="kids-parent-note">
            <p>
              Picture words a child can learn by ear while you study, and short prayers to say together.
              Nothing here changes your own reviews, streak or progress.
            </p>
            <button className="kids-lock-btn" onClick={() => lock(true)}>Full screen for little ones</button>
          </div>
        )}
        <div className="kids-themes">
          {kids.themes.map((t) => (
            <button
              key={t.id}
              className="kids-theme"
              onClick={() => { setView({ name: 'theme', theme: t }); speak(t.it); }}
            >
              <Pic pic={t.pic} className="kids-pic--lg" />
              <span className="kids-theme-label"><Bi it={t.it} en={t.en} /></span>
              <span className="kids-theme-count">{foundCount(store, t.words)}/{t.words.length}</span>
            </button>
          ))}
          {PRAYERS.length > 0 && (
            <button
              className="kids-theme kids-theme--pray"
              onClick={() => { setView({ name: 'pray' }); speak('Preghiamo insieme'); }}
            >
              <Pic pic="🙏" className="kids-pic--lg" />
              <span className="kids-theme-label"><Bi it="Preghiamo insieme" en="Let's pray together" /></span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`kids-root${store.locked ? ' kids-root--locked' : ''}`}>
      {store.locked && <HoldToExit onExit={() => { hush(); lock(false); }} />}
      {body}
    </div>
  );
}
