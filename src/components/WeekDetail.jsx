import { useState } from 'react';
import { DAILY, PHASES } from '../data/studyData';
import { parseVocab } from '../../course/vocab';
import { recycledWords } from '../utils/recycling';
import { IPAGuide } from './IPAGuide';
import { SpeakerButton } from './SpeakerButton';
import { WordGloss } from './WordGloss';
import { ReadingPassage } from './ReadingPassage';
import { Comprehension } from './Comprehension';
import { Dictogloss } from './Dictogloss';
import { GrammarDrill } from './GrammarDrill';
import { TransformDrill } from './TransformDrill';
import { SpokenQA } from './SpokenQA';
import { PhraseList } from './PhraseList';
import { UiText } from '../i18n/UiText';
import { HAS_IPA } from '../utils/locale';

const ALL_WEEKS = PHASES.flatMap((p) => p.weeks);

// A short passage note that teaches the theology THROUGH the grammar, rather
// than running the two as parallel tracks. Optional per week.
function ExegesisPanel({ exegesis }) {
  const [open, setOpen] = useState(false);
  if (!exegesis) return null;
  return (
    <div className="exeg-panel">
      <button className="exeg-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="exeg-eyebrow">Reading the passage</span>
        <span className="exeg-title">{exegesis.title}</span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="exeg-body">
          <p className="exeg-prose">{exegesis.body}</p>
          {exegesis.forms?.length > 0 && (
            <div className="exeg-forms">
              {exegesis.forms.map((f, i) => (
                <div className="exeg-form" key={i}>
                  <span className="exeg-form-it">
                    {f.it}
                    <SpeakerButton word={f.it} size={13} />
                  </span>
                  <span className="exeg-form-gloss">{f.gloss}</span>
                  {f.note && <span className="exeg-form-note">{f.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Words from earlier weeks that resurface in this week's material. Contextual
// re-encounter is what turns a memorized translation pair into a usable word,
// and only 9% of the course vocabulary formally repeats — so surfacing the
// incidental repeats is free value.
function RecycledPanel({ words }) {
  if (!words.length) return null;
  return (
    <div className="recycle-panel">
      <div className="recycle-label">
        Seen before — {words.length} word{words.length !== 1 ? 's' : ''} from earlier weeks appear again here
      </div>
      <div className="recycle-chips">
        {words.map((w) => (
          <span className="recycle-chip" key={w.it} title={w.en}>
            {w.it}
            <span className="recycle-week">wk {w.firstWeek}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function WeekDetail({ week }) {
  const [ipaOpen, setIpaOpen] = useState(false);
  const recycled = recycledWords(week, ALL_WEEKS);

  return (
    <div className="detail-panel">
      {/* Reading & comprehension (O2 / O5 / O4) */}
      <ReadingPassage week={week} />
      <Comprehension week={week} />
      <Dictogloss week={week} />
      {/* Spoken Q&A about the reading (S3) */}
      <SpokenQA week={week} />

      <div className="detail-grid">
        {/* Vocabulary */}
        <div className="detail-section">
          <div className="detail-label-row">
            <span className="detail-label"><UiText k="detail.vocab" /></span>
            {HAS_IPA && (
              <button className="ipa-hint-btn" onClick={() => setIpaOpen(v => !v)}>
                {ipaOpen ? 'Hide key' : 'Pronunciation key ?'}
              </button>
            )}
          </div>
          {HAS_IPA && ipaOpen && (
            <div className="ipa-inline-panel">
              <IPAGuide compact />
            </div>
          )}
          <table className="vocab-table">
            <tbody>
              {week.vocab.map((tuple, i) => {
                const { it, en, ex, ipa, exEn, form } = parseVocab(tuple);
                return (
                  <tr key={i}>
                    <td className="vocab-it">
                      <span className="vocab-it-word">
                        <span>{it}</span>
                        <SpeakerButton word={it} size={15} />
                      </span>
                      {HAS_IPA && ipa && <span className="vocab-pron">{ipa}</span>}
                      {/* The form the word actually takes in the sentence below.
                          Naming the lemma↔inflection relationship is most of
                          what an English speaker has to learn about Italian. */}
                      {form && form.toLowerCase() !== it.toLowerCase() && (
                        <span className="vocab-form" title="the form used in the example">→ {form}</span>
                      )}
                    </td>
                    <td className="vocab-en">{en}</td>
                    <td className="vocab-ex">
                      {ex && (
                        <>
                          <span className="vocab-ex-row">
                            <WordGloss text={ex} />
                            <SpeakerButton word={ex} size={13} />
                          </span>
                          {exEn && <span className="vocab-ex-en">{exEn}</span>}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <RecycledPanel words={recycled} />
        </div>

        <div>
          {/* Grammar */}
          <div className="detail-section" style={{ marginBottom: 14 }}>
            <div className="detail-label"><UiText k="detail.grammar" /></div>
            <div className="grammar-box">
              <div className="grammar-title">{week.grammar.title}</div>
              {week.grammar.body}
            </div>
            {/* Grammar drill (O3) + transformation drill (S2) */}
            <GrammarDrill week={week} />
            <TransformDrill week={week} />
          </div>

          {/* Writing prompt */}
          <div className="detail-section">
            <div className="detail-label"><UiText k="detail.prompt" /></div>
            <div className="prompt-box">
              <div className="prompt-italian"><WordGloss text={week.prompt.it} /></div>
              <div className="prompt-english">{week.prompt.en}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed phrases (S1) */}
      <PhraseList week={week} />

      {/* Passage note — grammar as exegesis */}
      <ExegesisPanel exegesis={week.exegesis} />

      {/* Daily schedule */}
      <div className="detail-section" style={{ marginTop: 14 }}>
        <div className="detail-label"><UiText k="detail.schedule" /></div>
        <div className="daily-box">
          {DAILY.map(({ day, task }) => (
            <div className="daily-row" key={day}>
              <span className="daily-day">{day}</span>
              <span className="daily-task">{task}</span>
            </div>
          ))}
        </div>
      </div>

      {/* iTalki prompts */}
      {week.review && week.italki && (
        <div className="detail-section" style={{ marginTop: 14 }}>
          <div className="detail-label"><UiText k="detail.italki" /></div>
          <div className="italki-box">
            {week.italki.map((q, i) => (
              <div className="italki-q" key={i}>{q}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
