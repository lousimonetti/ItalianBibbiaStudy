import { useState } from 'react';
import { DAILY } from '../data/studyData';
import { IPAGuide } from './IPAGuide';

export function WeekDetail({ week }) {
  const [ipaOpen, setIpaOpen] = useState(false);

  return (
    <div className="detail-panel">
      <div className="detail-grid">
        {/* Vocabulary */}
        <div className="detail-section">
          <div className="detail-label-row">
            <span className="detail-label">Key vocabulary</span>
            <button className="ipa-hint-btn" onClick={() => setIpaOpen(v => !v)}>
              {ipaOpen ? 'Hide key' : 'Pronunciation key ?'}
            </button>
          </div>
          {ipaOpen && (
            <div className="ipa-inline-panel">
              <IPAGuide compact />
            </div>
          )}
          <table className="vocab-table">
            <tbody>
              {week.vocab.map(([it, en, ex, pron], i) => (
                <tr key={i}>
                  <td className="vocab-it">
                    {it}
                    {pron && <span className="vocab-pron">{pron}</span>}
                  </td>
                  <td className="vocab-en">{en}</td>
                  <td className="vocab-ex">{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {/* Grammar */}
          <div className="detail-section" style={{ marginBottom: 14 }}>
            <div className="detail-label">Grammar focus</div>
            <div className="grammar-box">
              <div className="grammar-title">{week.grammar.title}</div>
              {week.grammar.body}
            </div>
          </div>

          {/* Writing prompt */}
          <div className="detail-section">
            <div className="detail-label">Writing prompt</div>
            <div className="prompt-box">
              <div className="prompt-italian">{week.prompt.it}</div>
              <div className="prompt-english">{week.prompt.en}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily schedule */}
      <div className="detail-section" style={{ marginTop: 14 }}>
        <div className="detail-label">Daily schedule</div>
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
          <div className="detail-label">iTalki conversation starters</div>
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
