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
        if (!Array.isArray(v) || v.length < 3) {
          fail(`week ${w.n} vocab[${i}]: expected [target, native, example, ipa?, extra?]`);
          return;
        }
        // Optional 5th element: { exEn, form }. Both are strings when present.
        const extra = v[4];
        if (extra !== undefined) {
          if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) {
            fail(`week ${w.n} vocab[${i}]: 5th element must be an object { exEn?, form? }`);
          } else {
            for (const key of ['exEn', 'form']) {
              if (extra[key] !== undefined && typeof extra[key] !== 'string') {
                fail(`week ${w.n} vocab[${i}].${key}: must be a string`);
              }
            }
            // A `form` that isn't in the example defeats its purpose — cloze
            // matching and the vocab table both look it up there.
            if (extra.form && v[2] && !v[2].toLowerCase().includes(extra.form.toLowerCase())) {
              fail(`week ${w.n} vocab[${i}]: form "${extra.form}" does not appear in the example "${v[2]}"`);
            }
          }
        }
      });
    }

    // Optional exegesis note: { title, body, forms? }
    if (w.exegesis !== undefined) {
      if (typeof w.exegesis !== 'object' || w.exegesis === null) {
        fail(`week ${w.n}: exegesis must be an object { title, body, forms? }`);
      } else {
        if (!w.exegesis.title) fail(`week ${w.n}: exegesis.title required`);
        if (!w.exegesis.body) fail(`week ${w.n}: exegesis.body required`);
        if (w.exegesis.forms !== undefined && !Array.isArray(w.exegesis.forms)) {
          fail(`week ${w.n}: exegesis.forms must be an array of { it, gloss, note }`);
        }
      }
    }
  }
  for (let i = 1; i <= allWeeks.length; i++) {
    if (!seen.has(i)) fail(`weeks: missing number ${i} (expected contiguous 1..${allWeeks.length})`);
  }

  return errors;
}
