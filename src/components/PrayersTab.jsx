import { useState } from 'react';
import { PRAYER_SECTIONS } from '../data/prayers';
import { SpeakerButton } from './SpeakerButton';

function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PrayerCard({ prayer }) {
  const [showEn, setShowEn] = useState(false);

  return (
    <div className="prayer-card">
      <div className="prayer-card-header">
        <div className="prayer-card-titles">
          <span className="prayer-title-it">{prayer.title}</span>
          <span className="prayer-title-en">{prayer.titleEn}</span>
        </div>
        <SpeakerButton word={prayer.it} size={18} />
      </div>

      {prayer.note && (
        <p className="prayer-note">{prayer.note}</p>
      )}

      <p className="prayer-text-it">{prayer.it}</p>

      <button
        className={`prayer-translation-toggle${showEn ? ' open' : ''}`}
        onClick={() => setShowEn(v => !v)}
        aria-expanded={showEn}
      >
        <span>{showEn ? 'Hide English' : 'Show English'}</span>
        <ChevronIcon open={showEn} />
      </button>

      {showEn && (
        <p className="prayer-text-en">{prayer.en}</p>
      )}
    </div>
  );
}

function PrayerSection({ section }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="prayer-section">
      <button
        className="prayer-section-header"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <div className="prayer-section-titles">
          <span className="prayer-section-title">{section.title}</span>
          <span className="prayer-section-title-en">{section.titleEn}</span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="prayer-section-body">
          {(section.intro || section.introEn) && (
            <p className="prayer-section-intro">{section.intro || section.introEn}</p>
          )}
          <div className="prayer-list">
            {section.prayers.map(prayer => (
              <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PrayersTab() {
  return (
    <div className="prayers-wrap">
      <div className="prayers-header">
        <h2 className="prayers-heading">Preghiere</h2>
        <p className="prayers-subheading">Catholic Prayers in Italian</p>
      </div>
      {PRAYER_SECTIONS.map(section => (
        <PrayerSection key={section.id} section={section} />
      ))}
    </div>
  );
}
