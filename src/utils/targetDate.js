// Target end date — build the schedule backwards from a finish line.
//
// The app has always asked "when do you want to start?". People think in
// deadlines instead: "I want to be reading Italian by my trip in June". This
// is the inverse of getEndDate() in sessionStart.js, which is
// `start + weeks*7 − 1`. Here we solve for the start.
//
// Nothing new is persisted. The derived start goes to the existing
// resetSession({ startDate, … }) and every downstream consumer — week numbers,
// week ranges, the header tagline, the iOS app, sync backups — keeps working
// off the same plain 'YYYY-MM-DD' session-start string it already reads.
//
// Two rules make the result honest:
//   1. The end date is snapped BACKWARD to the last day of a program week, so
//      the program always finishes on or before the date asked for — never
//      after it. The UI shows the computed date, not the requested one.
//   2. Because the reference course's weeks run Monday–Sunday, snapping the
//      end to a Sunday lands the start on a Monday. That keeps the daily
//      checklist aligned with real weekdays.

import { config } from '../../course/config';
import { parseLocalDate, todayISO } from './sessionStart';
import { weekNumberFor } from './schedule';

const DAY_MS = 86400000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toISO(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

// A real calendar date, not just a well-shaped string: '2026-02-31' parses to
// March 3 in JS, so round-trip the value to catch it.
function parseStrict(iso) {
  if (!ISO_DATE.test(String(iso ?? ''))) return null;
  const d = parseLocalDate(iso);
  return Number.isNaN(d.getTime()) || toISO(d) !== iso ? null : d;
}

// The last day of the program week the user is aiming at: the Sunday on or
// before the requested date. Snapping backward is what guarantees "finish BY
// this date" rather than "finish around this date".
export function snapToWeekEnd(date) {
  const daysAfterSunday = date.getDay(); // 0 = Sunday
  return daysAfterSunday === 0 ? date : addDays(date, -daysAfterSunday);
}

/**
 * The start date whose final week ends on (or just before) `endISO`.
 * Returns null for a malformed or impossible date. The exact inverse of
 * sessionStart.getEndDate(), modulo the week-end snap.
 */
export function startForEndDate(endISO, weeks = config.schedule.weeks) {
  const requested = parseStrict(endISO);
  if (!requested || !Number.isInteger(weeks) || weeks < 1) return null;
  const end = snapToWeekEnd(requested);
  return toISO(addDays(end, -(weeks * 7 - 1)));
}

// The end date actually delivered for a requested one (after the snap).
export function actualEndForEndDate(endISO, weeks = config.schedule.weeks) {
  const requested = parseStrict(endISO);
  if (!requested || !Number.isInteger(weeks) || weeks < 1) return null;
  return toISO(snapToWeekEnd(requested));
}

/**
 * Everything the UI needs to explain what a chosen end date implies.
 *
 *   valid           false when the date is malformed or already past
 *   reason          'malformed' | 'past' | null
 *   start / end     the derived 'YYYY-MM-DD' pair actually used
 *   requestedEnd    what was asked for, so the UI can show the snap
 *   snapped         true when `end` moved earlier than `requestedEnd`
 *   startsInFuture  the program would begin later than today
 *   daysUntilStart  0 when it starts today or is already running
 *   startWeekN      the week today falls in (null when it starts in future)
 *   skippedWeeks    startWeekN - 1: the headline number for the warning
 *   weeksAvailable  whole program weeks that fit between today and the target
 */
export function planForEndDate(endISO, options = {}) {
  const weeks = options.weeks ?? config.schedule.weeks;
  const today = options.today ?? todayISO();

  const base = {
    valid: false, reason: 'malformed', start: null, end: null,
    requestedEnd: endISO ?? null, snapped: false, startsInFuture: false,
    daysUntilStart: 0, startWeekN: null, skippedWeeks: 0, weeksAvailable: 0,
  };

  const requested = parseStrict(endISO);
  const todayDate = parseStrict(today);
  if (!requested || !todayDate) return base;

  const endDate = snapToWeekEnd(requested);
  const end = toISO(endDate);

  // Snapping can push a date early in the week back before today. Either way,
  // a finish line already behind us is not a schedule.
  if (endDate.getTime() < todayDate.getTime()) {
    return { ...base, reason: 'past', end, snapped: end !== endISO };
  }

  const start = toISO(addDays(endDate, -(weeks * 7 - 1)));
  const startDate = parseLocalDate(start);
  const startsInFuture = startDate.getTime() > todayDate.getTime();

  // weekNumberFor is null when the start is still ahead — that is the
  // "comfortable" case, which the app already renders as "Program starts …".
  const startWeekN = startsInFuture
    ? null
    : weekNumberFor(start, weeks, todayDate.getTime());

  return {
    valid: true,
    reason: null,
    start,
    end,
    requestedEnd: endISO,
    snapped: end !== endISO,
    startsInFuture,
    daysUntilStart: startsInFuture
      ? Math.round((startDate.getTime() - todayDate.getTime()) / DAY_MS)
      : 0,
    startWeekN,
    skippedWeeks: startWeekN ? startWeekN - 1 : 0,
    // Round the day delta before dividing: a DST transition inside the span
    // makes the raw millisecond difference 118d 1h rather than 118d, and a
    // bare Math.ceil would then report an extra week.
    weeksAvailable: Math.ceil(
      (Math.round((endDate.getTime() - todayDate.getTime()) / DAY_MS) + 1) / 7,
    ),
  };
}
