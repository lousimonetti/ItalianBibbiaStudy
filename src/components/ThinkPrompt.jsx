import { useState } from 'react';
import { promptForDate } from '../data/thinkPrompts';
import { recordActivity } from '../utils/streak';
import { DictationMic } from './DictationMic';

// "Pensa in italiano" — today's inner-monologue micro-prompt on the Today
// card (plan-speaking.md S7). Hover/long-press the Italian for the English
// gloss (the immersion-mode pattern). Expanding opens a throwaway scratch
// box (type or dictate — nothing is saved); marking it done ticks the
// streak's practiced flag.
export function ThinkPrompt() {
  const [open, setOpen] = useState(false);
  const [scratch, setScratch] = useState('');
  const [done, setDone] = useState(false);
  const prompt = promptForDate();

  return (
    <div className="think-prompt">
      <button
        className="think-prompt-row"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="think-prompt-label" title="Think in Italian — today's micro-prompt">
          Pensa in italiano
        </span>
        <span className="think-prompt-it" title={prompt.en}>{prompt.it}</span>
        {done && <span className="think-prompt-done">✓</span>}
      </button>

      {open && (
        <div className="think-prompt-body">
          <div className="think-prompt-hint">
            Answer in Italian — out loud, in your head, or scribble below.
            Nothing here is saved; it's just to get you thinking in Italian.
          </div>
          <textarea
            className="think-prompt-scratch"
            value={scratch}
            onChange={(e) => setScratch(e.target.value)}
            placeholder="Scrivi qui (facoltativo)…"
            rows={2}
          />
          <div className="think-prompt-actions">
            <DictationMic
              onText={(t) => setScratch(s => (s && !/\s$/.test(s) ? s + ' ' : s) + t + ' ')}
              label="Parla"
              stopLabel="Ferma"
              title="Speak your answer — it types here"
            />
            <button
              className="think-prompt-done-btn"
              onClick={() => { recordActivity('practiced'); setDone(true); setOpen(false); }}
              disabled={done}
            >
              {done ? 'Fatto ✓' : "L'ho fatto ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
