// Course validator — checks a course's config + content for the invariants the
// app and engines rely on. Pure (no I/O) so it's unit-testable; the CLI wrapper
// is scripts/validate-course.cjs (run via `npm run validate-course`).
//
// Returns an array of human-readable error strings (empty ⇒ valid).

export function validateCourse(config, phases) {
  const errors = [];
  const fail = (msg) => errors.push(msg);

  // ── config ────────────────────────────────────────────────────────────────
  if (!config || typeof config !== 'object') return ['config: missing or not an object'];
  if (!config.id) fail('config.id: required (namespaces decks/keys)');
  if (!config.locale?.target) fail('config.locale.target: required (e.g. "it-IT")');
  if (!config.locale?.native) fail('config.locale.native: required (e.g. "en")');

  const sched = config.schedule;
  if (!sched) fail('config.schedule: required');
  else {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sched.startDate || '')) {
      fail('config.schedule.startDate: required as "YYYY-MM-DD"');
    }
    if (!Number.isInteger(sched.weeks) || sched.weeks < 1) {
      fail('config.schedule.weeks: required positive integer');
    }
    if (!Array.isArray(sched.daily) || sched.daily.length !== 7) {
      fail('config.schedule.daily: required array of 7 { day, task }');
    }
  }

  // ── content ───────────────────────────────────────────────────────────────
  if (!Array.isArray(phases) || phases.length === 0) {
    fail('content.phases: required non-empty array');
    return errors;
  }

  const allWeeks = phases.flatMap((p) => (Array.isArray(p.weeks) ? p.weeks : []));

  // week count must match the declared schedule length
  if (sched && Number.isInteger(sched.weeks) && allWeeks.length !== sched.weeks) {
    fail(`content: ${allWeeks.length} weeks but config.schedule.weeks is ${sched.weeks}`);
  }

  // week numbers unique and contiguous 1..N
  const seen = new Set();
  for (const w of allWeeks) {
    if (!Number.isInteger(w.n)) { fail(`week: missing integer "n" (${JSON.stringify(w.d || w.r || '?')})`); continue; }
    if (seen.has(w.n)) fail(`week ${w.n}: duplicate number`);
    seen.add(w.n);
    if (!w.r) fail(`week ${w.n}: missing "r" (reading/material)`);
    if (!w.prompt?.it && !w.prompt?.target) fail(`week ${w.n}: missing prompt`);
    if (!Array.isArray(w.vocab) || w.vocab.length === 0) {
      fail(`week ${w.n}: missing vocab`);
    } else {
      w.vocab.forEach((v, i) => {
        if (!Array.isArray(v) || v.length < 3) fail(`week ${w.n} vocab[${i}]: expected [target, native, example, ipa?]`);
      });
    }
  }
  for (let i = 1; i <= allWeeks.length; i++) {
    if (!seen.has(i)) fail(`weeks: missing number ${i} (expected contiguous 1..${allWeeks.length})`);
  }

  return errors;
}
