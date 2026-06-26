import { describe, it, expect } from 'vitest';
import { nextOccurrence, buildReminderICS, googleCalendarUrl } from './calendar';

describe('nextOccurrence', () => {
  it('returns today when the hour is still ahead', () => {
    const now = new Date(2026, 5, 26, 9, 0, 0); // 09:00
    const d = nextOccurrence(19, now);
    expect(d.getDate()).toBe(26);
    expect(d.getHours()).toBe(19);
    expect(d.getMinutes()).toBe(0);
  });

  it('rolls to tomorrow when the hour has already passed', () => {
    const now = new Date(2026, 5, 26, 20, 30, 0); // 20:30, past 19:00
    const d = nextOccurrence(19, now);
    expect(d.getDate()).toBe(27);
    expect(d.getHours()).toBe(19);
  });

  it('rolls to tomorrow when exactly at the hour', () => {
    const now = new Date(2026, 5, 26, 19, 0, 0);
    const d = nextOccurrence(19, now);
    expect(d.getDate()).toBe(27);
  });
});

describe('buildReminderICS', () => {
  const now = new Date(2026, 5, 26, 9, 0, 0);

  it('produces a daily-recurring VEVENT with an alarm', () => {
    const ics = buildReminderICS({ hour: 19, title: 'Study Italian', now });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('RRULE:FREQ=DAILY');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('ACTION:DISPLAY');
    expect(ics).toContain('SUMMARY:Study Italian');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('starts at the requested hour in floating local time', () => {
    const ics = buildReminderICS({ hour: 19, title: 'Study', now });
    expect(ics).toContain('DTSTART:20260626T190000');
  });

  it('uses CRLF line endings', () => {
    const ics = buildReminderICS({ hour: 19, title: 'Study', now });
    expect(ics).toContain('\r\n');
  });

  it('escapes special characters in text', () => {
    const ics = buildReminderICS({ hour: 19, title: 'Read; study, now', now });
    expect(ics).toContain('SUMMARY:Read\\; study\\, now');
  });

  it('omits DESCRIPTION when none is given', () => {
    const ics = buildReminderICS({ hour: 19, title: 'Study', now });
    // The VALARM always carries a DESCRIPTION, but the VEVENT body should not
    // when description is empty.
    const eventBody = ics.slice(0, ics.indexOf('BEGIN:VALARM'));
    expect(eventBody).not.toContain('DESCRIPTION:');
  });
});

describe('googleCalendarUrl', () => {
  const now = new Date(2026, 5, 26, 9, 0, 0);

  it('builds a recurring TEMPLATE link', () => {
    const url = googleCalendarUrl({ hour: 19, title: 'Study Italian', now });
    expect(url).toContain('https://calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('recur=RRULE%3AFREQ%3DDAILY');
    expect(url).toContain('dates=20260626T190000%2F20260626T191500');
  });
});
