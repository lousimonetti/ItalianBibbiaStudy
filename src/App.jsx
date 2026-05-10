import { useState, useEffect } from 'react';
import { PHASES, DAILY } from './data/studyData';
import { useProgress } from './hooks/useProgress';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { getCurrentWeekN, getTodayDayIndex } from './utils/schedule';
import { Phase } from './components/Phase';
import { GuideSection } from './components/GuideSection';
import { FlashcardsTab } from './components/FlashcardsTab';
import { JournalTab } from './components/JournalTab';
import { WelcomeCard } from './components/WelcomeCard';

const TOTAL = PHASES.reduce((sum, p) => sum + p.weeks.length, 0);
const ALL_WEEKS = PHASES.flatMap(p => p.weeks);

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1v9m0 0L5 7m3 3 3-3M2 12v1.5A1.5 1.5 0 003.5 15h9A1.5 1.5 0 0014 13.5V12"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 5zm0 7.5a1 1 0 100-2 1 1 0 000 2z"
        fill="currentColor"/>
    </svg>
  );
}

function TrackerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4.5l2.5 2.5 4-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 10.5l2.5 2.5 4-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 5h1M12 11h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3.5 5V3.5A1.5 1.5 0 015 2h8a1.5 1.5 0 011.5 1.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10.5 2l3.5 3.5-7 7H3.5V9l7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 3.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function TodayCard({ currentWeekN }) {
  const [schedOpen, setSchedOpen] = useState(false);
  const week = currentWeekN ? ALL_WEEKS.find(w => w.n === currentWeekN) : null;
  const todayTask = DAILY[getTodayDayIndex()];

  if (!week) {
    return (
      <div className="today-card today-card--inactive">
        <span className="today-pre-label">Program starts April 13, 2026</span>
        <span className="today-pre-sub">37 weeks · Easter to Christmas</span>
      </div>
    );
  }

  return (
    <div className="today-card">
      <div className="today-meta">
        <span className="today-week-pill">Week {week.n}</span>
        <span className="today-reading">{week.r}</span>
        <span className="today-date">{week.d}</span>
      </div>

      <div className="today-task-row">
        <span className="today-day-label">{todayTask.day}</span>
        <span className="today-task-text">{todayTask.task}</span>
      </div>

      <button className="today-sched-toggle" onClick={() => setSchedOpen(v => !v)}>
        Full weekly schedule
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: schedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {schedOpen && (
        <div className="today-sched">
          {DAILY.map(({ day, task }) => (
            <div key={day} className={`today-sched-row${day === todayTask.day ? ' today-sched-row--active' : ''}`}>
              <span className="today-sched-day">{day}</span>
              <span className="today-sched-task">{task}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'Tracker',    Icon: TrackerIcon },
  { id: 'Flashcards', Icon: CardsIcon },
  { id: 'Journal',    Icon: JournalIcon },
];

export default function App() {
  const { checked, toggle, doneCount, pct } = useProgress(TOTAL);
  const { canInstall, install } = useInstallPrompt();
  const [online, setOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('Tracker');
  const currentWeekN = getCurrentWeekN();

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  return (
    <div className="container">
      <div className="tricolor-bar" aria-hidden="true">
        <div className="tc-green" />
        <div className="tc-white" />
        <div className="tc-red" />
      </div>
      {!online && (
        <div className="offline-banner" role="status">
          <OfflineIcon />
          You're offline. All content is available from cache.
        </div>
      )}

      <div className="app-header">
        <div className="header-text">
          <h1><span className="title-it">Italian</span> Bible Study</h1>
          <p className="tagline">
            37 weeks to Christmas 2026 &mdash; La Bibbia CEI 2008 + Babbel + Anki + iTalki
          </p>
        </div>
        {canInstall && (
          <button className="install-btn" onClick={install} aria-label="Install app">
            <DownloadIcon />
            Add to Home Screen
          </button>
        )}
      </div>

      {/* Progress — always visible */}
      <div className="progress-wrap">
        <div className="progress-top">
          <div className="progress-count">{doneCount} / {TOTAL} weeks</div>
          <div className="progress-goal">Goal: Dec 25, 2026</div>
        </div>
        <div className="bar-bg">
          <div className="bar-fill" style={{ width: `${pct}%` }}
            role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} />
        </div>
      </div>

      <WelcomeCard />

      {/* Tab bar */}
      <div className="tab-bar" role="tablist">
        {TABS.map(({ id, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`tab-btn${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon />
            {id}
          </button>
        ))}
      </div>

      {/* Tab: Tracker */}
      {activeTab === 'Tracker' && (
        <>
          <TodayCard currentWeekN={currentWeekN} />
          <GuideSection />
          {PHASES.map((phase) => (
            <Phase
              key={phase.id}
              phase={phase}
              checked={checked}
              onToggle={toggle}
              currentWeekN={currentWeekN}
            />
          ))}
        </>
      )}

      {/* Tab: Flashcards */}
      {activeTab === 'Flashcards' && <FlashcardsTab />}

      {/* Tab: Journal */}
      {activeTab === 'Journal' && <JournalTab />}
    </div>
  );
}
