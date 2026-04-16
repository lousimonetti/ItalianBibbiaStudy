import { useState, useEffect, useRef } from 'react';
import { PHASES } from '../data/studyData';
import { useJournal } from '../hooks/useJournal';

function ExportIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 10v3.5A1.5 1.5 0 003.5 15h9A1.5 1.5 0 0014 13.5V10M8 1v9m0-9L5 4m3-3 3 3"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function WeekJournalRow({ week, entry, onSave }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(entry?.text ?? '');
  const [saved, setSaved] = useState(false);
  const timerRef = useRef(null);
  const hasContent = !!entry?.text?.trim();

  // Auto-save with 800ms debounce
  useEffect(() => {
    if (!open) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (draft !== (entry?.text ?? '')) {
        onSave(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    }, 800);
    return () => clearTimeout(timerRef.current);
  }, [draft, open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) setDraft(entry?.text ?? '');
  };

  const updatedAt = entry?.updatedAt
    ? new Date(entry.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div className={`jrn-row${hasContent ? ' jrn-has-content' : ''}`}>
      <div className="jrn-row-header" onClick={handleOpen}>
        <div className="jrn-row-meta">
          <span className="jrn-week-num">Week {week.n}</span>
          <span className="jrn-week-reading">{week.r}</span>
          <span className="jrn-week-date">{week.d}</span>
          {week.review && <span className="review-flag">iTalki week</span>}
        </div>
        <div className="jrn-row-right">
          {hasContent && updatedAt && (
            <span className="jrn-last-saved">{updatedAt}</span>
          )}
          {hasContent && (
            <span className="jrn-dot" title="Has notes" />
          )}
          <span className="jrn-expand">{open ? '−' : '+'}</span>
        </div>
      </div>

      {open && (
        <div className="jrn-editor">
          <div className="jrn-prompt">
            <div className="jrn-prompt-it">{week.prompt.it}</div>
            <div className="jrn-prompt-en">{week.prompt.en}</div>
          </div>
          <textarea
            className="jrn-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Write 3–5 Italian sentences here. Start from the prompt above, then continue in your own words…`}
            rows={6}
            autoFocus
          />
          <div className="jrn-editor-footer">
            <span className="jrn-word-count">
              {draft.trim() ? draft.trim().split(/\s+/).length : 0} words
            </span>
            {saved && <span className="jrn-saved-indicator">Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export function JournalTab() {
  const { entries, setEntry, exportMarkdown, wordCount, weekCount } = useJournal();
  const [filterPhase, setFilterPhase] = useState('all');

  const filteredPhases = filterPhase === 'all'
    ? PHASES
    : PHASES.filter((p) => p.id === filterPhase);

  return (
    <div className="jrn-wrap">

      {/* Header */}
      <div className="jrn-header">
        <div>
          <div className="jrn-title">Journal</div>
          <div className="jrn-subtitle">
            {weekCount > 0
              ? `${weekCount} ${weekCount === 1 ? 'week' : 'weeks'} written · ${wordCount.toLocaleString()} words total`
              : 'Write Italian sentences for each week using the weekly prompt'}
          </div>
        </div>
        <div className="jrn-header-actions">
          <button className="jrn-export-btn" onClick={() => exportMarkdown(PHASES)}>
            <ExportIcon />
            Export .md
          </button>
        </div>
      </div>

      {/* Note about notes */}
      <div className="jrn-info">
        Notes save automatically as you type. Export downloads a single markdown file you can paste into Google Docs, OneNote, or any other app.
      </div>

      {/* Phase filter */}
      <div className="jrn-filter">
        {[
          { id: 'all', label: 'All phases' },
          ...PHASES.map((p) => ({ id: p.id, label: p.title.replace('Phase ', 'Ph ') })),
        ].map(({ id, label }) => (
          <button
            key={id}
            className={`jrn-filter-btn${filterPhase === id ? ' active' : ''}`}
            onClick={() => setFilterPhase(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Week rows */}
      {filteredPhases.map((phase) => (
        <div key={phase.id} className="jrn-phase-block">
          <div
            className="jrn-phase-label"
            style={{ borderLeftColor: phase.badgeColor, color: phase.badgeColor }}
          >
            <span
              className="badge"
              style={{ background: phase.badgeBg, color: phase.badgeColor }}
            >
              {phase.badgeLabel}
            </span>
            <span>{phase.title}</span>
            <span className="jrn-phase-book">{phase.book}</span>
          </div>
          {phase.weeks.map((week) => (
            <WeekJournalRow
              key={week.n}
              week={week}
              entry={entries[week.n]}
              onSave={(text) => setEntry(week.n, text)}
            />
          ))}
        </div>
      ))}

    </div>
  );
}
