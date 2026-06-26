import { useCallback } from 'react';
import { config } from '../../course/config';
import { DEFAULT_HOUR } from '../utils/reminders';
import { buildReminderICS, googleCalendarUrl } from '../utils/calendar';

// A calendar-based daily reminder. Unlike the in-app Notification reminder
// (which can only fire while the app is open — a no-backend constraint), this
// hands a recurring event to the device's calendar, so it fires even when the
// app is closed. Two paths: download an .ics (native calendars) or open a
// pre-filled Google Calendar "create event" page.
const REMINDER = {
  title: `${config.brand.name} 🇮🇹`,
  description: 'Mantieni la tua serie! — Keep your streak going. Studia un po\' di italiano oggi.',
};

export function CalendarReminder() {
  const downloadIcs = useCallback(() => {
    const ics = buildReminderICS({
      hour: DEFAULT_HOUR,
      title: REMINDER.title,
      description: REMINDER.description,
      uid: `${config.id}-daily-reminder`,
    });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daily-study-reminder.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, []);

  const gcalUrl = googleCalendarUrl({
    hour: DEFAULT_HOUR,
    title: REMINDER.title,
    description: REMINDER.description,
  });

  return (
    <span className="today-calendar">
      <button
        className="today-reminder"
        onClick={downloadIcs}
        title={`Add a daily ${DEFAULT_HOUR}:00 reminder to your calendar — fires even when the app is closed`}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2.5" y="3" width="11" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2.5 6h11M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        Add to calendar
      </button>
      <a
        className="today-calendar-link"
        href={gcalUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Add the daily reminder to Google Calendar instead"
      >
        Google
      </a>
    </span>
  );
}
