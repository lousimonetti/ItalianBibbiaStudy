import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import {
  buildLesson, createTutor, next, parseCommand, scoreRepeat, pickEvenly, rankFocusWords, snapshot,
  PASS_SCORE, MAX_REPEATS, MAX_RECALLS, SILENT_LIMIT,
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
