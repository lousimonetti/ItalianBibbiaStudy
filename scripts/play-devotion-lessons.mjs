// Play the Prayers, Rosary and Saints lessons in a real browser and report
// anything broken. It answers every step with the plan's own solution (and one
// deliberately wrong tap, to exercise the retry), takes a screenshot of each
// kind of step, and prints PROBLEM lines for a step judged wrong, options that
// differ from the plan, horizontal overflow, or a console error.
//
// Usage (three terminals, or background the first two):
//   npm run dev -- --port 5199 --strictPort
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//       --remote-debugging-port=9333 --user-data-dir=/tmp/devotion-chrome about:blank
//   node scripts/play-devotion-lessons.mjs 9333 http://localhost:5199/ /tmp/devotion-shots 390 844
// Optional 6th argument: a prayer id from devotions.js (default padre-nostro).
// Run it at 390x844 and again at 1280x800. It clears localStorage for the
// origin, so point it at a dev server, never at a profile with real progress.
// Needs Node 22+ (global WebSocket). Pictures and the saint's story need a
// connection; without one those checks report false and the rest still runs.
import { writeFileSync, mkdirSync } from 'node:fs';
const [,, port, base, outDir, width = '390', height = '844', prayerId = 'padre-nostro'] = process.argv;
mkdirSync(outDir, { recursive: true });
const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error((r.result.exceptionDetails.exception?.description || 'eval failed') + ' :: ' + expr.slice(0, 120));
  return r.result.result.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tag = `${width}`;
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${outDir}/${tag}-${name}.png`, Buffer.from(r.result.data, 'base64'));
};
const overflow = () => ev(`document.documentElement.scrollWidth - window.innerWidth`);
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +width, height: +height, deviceScaleFactor: 2, mobile: +width < 700 });
await send('Page.navigate', { url: base }); await sleep(2500);
await ev(`localStorage.clear(); localStorage.setItem('italian-bible-welcome-seen','1'); location.reload()`); await sleep(2500);
await ev(`
  window.__q = (s) => document.querySelector(s);
  window.__type = (v) => { const el = __q('.lesson-input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(el, v); el.dispatchEvent(new Event('input',{bubbles:true})); };
  window.__primary = () => __q('.lesson-footer .lesson-primary')?.click();
  window.__click = (scope, text) => { const b = [...document.querySelectorAll(scope)].find((b) => b.textContent.trim().startsWith(text)); if (!b) throw new Error('no ' + scope + ' ' + text); b.click(); };
  (async () => { const p = await import('/src/utils/lessonPlan.js'); window.__sol = p.solutionFor; window.__dl = await import('/src/utils/devotionLessons.js');
    window.__dev = await import('/course/devotions.js'); window.__ros = await import('/course/rosary.js'); })()
`);

// Play whatever lesson is open, given the same lesson object in window.__lesson.
async function play(name) {
  const kinds = await ev(`__lesson.steps.map((s) => s.kind + (s.audio ? '-audio' : '') + (s.direction === 'fill' ? '-fill' : '') + (s.instruction ? '-inst' : ''))`);
  console.log(name, 'steps', kinds.length);
  const seen = new Set(); let missed = null;
  for (let i = 0; i <= kinds.length; i++) {
    const isRetry = i === kinds.length;
    if (isRetry && missed === null) break;
    const idx = isRetry ? missed : i;
    const kind = kinds[idx].split('-')[0];
    if (!(await ev(`!!__q('.lesson-body')`))) { console.log('PROBLEM: no lesson body at', idx, kinds[idx]); return; }
    if (isRetry && !(await ev(`!!__q('.lesson-retry')`))) console.log('PROBLEM: expected retry');
    if (!seen.has(kinds[idx])) {
      seen.add(kinds[idx]); await sleep(kind === 'line' ? 1500 : 250); await shot(`${name}-${String(seen.size).padStart(2, '0')}-${kinds[idx]}`);
      const o = await overflow(); if (o > 0) console.log(`PROBLEM: ${kinds[idx]} overflows by ${o}px`);
      const tall = await ev(`(() => { const b = __q('.lesson-body'); return b.scrollHeight - b.clientHeight; })()`);
      if (tall > 0) console.log(`note: ${kinds[idx]} body scrolls by ${tall}px`);
    }
    if (kind === 'line') await ev(`__primary()`);
    else if (kind === 'match') {
      const pairs = await ev(`__lesson.steps[${idx}].pairs`);
      for (const p of pairs) {
        await ev(`[...document.querySelectorAll('.lesson-match-col')[0].children].find((b) => b.textContent === ${JSON.stringify(p.it)}).click()`);
        await ev(`[...document.querySelectorAll('.lesson-match-col')[1].children].find((b) => b.textContent === ${JSON.stringify(p.en)}).click()`);
      }
      await sleep(100); await ev(`__primary()`);
    } else if (kind === 'choice') {
      const wrongNow = missed === null && !isRetry;
      const shown = await ev(`[...document.querySelectorAll('.lesson-option')].map((o) => o.textContent)`);
      const want = await ev(`__lesson.steps[${idx}].options`);
      if (JSON.stringify(shown) !== JSON.stringify(want)) console.log('PROBLEM: options differ at', idx, shown, want);
      await ev(`(() => { const s = __lesson.steps[${idx}]; const opts = document.querySelectorAll('.lesson-option'); let i = s.answer; if (${wrongNow}) i = (i + 1) % opts.length; opts[i].click(); })()`);
      await sleep(150);
      if (wrongNow) { missed = idx; await shot(`${name}-verdict-wrong`); }
      else if (!seen.has('v' + kinds[idx])) { seen.add('v' + kinds[idx]); await shot(`${name}-verdict-${kinds[idx]}`); }
      await ev(`__primary()`);
    } else if (kind === 'build') {
      const order = await ev(`(() => { const s = __lesson.steps[${idx}]; return __sol(s).map((ci) => s.chips[ci]); })()`);
      for (const w of order) await ev(`[...document.querySelectorAll('.lesson-build-pool .prac-chip')].find((c) => c.textContent === ${JSON.stringify(w)}).click()`);
      await sleep(100); await ev(`__primary()`); await sleep(120);
      if (!(await ev(`__q('.lesson-footer').classList.contains('correct')`))) console.log('PROBLEM: build judged wrong at', idx);
      await ev(`__primary()`);
    } else {
      await ev(`__type(__sol(__lesson.steps[${idx}]))`); await sleep(80); await ev(`__primary()`); await sleep(120);
      if (!seen.has('typed-ok')) { seen.add('typed-ok'); await shot(`${name}-verdict-typed`); }
      if (!(await ev(`__q('.lesson-footer').classList.contains('correct')`))) console.log('PROBLEM: typed solution judged wrong at', idx);
      await ev(`__primary()`);
    }
    await sleep(120);
  }
  await sleep(500);
  console.log(' summary:', await ev(`__q('.lesson-summary')?.innerText.replace(/\\n+/g,' | ')`));
  await shot(`${name}-summary`);
  await ev(`__q('.lesson-summary .lesson-primary').click()`); await sleep(400);
}

console.log('tabs:', await ev(`[...document.querySelectorAll('.tab-btn')].map((b) => b.textContent.trim()).join(' | ')`));
await ev(`document.querySelectorAll('.tab-btn')[3].click()`); await sleep(500);
console.log('subnav:', await ev(`[...document.querySelectorAll('.subnav button, .sub-nav button, [role=tablist] button')].map((b) => b.textContent.trim()).join(' | ')`));

// ── Prayers ──
await shot('prayers-top'); console.log('prayers overflow px:', await overflow());
console.log('tally:', await ev(`__q('.devotion-tally')?.innerText`));
await ev(`window.__prayer = __dev.devotionSections.flatMap((s) => s.prayers).find((p) => p.id === ${JSON.stringify(prayerId)}); window.__lesson = __dl.prayerLessons(__prayer)[0]`);
const card = `[...document.querySelectorAll('.prayer-card')].find((c) => c.querySelector('.prayer-title-it').textContent === __prayer.title)`;
await ev(`${card}.scrollIntoView({block:'start'})`); await sleep(300);
await shot('prayers-card');
await ev(`${card}.querySelector('.continue-btn').click()`); await sleep(400);
await play('prayer');
console.log('after: ', await ev(`${card}.querySelector('.devotion-learn').innerText.replace(/\\n+/g,' | ')`));
console.log('tally:', await ev(`__q('.devotion-tally')?.innerText`), '| store:', await ev(`localStorage.getItem('italian-bible-devotion-lessons')`), '| course lessons:', await ev(`localStorage.getItem('italian-bible-lessons')`), '| srs:', await ev(`localStorage.getItem('italian-bible-srs')`));
await shot('prayers-card-after');

// ── Rosary ──
await ev(`__click('.sub-nav-btn', 'Ros')`); await sleep(2500);
await shot('rosary-start'); console.log('rosary overflow px:', await overflow());
console.log('thumbs loaded:', await ev(`document.querySelectorAll('.rosary-thumb').length`));
await ev(`window.__lesson = __dl.mysteryLesson(__ros.rosary.sets.find((s) => s.days.includes(new Date().getDay())))`);
await ev(`__click('.devotion-learn .continue-secondary', 'Impara')`); await sleep(500);
await play('misteri');
console.log('after:', await ev(`__q('.devotion-learn').innerText.replace(/\\n+/g,' | ')`));
await ev(`__click('.rosary-begin', 'Inizia')`); await sleep(300);
for (let i = 0; i < 7; i++) { await ev(`__click('.prac-actions .prac-known-btn', 'Avanti')`); await sleep(80); }
await sleep(1200); await shot('rosary-mystery-step');
console.log('mystery step image:', await ev(`!!__q('.rosary-image')`), '| text:', await ev(`__q('.rosary-announce')?.innerText`));

// ── Saints ──
await ev(`__click('.sub-nav-btn', 'Sa')`); await sleep(4000);
// Not every day's story yields an exercise: step forward until one does.
for (let i = 0; i < 6 && !(await ev(`!!__q('.devotion-learn .continue-btn')`)); i++) { await ev(`document.querySelectorAll('.saints-nav-btn')[1].click()`); await sleep(3500); }
await shot('saints'); console.log('saints overflow px:', await overflow());
console.log('saint:', await ev(`__q('.saints-name')?.innerText`), '| image:', await ev(`!!__q('.saints-image')`), '| exercise:', await ev(`__q('.devotion-learn')?.innerText.replace(/\\n+/g,' | ')`));
if (await ev(`!!__q('.devotion-learn .continue-btn')`)) {
  await ev(`(() => { const name = __q('.saints-name').childNodes[0].textContent.trim(); const c = JSON.parse(localStorage.getItem('coursekit-saints-cache')); window.__lesson = Object.values(c).map((e) => e.it && __dl.saintLesson(name, e.it.extract)).find((l) => l && __q('.devotion-learn').innerText.includes(l.sub)); })()`);
  console.log('words:', await ev(`JSON.stringify(__lesson.steps.filter((s) => s.kind === 'line').map((s) => s.it + '=' + s.en))`));
  await ev(`__q('.devotion-learn .continue-btn').click()`); await sleep(400);
  await play('santo');
  console.log('devotion store after saint:', await ev(`localStorage.getItem('italian-bible-devotion-lessons')`));
}
console.log('streak:', await ev(`localStorage.getItem('italian-bible-streak')`));
console.log('console errors:', errors.length ? errors.slice(0, 6) : 'none');
ws.close();
