import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import {
  buildLesson, createTutor, next, parseCommand, scoreRepeat, pickEvenly, rankFocusWords, snapshot,
  parseWordQuestion, glossWord, breakdownPieces, repeatText, textLevel, firstLetter,
  PASS_SCORE, MAX_REPEATS, MAX_RECALLS, SILENT_LIMIT, SUPPORT_MAX, MAX_BREAKDOWNS,
} from './tutorEngine';

const week = {
  n: 1,
  vocab: [['il Verbo', 'the Word', 'In principio era il Verbo.']],
  passage: {
    ref: 'Giovanni 1,1-2',
    verses: [
      { n: 1, t: 'In principio era il Verbo.', en: 'In the beginning was the Word.' },
      { n: 2, t: 'Egli era, in principio, presso Dio.', en: 'He was in the beginning with God.' },
    ],
  },
  questions: [{ q: 'Che cosa era in principio?', answers: ['il Verbo'], model: 'In principio era il Verbo.' }],
};

// Plays out every queued utterance, so a test can speak only at the turns it cares about.
function drain(result) {
  let cur = result;
  let guard = 0;
  while (cur.state.phase === 'speaking' && guard++ < 200) cur = next(cur.state, { type: 'spoken' });
  return cur;
}

function startedAt(kind, lesson = buildLesson(week)) {
  const i = lesson.steps.findIndex((s) => s.kind === kind);
  return drain(next(createTutor(lesson, { resume: { i } }), { type: 'start' }));
}

const squash = (s) => s.replace(/\s+/g, '');
const spoken = (state) => state.queue.map((u) => u.text);
const allSteps = (st) => st.lesson.steps;

describe('buildLesson', () => {
  it('orders the lesson stages', () => {
    const kinds = buildLesson(week).steps.map((s) => s.kind);
    expect(kinds[0]).toBe('intro');
    expect(kinds[1]).toBe('listen');
    expect(kinds.at(-1)).toBe('recap');
    expect(kinds.indexOf('focus')).toBeGreaterThan(kinds.lastIndexOf('repeat'));
    expect(kinds.indexOf('ask')).toBeGreaterThan(kinds.indexOf('focus'));
    expect(kinds.indexOf('recall')).toBeGreaterThan(kinds.lastIndexOf('ask'));
  });

  it('gives an empty lesson when there is nothing to read', () => {
    expect(buildLesson({ n: 2, vocab: [] }).steps).toEqual([]);
  });

  it('only asks what the passage itself answers', () => {
    const offPassage = { ...week, questions: [...week.questions, { q: 'Chi è il mio pastore?', answers: ['il Signore'] }] };
    const asked = buildLesson(offPassage).steps.filter((s) => s.kind === 'ask').map((s) => s.q);
    expect(asked).toEqual(['Che cosa era in principio?']);
  });

  it('prefers a vocabulary word for the recall blank', () => {
    const recall = buildLesson(week).steps.find((s) => s.kind === 'recall' && s.verseId === 'Giovanni 1,1');
    expect(recall.answer).toBe('Verbo');
  });

  it('keeps recall punctuation out of the answer and on the spoken remainder', () => {
    const recall = buildLesson(week).steps.find((s) => s.kind === 'recall' && s.verseId === 'Giovanni 1,1');
    expect(squash(`${recall.before}${recall.answer}${recall.after}`)).toBe(squash(recall.full));
  });

  it('builds a valid, capped lesson for every week of the course', () => {
    for (const w of PHASES.flatMap((p) => p.weeks)) {
      const steps = buildLesson(w).steps;
      expect(steps.filter((s) => s.kind === 'repeat').length).toBeLessThanOrEqual(MAX_REPEATS);
      const recalls = steps.filter((s) => s.kind === 'recall');
      expect(recalls.length).toBeLessThanOrEqual(MAX_RECALLS);
      expect(recalls.length, `week ${w.n} has no recall`).toBeGreaterThan(0);
      for (const r of recalls) {
        expect(r.full.includes(r.answer), `week ${w.n}: ${r.answer}`).toBe(true);
        expect(squash(`${r.before}${r.answer}${r.after}`), `week ${w.n}`).toBe(squash(r.full));
      }
    }
  });
});

describe('scoreRepeat', () => {
  it('ignores punctuation and quotes a recognizer never returns', () => {
    expect(scoreRepeat('«Io sono il pane, della vita!»', 'io sono il pane della vita')).toBe(100);
  });

  it('fails an unrelated sentence', () => {
    expect(scoreRepeat('In principio era il Verbo', 'la casa è molto grande oggi')).toBeLessThan(PASS_SCORE);
  });
});

describe('parseCommand', () => {
  it('recognizes whole-utterance commands in both languages', () => {
    expect(parseCommand('Ripeti')).toBe('repeat');
    expect(parseCommand('più lentamente')).toBe('slower');
    expect(parseCommand('Avanti.')).toBe('skip');
    expect(parseCommand('basta')).toBe('stop');
    expect(parseCommand('stop')).toBe('stop');
  });

  it('never fires on a sentence that merely contains a command word', () => {
    expect(parseCommand('andiamo avanti')).toBeNull();
    expect(parseCommand('ancora una volta')).toBeNull();
  });
});

describe('pickEvenly', () => {
  it('keeps everything under the cap', () => {
    expect(pickEvenly([1, 2], 5)).toEqual([1, 2]);
  });

  it('spans the whole list in order', () => {
    expect(pickEvenly([0, 1, 2, 3, 4, 5, 6, 7], 4)).toEqual([0, 2, 4, 6]);
  });
});

describe('rankFocusWords', () => {
  it('ranks by misses, then alphabetically', () => {
    expect(rankFocusWords({ tenebre: 1, verbo: 3, luce: 1, vita: 1 }, 3)).toEqual(['verbo', 'luce', 'tenebre']);
  });
});

describe('a lesson run', () => {
  it('speaks one utterance at a time, and only listens after speech has ended', () => {
    const { state, effects } = next(createTutor(buildLesson(week)), { type: 'start' });
    expect(state.phase).toBe('speaking');
    expect(effects).toEqual([{ type: 'speak', utterance: state.queue[0] }]);
    expect(effects.some((e) => e.type === 'listen')).toBe(false);
  });

  it('reaches the first repeat and then listens', () => {
    const r = startedAt('repeat');
    expect(r.state.phase).toBe('listening');
    expect(r.effects).toEqual([{ type: 'listen' }]);
  });

  it('moves on after a good repeat', () => {
    const r = startedAt('repeat');
    const step = allSteps(r.state)[r.state.i];
    const after = next(r.state, { type: 'heard', alternatives: [step.text] });
    expect(after.state.stepOk).toBe(true);
    expect(after.state.feedback.tone).toBe('ok');
    const moved = drain(after);
    expect(moved.state.i).toBe(r.state.i + 1);
    expect(moved.state.totals).toEqual({ ok: 1, total: 1 });
  });

  it('grades the best alternative, not just the first', () => {
    const r = startedAt('repeat');
    const step = allSteps(r.state)[r.state.i];
    const after = next(r.state, { type: 'heard', alternatives: ['qualcosa di diverso', step.text] });
    expect(after.state.stepOk).toBe(true);
  });

  it('on a miss, names the missed words and replays slowly', () => {
    const r = startedAt('repeat');
    const after = next(r.state, { type: 'heard', alternatives: ['la casa grande'] });
    expect(after.state.stepOk).toBeNull();
    expect(after.state.attempt).toBe(1);
    expect(after.state.then).toBe('listen');
    expect(after.state.queue.at(-1).rate).toBe('slow');
    expect(spoken(after.state).some((t) => /principio/.test(t))).toBe(true);
    expect(after.state.wordMisses.principio).toBe(1);
  });

  it('gives up after the retries, records the verse missed, and moves on', () => {
    let r = startedAt('repeat');
    const i = r.state.i;
    for (let n = 0; n < 3; n++) {
      r = next(r.state, { type: 'heard', alternatives: ['la casa grande'] });
      r = drain(r);
    }
    expect(r.state.i).toBe(i + 1);
    expect(r.state.missed).toEqual(['Giovanni 1,1']);
    expect(r.state.totals).toEqual({ ok: 0, total: 1 });
  });

  it('drills the missed words in the focus step, then continues', () => {
    let r = startedAt('repeat');
    for (let n = 0; n < 3; n++) r = drain(next(r.state, { type: 'heard', alternatives: ['la casa grande'] }));
    while (allSteps(r.state)[r.state.i].kind === 'repeat') {
      r = drain(next(r.state, { type: 'heard', alternatives: [allSteps(r.state)[r.state.i].text] }));
    }
    expect(allSteps(r.state)[r.state.i].kind).toBe('focus');
    expect(r.state.focusWords.length).toBeGreaterThan(0);
    const word = r.state.focusWords[0];
    const after = next(r.state, { type: 'heard', alternatives: [word] });
    expect(after.state.stepOk).toBe(true);
  });

  it('skips the focus step when nothing was missed', () => {
    const lesson = buildLesson(week);
    const repeat = lesson.steps.findIndex((s) => s.kind === 'focus') - 1;
    let r = drain(next(createTutor(lesson, { resume: { i: repeat } }), { type: 'start' }));
    r = drain(next(r.state, { type: 'heard', alternatives: [lesson.steps[repeat].text] }));
    expect(allSteps(r.state)[r.state.i].kind).toBe('ask');
  });

  it('accepts a spoken answer and then models it', () => {
    const r = startedAt('ask');
    const after = next(r.state, { type: 'heard', alternatives: ['è il Verbo'] });
    expect(after.state.stepOk).toBe(true);
    expect(spoken(after.state)).toContain('In principio era il Verbo.');
  });

  it('reveals the answer after a second wrong answer', () => {
    let r = startedAt('ask');
    r = drain(next(r.state, { type: 'heard', alternatives: ['non lo so'] }));
    expect(r.state.phase).toBe('listening');
    const after = next(r.state, { type: 'heard', alternatives: ['non lo so'] });
    expect(after.state.stepOk).toBe(false);
    expect(spoken(after.state)).toContain('In principio era il Verbo.');
  });

  it('grades recall on the blanked word, inside a longer utterance too', () => {
    const r = startedAt('recall');
    const step = allSteps(r.state)[r.state.i];
    expect(next(r.state, { type: 'heard', alternatives: [`la parola è ${step.answer}`] }).state.stepOk).toBe(true);
  });

  it('ends with a summary carrying the score and missed verses', () => {
    const lesson = buildLesson(week);
    const i = lesson.steps.findIndex((s) => s.kind === 'recap');
    const r = next(createTutor(lesson, { resume: { i } }), { type: 'start' });
    const done = next(r.state, { type: 'spoken' });
    expect(done.state.phase).toBe('done');
    expect(done.effects).toEqual([{ type: 'finish', summary: expect.objectContaining({ weekN: 1, completed: true }) }]);
  });
});

describe('commands', () => {
  it('a spoken command acts without being graded as a miss', () => {
    const r = startedAt('repeat');
    const after = next(r.state, { type: 'heard', alternatives: ['ripeti'] });
    expect(after.state.attempt).toBe(0);
    expect(after.state.wordMisses).toEqual({});
    expect(after.effects[0]).toEqual({ type: 'cancel' });
    expect(after.state.then).toBe('listen');
  });

  it('a correct answer beats a command that is spelled the same', () => {
    const lesson = {
      weekN: 1,
      steps: [{ kind: 'ask', q: 'Che cosa dice?', answers: ['avanti'], model: 'Avanti.', first: false }, { kind: 'recap' }],
    };
    const r = drain(next(createTutor(lesson), { type: 'start' }));
    expect(next(r.state, { type: 'heard', alternatives: ['avanti'] }).state.stepOk).toBe(true);
  });

  it('slower stays slow for the rest of the lesson', () => {
    const r = startedAt('repeat');
    const after = next(r.state, { type: 'command', command: 'slower' });
    expect(after.state.slow).toBe(true);
    expect(after.state.queue.at(-1).rate).toBe('slow');
  });

  it('skip does not count the step either way', () => {
    const r = startedAt('repeat');
    const after = next(r.state, { type: 'command', command: 'skip' });
    expect(after.state.i).toBe(r.state.i + 1);
    expect(after.state.totals).toEqual({ ok: 0, total: 0 });
    expect(after.state.missed).toEqual([]);
  });

  it('stop finishes immediately and reports incomplete', () => {
    const r = startedAt('repeat');
    const after = next(r.state, { type: 'heard', alternatives: ['basta'] });
    expect(after.state.phase).toBe('done');
    expect(after.effects).toEqual([{ type: 'cancel' }, { type: 'finish', summary: expect.objectContaining({ completed: false }) }]);
  });

  it('override turns a final miss back into a pass', () => {
    let r = startedAt('repeat');
    r = drain(next(r.state, { type: 'heard', alternatives: ['la casa'] }));
    r = drain(next(r.state, { type: 'heard', alternatives: ['la casa'] }));
    r = next(r.state, { type: 'heard', alternatives: ['la casa'] });
    expect(r.state.stepOk).toBe(false);
    const after = drain(next(r.state, { type: 'override' }));
    expect(after.state.missed).toEqual([]);
    expect(after.state.totals).toEqual({ ok: 1, total: 1 });
  });
});

describe('silence and failure', () => {
  it('retries on silence without counting a word miss', () => {
    const r = startedAt('repeat');
    const after = next(r.state, { type: 'noSpeech' });
    expect(after.state.feedback.tone).toBe('silent');
    expect(after.state.wordMisses).toEqual({});
    expect(after.state.then).toBe('listen');
  });

  it('pauses after repeated silence instead of running through the lesson', () => {
    let r = startedAt('repeat');
    for (let n = 0; n < SILENT_LIMIT; n++) {
      r = next(r.state, { type: 'noSpeech' });
      if (r.state.phase === 'speaking') r = drain(r);
    }
    expect(r.state.phase).toBe('paused');
    expect(r.state.pausedReason).toBe('silent');
    expect(r.effects).toEqual([{ type: 'cancel' }]);
  });

  it('resume repeats the prompt and listens again', () => {
    let r = startedAt('repeat');
    for (let n = 0; n < SILENT_LIMIT; n++) {
      r = next(r.state, { type: 'noSpeech' });
      if (r.state.phase === 'speaking') r = drain(r);
    }
    const resumed = drain(next(r.state, { type: 'resume' }));
    expect(resumed.state.phase).toBe('listening');
    expect(resumed.state.silentStreak).toBe(0);
  });

  it('falls back to typing when the mic is unavailable', () => {
    const r = startedAt('repeat');
    const after = next(r.state, { type: 'micUnavailable' });
    expect(after.state.phase).toBe('typing');
    const step = allSteps(after.state)[after.state.i];
    expect(next(after.state, { type: 'typed', text: step.text }).state.stepOk).toBe(true);
  });

  it('never emits listen in typing mode', () => {
    const lesson = buildLesson(week);
    const i = lesson.steps.findIndex((s) => s.kind === 'repeat');
    let r = next(createTutor(lesson, { typing: true, resume: { i } }), { type: 'start' });
    const effects = [...r.effects];
    while (r.state.phase === 'speaking') {
      r = next(r.state, { type: 'spoken' });
      effects.push(...r.effects);
    }
    expect(r.state.phase).toBe('typing');
    expect(effects.some((e) => e.type === 'listen')).toBe(false);
  });

  it('ignores a late result after the lesson has moved to speaking', () => {
    const r = startedAt('repeat');
    const speaking = next(r.state, { type: 'command', command: 'repeat' });
    expect(next(speaking.state, { type: 'heard', alternatives: ['x'] }).state).toBe(speaking.state);
  });
});

describe('pause and resume', () => {
  it('pause cancels speech and resume picks up the same utterance', () => {
    const started = next(createTutor(buildLesson(week)), { type: 'start' });
    const paused = next(started.state, { type: 'pause' });
    expect(paused.effects).toEqual([{ type: 'cancel' }]);
    const resumed = next(paused.state, { type: 'resume' });
    expect(resumed.effects).toEqual([{ type: 'speak', utterance: started.state.queue[0] }]);
  });

  it('a snapshot restores position, totals and misses', () => {
    let r = startedAt('repeat');
    for (let n = 0; n < 3; n++) r = drain(next(r.state, { type: 'heard', alternatives: ['la casa grande'] }));
    const restored = createTutor(buildLesson(week), { resume: JSON.parse(JSON.stringify(snapshot(r.state))) });
    expect(restored.i).toBe(r.state.i);
    expect(restored.missed).toEqual(r.state.missed);
    expect(restored.wordMisses).toEqual(r.state.wordMisses);
  });
});

describe('a full lesson for every week', () => {
  it('runs start to finish on correct answers with no misses', () => {
    for (const w of PHASES.flatMap((p) => p.weeks)) {
      let r = drain(next(createTutor(buildLesson(w)), { type: 'start' }));
      let guard = 0;
      while (r.state.phase !== 'done' && guard++ < 200) {
        const step = allSteps(r.state)[r.state.i];
        const answer = step.kind === 'repeat' ? step.text
          : step.kind === 'ask' ? step.answers[0]
            : step.kind === 'recall' ? step.answer
              : r.state.focusWords[r.state.sub];
        const prev = next(r.state, { type: 'heard', alternatives: [answer] });
        expect(prev.state.stepOk, `week ${w.n} ${step.kind}: ${answer}`).toBe(true);
        r = drain(prev);
      }
      expect(r.state.phase).toBe('done');
      expect(r.state.missed).toEqual([]);
      expect(r.state.totals.ok).toBe(r.state.totals.total);
    }
  });
});

const LONG = 'Egli era in principio presso Dio e tutto per mezzo di lui fu fatto.';
const repeatLesson = (texts) => ({
  weekN: 1,
  steps: [
    ...texts.map((text, i) => ({ kind: 'repeat', text, en: 'English', verseId: `V ${i}`, first: false })),
    { kind: 'focus' },
    { kind: 'recap' },
  ],
});
const startLesson = (lesson, opts) => drain(next(createTutor(lesson, opts), { type: 'start' }));
const hear = (r, ...alternatives) => drain(next(r.state, { type: 'heard', alternatives }));
const hearOnly = (r, ...alternatives) => next(r.state, { type: 'heard', alternatives });

describe('adaptive support', () => {
  const lines = ['Il primo versetto qui.', 'Il secondo versetto qui.', 'Il terzo versetto qui.', 'Il quarto versetto qui.',
    'Il quinto versetto qui.', 'Il sesto versetto qui.', 'Il settimo versetto qui.', 'Ottavo versetto ancora qui.'];

  it('fades the text after two first-try passes in a row', () => {
    let r = startLesson(repeatLesson(lines));
    expect(r.state.support).toBe(0);
    r = hear(r, lines[0]);
    expect(r.state.support).toBe(0);
    r = hear(r, lines[1]);
    expect(r.state.support).toBe(1);
    expect(textLevel(r.state)).toBe(1);
  });

  it('never fades past audio only', () => {
    let r = startLesson(repeatLesson(lines));
    for (const line of lines) r = hear(r, line);
    expect(r.state.support).toBe(SUPPORT_MAX);
  });

  it('a miss gives text back, and shows all of it for the retry', () => {
    let r = startLesson(repeatLesson(lines));
    for (const line of lines.slice(0, 4)) r = hear(r, line);
    expect(r.state.support).toBe(2);
    r = hear(r, 'la casa grande');
    expect(r.state.support).toBe(1);
    expect(textLevel(r.state)).toBe(0);
  });

  it('drops only once per line, however many tries it takes', () => {
    let r = startLesson(repeatLesson(lines));
    for (const line of lines.slice(0, 4)) r = hear(r, line);
    const i = r.state.i;
    for (let n = 0; n < 3; n++) r = hear(r, 'la casa grande');
    expect(r.state.i).toBe(i + 1);
    expect(r.state.support).toBe(1);
  });

  it('silence is not a miss, so it keeps the support level', () => {
    let r = startLesson(repeatLesson(lines));
    for (const line of lines.slice(0, 2)) r = hear(r, line);
    r = drain(next(r.state, { type: 'noSpeech' }));
    expect(r.state.support).toBe(1);
  });

  it('a retried pass earns no credit toward fading', () => {
    let r = startLesson(repeatLesson(lines));
    r = hear(r, lines[0]);
    expect(r.state.passStreak).toBe(1);
    r = hear(r, 'la casa grande');
    r = hear(r, lines[1]);
    expect(r.state.passStreak).toBe(0);
    expect(r.state.support).toBe(0);
  });

  it('Show text reveals the line, lowers support, and earns no credit', () => {
    let r = startLesson(repeatLesson(lines));
    for (const line of lines.slice(0, 4)) r = hear(r, line);
    expect(textLevel(r.state)).toBe(2);
    const shown = next(r.state, { type: 'showText' });
    expect(shown.effects).toEqual([]);
    expect(textLevel(shown.state)).toBe(0);
    expect(shown.state.support).toBe(1);
    const passed = drain(next(shown.state, { type: 'heard', alternatives: [lines[4]] }));
    expect(passed.state.passStreak).toBe(0);
    expect(passed.state.support).toBe(1);
  });

  it('Show text does nothing when the text is already showing', () => {
    const r = startLesson(repeatLesson(lines));
    expect(next(r.state, { type: 'showText' }).state).toBe(r.state);
  });

  it('support and breakdowns survive a same-day resume, and older resume data still loads', () => {
    let r = startLesson(repeatLesson(lines));
    for (const line of lines.slice(0, 2)) r = hear(r, line);
    const snap = JSON.parse(JSON.stringify(snapshot(r.state)));
    expect(createTutor(repeatLesson(lines), { resume: snap }).support).toBe(1);
    const { support: _s, breakdowns: _b, ...older } = snap;
    const restored = createTutor(repeatLesson(lines), { resume: older });
    expect(restored.support).toBe(0);
    expect(restored.breakdowns).toBe(0);
  });

  it('adapting never changes the score', () => {
    let r = startLesson(repeatLesson(lines));
    for (const line of lines) r = hear(r, line);
    expect(r.state.totals).toEqual({ ok: lines.length, total: lines.length });
  });
});

describe('breaking down a hard line', () => {
  const pieces = breakdownPieces(LONG);

  it('splits long lines only', () => {
    expect(breakdownPieces('In principio era il Verbo.')).toEqual([]);
    expect(pieces.length).toBeGreaterThanOrEqual(2);
    expect(pieces.join(' ')).toBe(LONG);
  });

  it('splits every long line in the course into 2 to 4 pieces, losing nothing', () => {
    const chunks = PHASES.flatMap((p) => p.weeks).flatMap((w) => buildLesson(w).steps)
      .filter((s) => s.kind === 'repeat' && s.text.trim().split(/\s+/).length >= 6);
    expect(chunks.length).toBeGreaterThan(100);
    for (const { text } of chunks) {
      const parts = breakdownPieces(text);
      expect(parts.length, text).toBeGreaterThanOrEqual(2);
      expect(parts.length, text).toBeLessThanOrEqual(4);
      expect(parts.join(' ').replace(/\s+/g, ' ')).toBe(text.replace(/\s+/g, ' '));
    }
  });

  it('starts after the second failed attempt, not the first', () => {
    let r = startLesson(repeatLesson([LONG]));
    r = hear(r, 'la casa grande');
    expect(r.state.pieces).toEqual([]);
    r = hear(r, 'la casa grande');
    expect(r.state.pieces).toEqual(pieces);
    expect(repeatText(r.state, r.state.lesson.steps[r.state.i])).toBe(pieces[0]);
    expect(r.state.breakdowns).toBe(1);
  });

  it('counts only the final try at the whole line, and a pass there is a pass', () => {
    let r = startLesson(repeatLesson([LONG]));
    r = hear(r, 'la casa grande');
    r = hear(r, 'la casa grande');
    for (let n = 0; n < pieces.length; n++) {
      expect(r.state.totals.total).toBe(0);
      r = hear(r, 'la casa grande');
    }
    expect(r.state.pieces).toEqual([]);
    expect(repeatText(r.state, r.state.lesson.steps[r.state.i])).toBe(LONG);
    r = hear(r, LONG);
    expect(r.state.totals).toEqual({ ok: 1, total: 1 });
    expect(r.state.missed).toEqual([]);
  });

  it('a failed final try is one miss, however the pieces went', () => {
    let r = startLesson(repeatLesson([LONG]));
    r = hear(r, 'la casa grande');
    r = hear(r, 'la casa grande');
    for (const piece of pieces) r = hear(r, piece);
    r = hear(r, 'la casa grande');
    expect(r.state.totals).toEqual({ ok: 0, total: 1 });
    expect(r.state.missed).toEqual(['V 0']);
  });

  it('pieces add no word misses to the tricky-words drill', () => {
    let r = startLesson(repeatLesson([LONG]));
    r = hear(r, 'la casa grande');
    r = hear(r, 'la casa grande');
    const before = r.state.wordMisses;
    r = hear(r, 'qualcosa di diverso');
    expect(r.state.wordMisses).toEqual(before);
  });

  it('silence on a piece moves on rather than sticking', () => {
    let r = startLesson(repeatLesson([LONG]));
    r = hear(r, 'la casa grande');
    r = hear(r, 'la casa grande');
    const pieceI = r.state.pieceI;
    r = drain(next(r.state, { type: 'noSpeech' }));
    expect(r.state.pieceI).toBe(pieceI + 1);
    expect(r.state.silentStreak).toBe(1);
  });

  it('commands still work during a breakdown, and repeat replays the piece', () => {
    let r = startLesson(repeatLesson([LONG]));
    r = hear(r, 'la casa grande');
    r = hear(r, 'la casa grande');
    const again = next(r.state, { type: 'command', command: 'repeat' });
    expect(again.state.queue.at(-1).text).toBe(pieces[0]);
    const skipped = drain(next(r.state, { type: 'command', command: 'skip' }));
    expect(skipped.state.pieces).toEqual([]);
    expect(skipped.state.totals).toEqual({ ok: 0, total: 0 });
  });

  it('override can pass the whole line, but has nothing to overturn on a piece', () => {
    let r = startLesson(repeatLesson([LONG]));
    r = hear(r, 'la casa grande');
    r = hear(r, 'la casa grande');
    const passed = drain(next(r.state, { type: 'override' }));
    expect(passed.state.totals).toEqual({ ok: 1, total: 1 });
    expect(passed.state.pieces).toEqual([]);
    const afterPiece = hear(r, 'qualcosa di diverso');
    expect(afterPiece.state.feedback.piece).toBe(true);
    expect(next(afterPiece.state, { type: 'override' }).state).toBe(afterPiece.state);
  });

  it('stops breaking lines down past the cap', () => {
    const lesson = repeatLesson([LONG, LONG, LONG, LONG]);
    let r = startLesson(lesson);
    for (let line = 0; line < MAX_BREAKDOWNS; line++) {
      r = hear(r, 'la casa grande');
      r = hear(r, 'la casa grande');
      for (let n = 0; n < pieces.length + 1; n++) r = hear(r, 'la casa grande');
    }
    expect(r.state.breakdowns).toBe(MAX_BREAKDOWNS);
    r = hear(r, 'la casa grande');
    r = hear(r, 'la casa grande');
    expect(r.state.pieces).toEqual([]);
    expect(r.state.attempt).toBe(2);
  });

  it('a silent second attempt does not start a breakdown', () => {
    let r = startLesson(repeatLesson([LONG]));
    r = hear(r, 'la casa grande');
    r = drain(next(r.state, { type: 'noSpeech' }));
    expect(r.state.pieces).toEqual([]);
  });
});

describe('hints', () => {
  it('finds a hint in the passage for every question the lesson asks', () => {
    const asks = PHASES.flatMap((p) => p.weeks).flatMap((w) => buildLesson(w).steps).filter((s) => s.kind === 'ask');
    expect(asks.length).toBeGreaterThan(100);
    for (const a of asks) expect(a.hint, a.q).toBeTruthy();
  });

  it('after a wrong answer, replays the line holding the answer', () => {
    const r = startedAt('ask');
    const after = hearOnly(r, 'non lo so');
    expect(after.state.hinted).toBe(true);
    expect(spoken(after.state)).toContain('In principio era il Verbo.');
    expect(spoken(after.state).at(-1)).toBe('Che cosa era in principio?');
  });

  it('silence gets no hint, since nothing was tried', () => {
    const r = startedAt('ask');
    const after = next(r.state, { type: 'noSpeech' });
    expect(after.state.hinted).toBe(false);
    expect(spoken(after.state)).not.toContain('In principio era il Verbo.');
  });

  it('recall gives the first letter, and does not give the word', () => {
    const r = startedAt('recall');
    const step = allSteps(r.state)[r.state.i];
    const after = hearOnly(r, 'non lo so');
    expect(after.state.hinted).toBe(true);
    expect(spoken(after.state)).toContain(firstLetter(step.answer));
    expect(spoken(after.state)).not.toContain(step.answer);
  });

  it('a hint clears on the next step', () => {
    let r = startedAt('ask');
    r = hear(r, 'non lo so');
    r = hear(r, 'il Verbo');
    expect(r.state.hinted).toBe(false);
  });

  it('firstLetter handles accented capitals', () => {
    expect(firstLetter('verbo')).toBe('V');
    expect(firstLetter('è')).toBe('È');
  });
});

describe('spoken word questions', () => {
  it('recognizes the question frames and keeps the word as said', () => {
    expect(parseWordQuestion('Che vuol dire vinsero?')).toBe('vinsero');
    expect(parseWordQuestion('cosa significa la luce')).toBe('la luce');
    expect(parseWordQuestion('che cosa vuol dire città')).toBe('città');
    expect(parseWordQuestion('che cosa vuole dire «tenebre»?')).toBe('tenebre');
    expect(parseWordQuestion("cosa vuol dire l'uomo")).toBe("l'uomo");
    expect(parseWordQuestion('che cosa vuol dire la parola città')).toBe('città');
    expect(parseWordQuestion('What does tenebre mean?')).toBe('tenebre');
    expect(parseWordQuestion('what does the word tenebre mean')).toBe('tenebre');
  });

  it('ignores anything that is not a question about a word', () => {
    expect(parseWordQuestion('che vuol dire')).toBeNull();
    expect(parseWordQuestion('what does mean')).toBeNull();
    expect(parseWordQuestion('la casa significa molto')).toBeNull();
    expect(parseWordQuestion('che vuol dire questo versetto nel vangelo di oggi')).toBeNull();
    expect(parseWordQuestion('')).toBeNull();
    expect(parseWordQuestion(null)).toBeNull();
  });

  it('answers from both glossaries, and says when it has no answer', () => {
    expect(glossWord('la luce')).toBe('the light');
    expect(glossWord('vinsero')).toBe('won/overcame');
    expect(glossWord("l'uomo")).toBe('the man');
    expect(glossWord('pizza')).toBeNull();
  });

  it('answers in place, using no attempt and repeating the prompt', () => {
    const r = startedAt('ask');
    const after = hearOnly(r, 'che vuol dire principio?');
    expect(after.state.attempt).toBe(0);
    expect(after.state.stepOk).toBeNull();
    expect(after.state.glossed.word).toBe('principio');
    expect(after.state.glossed.en).toBeTruthy();
    expect(after.state.queue[0]).toMatchObject({ text: 'principio', rate: 'slow' });
    expect(spoken(after.state).at(-1)).toBe('Che cosa era in principio?');
    expect(drain(after).state.phase).toBe('listening');
  });

  it('asking about the answer never counts as giving it', () => {
    const r = startedAt('ask');
    const after = hearOnly(r, 'che vuol dire il Verbo?');
    expect(after.state.stepOk).toBeNull();
    expect(after.state.totals).toEqual({ ok: 0, total: 0 });
    expect(after.state.glossed.word).toBe('il Verbo');
  });

  it('asking about the recall answer never counts as giving it', () => {
    const r = startedAt('recall');
    const step = allSteps(r.state)[r.state.i];
    expect(hearOnly(r, `che vuol dire ${step.answer}`).state.stepOk).toBeNull();
  });

  it('on Repeat, a line containing the frame is graded as the line', () => {
    const text = 'Andate a imparare che cosa vuol dire questo.';
    const r = startLesson(repeatLesson([text]));
    expect(hearOnly(r, text).state.stepOk).toBe(true);
  });

  it('on Repeat, a question that does not pass is answered and costs nothing', () => {
    const r = startLesson(repeatLesson(['In principio era il Verbo.']));
    const after = hearOnly(r, 'che vuol dire principio');
    expect(after.state.attempt).toBe(0);
    expect(after.state.wordMisses).toEqual({});
    expect(after.state.glossed.word).toBe('principio');
  });

  it('an unknown word gets an honest answer, and the lesson carries on', () => {
    const r = startedAt('ask');
    const after = hearOnly(r, 'che vuol dire pizza?');
    expect(after.state.glossed).toBeNull();
    expect(spoken(after.state)[0]).toBe('Non conosco questa parola.');
    expect(after.state.attempt).toBe(0);
  });

  it('works when typed too', () => {
    const r = next(createTutor(buildLesson(week), { typing: true, resume: { i: buildLesson(week).steps.findIndex((s) => s.kind === 'ask') } }), { type: 'start' });
    const typing = drain(r);
    expect(typing.state.phase).toBe('typing');
    const after = next(typing.state, { type: 'typed', text: 'cosa significa principio' });
    expect(after.state.glossed.word).toBe('principio');
    expect(drain(after).state.phase).toBe('typing');
  });

  it('the gloss clears when the step changes', () => {
    let r = startedAt('ask');
    r = hear(r, 'che vuol dire principio?');
    r = hear(r, 'il Verbo');
    expect(r.state.glossed).toBeNull();
  });
});
