import { useMemo, useState } from 'react';
import { config } from '../../course/config';
import { buildPrep, prepText } from '../utils/conversationPrep';
import { mineWord } from '../utils/mined';
import { deckOf } from '../utils/decks';
import { SpeakerButton } from './SpeakerButton';

// "Prepare for a conversation" (REVIEW-fluency.md B4): a short sheet to take
// to a tutor or language partner, a place to keep what the conversation
// taught, and links to real Italian to listen to. Collapsed by default.
export function ConversationPrep({ week }) {
  const [open, setOpen] = useState(false);
  const prep = useMemo(() => buildPrep(week), [week]);
  if (!prep) return null;
  return (
    <div className="convo">
      <button className="more-practice-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>Prepare for a conversation</span>
        <span className="more-practice-sub">for a tutor or a language partner</span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="convo-body">
          <p className="convo-why">
            Speaking comes from hours of real conversation. Aim for one every week or two,
            and bring this sheet: it gives you something to say about the reading.
          </p>
          <PrepSheet prep={prep} />
          <AfterConversation weekN={week.n} />
          <Listening />
        </div>
      )}
    </div>
  );
}

function Line({ it, en }) {
  return (
    <li className="convo-line">
      <span className="convo-it">{it}</span>
      <SpeakerButton word={it} size={14} />
      {en && <span className="convo-en">{en}</span>}
    </li>
  );
}

function PrepSheet({ prep }) {
  const [copied, setCopied] = useState(false);
  const text = prepText(prep, `Settimana ${prep.weekN}`);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="convo-sheet">
      {prep.ask.length > 0 && (
        <>
          <div className="convo-label">Questions to be asked</div>
          <ul className="convo-list">{prep.ask.map((q) => <Line key={q} it={q} />)}</ul>
        </>
      )}
      <div className="convo-label">Things to say</div>
      <ul className="convo-list">{prep.say.map((s) => <Line key={s.it} it={s.it} en={s.en} />)}</ul>
      {prep.chunks.length > 0 && (
        <>
          <div className="convo-label">Phrases to use</div>
          <ul className="convo-list">{prep.chunks.map((c) => <Line key={c.it} it={c.it} en={c.en} />)}</ul>
        </>
      )}
      <button type="button" className="prac-go-btn prac-go-secondary convo-copy" onClick={copy}>
        {copied ? 'Copied ✓' : 'Copy the sheet to send to your tutor'}
      </button>
    </div>
  );
}

// After the conversation: keep the words and corrections it gave you. They go
// to "Mie parole" and are reviewed in Practice with everything else.
function AfterConversation({ weekN }) {
  const [it, setIt] = useState('');
  const [en, setEn] = useState('');
  const [ex, setEx] = useState('');
  const [msg, setMsg] = useState('');
  const save = (e) => {
    e.preventDefault();
    const term = it.trim();
    if (!term) return;
    if (deckOf(term)) {
      setMsg(`“${term}” is already one of your cards.`);
      return;
    }
    const r = mineWord({ it: term, en, ex, src: `conversation, week ${weekN}` });
    if (r.added) {
      setMsg(`Saved “${term}” to My words.`);
      setIt(''); setEn(''); setEx('');
    } else {
      setMsg(r.reason === 'duplicate' ? `“${term}” is already in My words.` : 'My words is full.');
    }
  };
  return (
    <form className="convo-after" onSubmit={save}>
      <div className="convo-label">After the conversation</div>
      <p className="convo-why">Keep each new word or correction while you remember it. It is reviewed in Practice, under My words.</p>
      <input className="convo-input" aria-label="Italian word or phrase" placeholder="Italian word or phrase" value={it} onChange={(e) => setIt(e.target.value)} />
      <input className="convo-input" aria-label="Meaning" placeholder="Meaning" value={en} onChange={(e) => setEn(e.target.value)} />
      <input className="convo-input" aria-label="Sentence it came up in (optional)" placeholder="The sentence it came up in (optional)" value={ex} onChange={(e) => setEx(e.target.value)} />
      <button type="submit" className="prac-go-btn convo-save" disabled={!it.trim()}>Save to My words</button>
      {msg && <div className="convo-msg" role="status">{msg}</div>}
    </form>
  );
}

function Listening() {
  const list = config.listening || [];
  if (!list.length) return null;
  return (
    <div className="convo-listen">
      <div className="convo-label">Real Italian to listen to</div>
      <ul className="convo-list">
        {list.map((r) => (
          <li key={r.url} className="convo-res">
            <a href={r.url} target="_blank" rel="noreferrer">{r.name}</a>: {r.desc}
          </li>
        ))}
      </ul>
    </div>
  );
}
