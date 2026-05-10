import { useState, useEffect, useRef } from 'react';
import { PHASES } from '../data/studyData';
import { useJournal } from '../hooks/useJournal';
import { SentenceGuide } from './SentenceGuide';

function ExportIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 10v3.5A1.5 1.5 0 003.5 15h9A1.5 1.5 0 0014 13.5V10M8 1v9m0-9L5 4m3-3 3 3"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GrammarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 12L6 4l4 8M3.5 9.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 6.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .55-.3 1.03-.75 1.29L11 9.5h3"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

async function checkGrammar(text) {
  const resp = await fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ text, language: 'it' }),
  });
  const data = await resp.json();
  return data.matches ?? [];
}

function GrammarPanel({ matches, status, draft, onApply }) {
  if (status === 'idle') return null;

  return (
    <div className="grammar-panel">
      <div className="grammar-panel-header">
        {status === 'loading' && <span className="grammar-loading">Checking grammar…</span>}
        {status === 'done' && matches.length === 0 && (
          <span className="grammar-clear">No issues found</span>
        )}
        {status === 'done' && matches.length > 0 && (
          <span className="grammar-count">
            {matches.length} suggestion{matches.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {status === 'done' && matches.map((match, i) => {
        const flagged = draft.slice(match.offset, match.offset + match.length);
        return (
          <div key={i} className="grammar-match">
            {flagged && <span className="grammar-flagged">"{flagged}"</span>}
            <span className="grammar-message">{match.message}</span>
            {match.replacements.length > 0 && (
              <div className="grammar-replacements">
                {match.replacements.slice(0, 3).map((r) => (
                  <button
                    key={r.value}
                    className="grammar-replacement-btn"
                    onClick={() => onApply(match, r.value)}
                  >
                    {r.value}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekJournalRow({ week, entry, onSave, grammarEnabled }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(entry?.text ?? '');
  const [saved, setSaved] = useState(false);
  const [grammarMatches, setGrammarMatches] = useState([]);
  const [grammarStatus, setGrammarStatus] = useState('idle'); // idle | loading | done
  const timerRef = useRef(null);
  const grammarTimerRef = useRef(null);
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

  // Grammar check with 1.5s debounce
  useEffect(() => {
    if (!grammarEnabled || !open) {
      setGrammarMatches([]);
      setGrammarStatus('idle');
      clearTimeout(grammarTimerRef.current);
      return;
    }
    if (!draft.trim()) {
      setGrammarMatches([]);
      setGrammarStatus('idle');
      return;
    }
    clearTimeout(grammarTimerRef.current);
    grammarTimerRef.current = setTimeout(async () => {
      setGrammarStatus('loading');
      try {
        const matches = await checkGrammar(draft);
        setGrammarMatches(matches);
        setGrammarStatus('done');
      } catch {
        setGrammarStatus('idle');
      }
    }, 1500);
    return () => clearTimeout(grammarTimerRef.current);
  }, [draft, grammarEnabled, open]);

  function applyReplacement(match, value) {
    const next = draft.slice(0, match.offset) + value + draft.slice(match.offset + match.length);
    setDraft(next);
  }

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
          <div className="jrn-writing-guide">
            <span className="jrn-guide-label">How to write</span>
            <ol className="jrn-guide-steps">
              <li>Write in <strong>Italian</strong> — the whole entry, not just the opening sentence.</li>
              <li>Use the italic sentence above as your first line or inspiration, then continue in your own words.</li>
              <li>Aim for 3–5 sentences on Wed; a short paragraph on review weeks.</li>
              <li>Don't translate from English in your head — think of a sentence you know how to write and build from there.</li>
            </ol>
          </div>
          <SentenceGuide />
          <textarea
            className="jrn-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Continua qui in italiano…"
            rows={6}
            autoFocus
          />
          <GrammarPanel
            matches={grammarMatches}
            status={grammarStatus}
            draft={draft}
            onApply={applyReplacement}
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
  const [grammarEnabled, setGrammarEnabled] = useState(false);

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
          <button
            className={`jrn-grammar-toggle${grammarEnabled ? ' active' : ''}`}
            onClick={() => setGrammarEnabled((v) => !v)}
            title={grammarEnabled ? 'Disable grammar suggestions' : 'Enable grammar suggestions (uses LanguageTool)'}
          >
            <GrammarIcon />
            Grammar
          </button>
          <button className="jrn-export-btn" onClick={() => exportMarkdown(PHASES)}>
            <ExportIcon />
            Export .md
          </button>
        </div>
      </div>

      {/* Note about notes */}
      <div className="jrn-info">
        Write in Italian — open any week to see its prompt and a short how-to guide.
        Notes save automatically as you type. Export downloads a single markdown file you can open in any app.
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
              grammarEnabled={grammarEnabled}
            />
          ))}
        </div>
      ))}

    </div>
  );
}
