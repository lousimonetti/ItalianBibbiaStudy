import { useState } from 'react';
import { TIPS } from '../data/learningTips';
import { tipForDate, tipsByCategory } from '../utils/learningTips';
import { todayStr } from '../utils/streak';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';

function Tip({ tip }) {
  return (
    <div className="tip">
      <div className="tip-title">{tip.title}</div>
      <p className="tip-body">{tip.body}</p>
      {tip.examples?.length > 0 && (
        <ul className="tip-examples">
          {tip.examples.map((ex) => (
            <li key={ex.it}>
              <span className="tip-example-it">
                <WordGloss text={ex.it} />
                <SpeakerButton word={ex.it} size={13} />
              </span>
              <span className="tip-example-en">{ex.en}</span>
            </li>
          ))}
        </ul>
      )}
      {tip.tryIt && <div className="tip-try">Try it: {tip.tryIt}</div>}
    </div>
  );
}

// "Consiglio del giorno" on the Today card: one technique for learning Italian
// a day, and the whole set by category behind "All tips".
export function LearningTips() {
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState(false);
  const [cat, setCat] = useState(null);
  const tip = tipForDate(todayStr());
  if (!tip) return null;
  const groups = tipsByCategory();

  return (
    <div className="think-prompt learning-tips">
      <button className="think-prompt-row" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="think-prompt-label" title="Tip of the day — how to learn Italian">Consiglio del giorno</span>
        {!open && <span className="learning-tips-title">{tip.title}</span>}
      </button>

      {open && (
        <div className="think-prompt-body">
          <Tip tip={tip} />
          <button className="learning-tips-all" onClick={() => setAll((v) => !v)} aria-expanded={all}>
            {all ? 'Hide the list' : `All ${TIPS.length} tips`}
          </button>
          {all && (
            <div className="learning-tips-list">
              {groups.map((g) => (
                <div key={g.id} className="learning-tips-group">
                  <button
                    className="learning-tips-cat"
                    onClick={() => setCat(cat === g.id ? null : g.id)}
                    aria-expanded={cat === g.id}
                  >
                    <span>{g.title} <span className="learning-tips-cat-en">· {g.titleEn}</span></span>
                    <span className="learning-tips-count">{g.tips.length}</span>
                  </button>
                  {cat === g.id && g.tips.map((t) => <Tip key={t.id} tip={t} />)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
