import { useState } from 'react';
import { SpeakerButton } from './SpeakerButton';
import { UiText } from '../i18n/UiText';
import { upcoming } from '../utils/liturgy';

// Liturgia del giorno: what the Church in Italy celebrates on the date shown in
// the Saints tab, with its rank, season, colour and Sunday cycle, and a list of
// the coming great days that jumps the tab to them. All worked out offline by
// src/utils/liturgy.js.

const fmtShort = (d) => d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtMd = (md) => {
  const [m, d] = md.split('-').map(Number);
  return new Date(2000, m - 1, d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
};

function Chip({ it, en, className = '' }) {
  return (
    <span className={`liturgy-chip ${className}`} title={en}>
      {it}
      {en && <span className="liturgy-chip-en">{en}</span>}
    </span>
  );
}

export function LiturgyCard({ cel, date, hideName = false, onSelect }) {
  const [open, setOpen] = useState(false);
  const next = open ? upcoming(date, 8) : [];
  return (
    <section className={`liturgy-card liturgy-card--${cel.colour || 'none'}`} aria-label="Liturgia del giorno">
      <div className="saints-kicker"><UiText k="saints.liturgy" /></div>
      {!hideName && (
        <h3 className="liturgy-name">
          {cel.name}
          <SpeakerButton word={cel.name} size={18} />
        </h3>
      )}
      {!hideName && <p className="liturgy-name-en">{cel.en}</p>}
      {cel.movedFrom && (
        <p className="liturgy-note">
          Trasferita dal {fmtMd(cel.movedFrom)} <span className="liturgy-note-en">moved from its usual date this year</span>
        </p>
      )}
      {cel.also && (
        <p className="liturgy-note">
          Nello stesso giorno: {cel.also.map((a) => a.name).join(', ')}{' '}
          <span className="liturgy-note-en">also falls today; which one moves is decided by decree each time</span>
        </p>
      )}
      <div className="liturgy-chips">
        {/* On Triduum days the rank and the season are the same words. */}
        {cel.rankLabel.it !== cel.seasonLabel.it && <Chip it={cel.rankLabel.it} en={cel.rankLabel.en} />}
        <Chip it={cel.seasonLabel.it} en={cel.seasonLabel.en} />
        {cel.colour ? (
          <span className="liturgy-chip" title={`Liturgical colour: ${cel.colourEn}`}>
            <span className={`liturgy-swatch liturgy-swatch--${cel.colour}`} aria-hidden="true" />
            {cel.colour}
            <span className="liturgy-chip-en">{cel.colourEn}</span>
          </span>
        ) : (
          <Chip it="Nessuna Messa" en="no Mass until the Vigil" />
        )}
        <Chip it={`Anno ${cel.sundayYear}, ciclo ${cel.weekdayCycle}`} en="Sunday and weekday readings" />
        {cel.precetto && <Chip it="Giorno di precetto" en="holy day of obligation" className="liturgy-chip--precetto" />}
      </div>
      <button className="liturgy-upcoming-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <UiText k="saints.upcoming" />
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="liturgy-upcoming">
          {next.map((c) => (
            <li key={c.iso}>
              <button className="liturgy-upcoming-row" onClick={() => onSelect?.(c.date)}>
                <span className={`liturgy-swatch liturgy-swatch--${c.colour || 'none'}`} aria-hidden="true" />
                <span className="liturgy-upcoming-date">{fmtShort(c.date)}</span>
                <span className="liturgy-upcoming-name">{c.name}</span>
                <span className="liturgy-upcoming-rank">{c.rankLabel.it}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
