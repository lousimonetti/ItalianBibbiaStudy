// Build a recurring daily calendar reminder — a static, no-backend way to get a
// reminder that fires even when this app is closed (the OS/calendar app handles
// it). Pure (no I/O) so it's unit-testable; the UI wraps these in a download +
// a Google Calendar link.

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Floating local time (no TZID/Z) — fires at this wall-clock time on the device.
function fmtLocal(d) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
}

function fmtUTC(d) {
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
}

// The next time `hour`:00 occurs (today if still ahead, else tomorrow).
export function nextOccurrence(hour, now = new Date()) {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

function escICS(s) {
  return String(s).replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n');
}

// A VCALENDAR with one daily-recurring VEVENT + a display alarm at start.
export function buildReminderICS({ hour = 19, title = 'Study', description = '', uid = 'daily-reminder', now = new Date() } = {}) {
  const start = nextOccurrence(hour, now);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CourseKit//Daily Reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@coursekit`,
    `DTSTAMP:${fmtUTC(now)}`,
    `DTSTART:${fmtLocal(start)}`,
    'DURATION:PT15M',
    'RRULE:FREQ=DAILY',
    `SUMMARY:${escICS(title)}`,
    description ? `DESCRIPTION:${escICS(description)}` : null,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escICS(title)}`,
    'TRIGGER:PT0S',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

// A Google Calendar "create recurring event" link (for users without a native
// calendar app handy).
export function googleCalendarUrl({ hour = 19, title = 'Study', description = '', now = new Date() } = {}) {
  const start = nextOccurrence(hour, now);
  const end = new Date(start.getTime() + 15 * 60000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    dates: `${fmtLocal(start)}/${fmtLocal(end)}`,
    recur: 'RRULE:FREQ=DAILY',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
