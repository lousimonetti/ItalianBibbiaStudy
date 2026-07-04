import { useState } from 'react';
import { DAILY } from '../data/studyData';
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

export function WeekDetail({ week }) {
  const [ipaOpen, setIpaOpen] = useState(false);

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
              {week.vocab.map(([it, en, ex, pron], i) => (
                <tr key={i}>
                  <td className="vocab-it">
                    <span className="vocab-it-word">
                      <span>{it}</span>
                      <SpeakerButton word={it} size={15} />
                    </span>
                    {HAS_IPA && pron && <span className="vocab-pron">{pron}</span>}
                  </td>
                  <td className="vocab-en">{en}</td>
                  <td className="vocab-ex">
                    {ex && (
                      <span className="vocab-ex-row">
                        <WordGloss text={ex} />
                        <SpeakerButton word={ex} size={13} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
