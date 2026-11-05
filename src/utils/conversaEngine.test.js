import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import { createConversa, next, MAX_TURNS } from './conversaEngine';
import { SILENT_LIMIT } from './tutorEngine';
import { conversaOpening } from './tutorPrompts';

const week = PHASES.flatMap((p) => p.weeks)[0];
const opening = conversaOpening(week);

function drain(result) {
  let cur = result;
  let guard = 0;
  const effects = [...cur.effects];
  while (cur.state.phase === 'speaking' && guard++ < 200) {
    cur = next(cur.state, { type: 'spoken' });
    effects.push(...cur.effects);
  }
  return { state: cur.state, effects };
}

const started = (opts) => drain(next(createConversa(week, opts), { type: 'start' }));
const hear = (r, text) => next(r.state, { type: 'heard', alternatives: [text] });
const genOf = (r) => r.effects.find((e) => e.type === 'generate');
const delta = (r, text, id = r.state.genId) => next(r.state, { type: 'delta', id, text });
const done = (r, id = r.state.genId) => next(r.state, { type: 'generated', id });

function fullTurn(r, text, reply = 'Va bene. Che cosa pensi?') {
  return drain(done(delta(hear(r, text), reply)));
}

describe('opening', () => {
  it('speaks an authored line first, before any model is involved', () => {
    const first = next(createConversa(week), { type: 'start' });
    expect(first.effects).toEqual([{ type: 'speak', utterance: expect.objectContaining({ text: opening }) }]);
    expect(first.effects.some((e) => e.type === 'generate')).toBe(false);
  });

  it('opens the mic only once the line has been spoken', () => {
    const first = next(createConversa(week), { type: 'start' });
    expect(first.effects.some((e) => e.type === 'listen')).toBe(false);
    const after = next(first.state, { type: 'spoken' });
    expect(after.effects).toEqual([{ type: 'listen' }]);
  });

  it('ends at once for a week with nothing to open with', () => {
    const r = next(createConversa({ n: 99 }), { type: 'start' });
    expect(r.state.phase).toBe('done');
    expect(r.effects[0].summary).toEqual({ weekN: 99, turns: 0, completed: false });
  });
});

describe('a turn', () => {
  it('sends the reading and the conversation so far to the model', () => {
    const r = hear(started(), 'La luce è bella.');
    const gen = genOf(r);
    expect(r.state.phase).toBe('thinking');
    expect(gen.system).toMatch(/simple Italian/);
    expect(gen.messages.at(-1)).toEqual({ role: 'user', content: 'La luce è bella.' });
    expect(gen.messages).toHaveLength(1);
    expect(gen.system).toContain(opening);
    expect(r.state.turns).toBe(1);
  });

  it('speaks each sentence as it completes, while the rest is still coming', () => {
    let r = hear(started(), 'Ciao');
    r = delta(r, 'Sì, è vero. Che ');
    expect(r.state.phase).toBe('speaking');
    expect(r.effects).toEqual([{ type: 'speak', utterance: expect.objectContaining({ text: 'Sì, è vero.' }) }]);
    r = delta(r, 'cosa pensi? ');
    expect(r.effects).toEqual([]);
    expect(r.state.queue.map((u) => u.text)).toEqual(['Sì, è vero.', 'Che cosa pensi?']);
  });

  it('never opens the mic while a reply is still arriving', () => {
    let r = hear(started(), 'Ciao');
    r = delta(r, 'Sì, è vero. ');
    r = next(r.state, { type: 'spoken' });
    expect(r.state.phase).toBe('thinking');
    expect(r.effects).toEqual([]);
    r = delta(r, 'Che cosa pensi?');
    r = done(r);
    expect(r.state.phase).toBe('speaking');
    expect(r.effects.some((e) => e.type === 'listen')).toBe(false);
    expect(next(r.state, { type: 'spoken' }).effects).toEqual([{ type: 'listen' }]);
  });

  it('never opens the mic while earlier sentences are still being spoken', () => {
    let r = hear(started(), 'Ciao');
    r = delta(r, 'Uno. Due. ');
    r = done(r);
    expect(r.state.phase).toBe('speaking');
    r = next(r.state, { type: 'spoken' });
    expect(r.state.phase).toBe('speaking');
    expect(r.effects.some((e) => e.type === 'listen')).toBe(false);
  });

  it('remembers the reply as cleaned text for the next turn', () => {
    const r = fullTurn(started(), 'Ciao', '**Bene!** Che cosa pensi?');
    expect(r.state.history.at(-1)).toEqual({ role: 'assistant', content: 'Bene! Che cosa pensi?' });
    expect(genOf(hear(r, 'Altro')).messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
  });
});

describe('nothing a model says is graded', () => {
  it('reports only the turns taken, whatever the model replied', () => {
    let r = started();
    r = fullTurn(r, 'Uno', 'Sbagliato. Hai fallito.');
    r = fullTurn(r, 'Due', 'Perfetto! Punteggio massimo.');
    const stopped = next(r.state, { type: 'command', command: 'stop' });
    expect(stopped.effects.at(-1)).toEqual({ type: 'finish', summary: { weekN: 1, turns: 2, completed: false } });
  });
});

describe('a cancelled stream', () => {
  it('ignores a late delta and a late end from an abandoned generation', () => {
    let r = hear(started(), 'Ciao');
    const old = r.state.genId;
    r = next(r.state, { type: 'pause' });
    const ignoredDelta = next(r.state, { type: 'delta', id: old, text: 'Tardi. ' });
    expect(ignoredDelta.state).toBe(r.state);
    expect(next(r.state, { type: 'generated', id: old }).state).toBe(r.state);
    expect(next(r.state, { type: 'failed', id: old }).state).toBe(r.state);
  });

  it('a stale stream cannot write into the turn that replaced it', () => {
    let r = hear(started(), 'Ciao');
    const old = r.state.genId;
    r = next(r.state, { type: 'pause' });
    r = next(r.state, { type: 'resume' });
    expect(r.state.genId).toBeGreaterThan(old);
    const late = next(r.state, { type: 'delta', id: old, text: 'Vecchio testo. ' });
    expect(late.state).toBe(r.state);
    expect(late.effects).toEqual([]);
  });

  it('ignores everything once the conversation has ended', () => {
    let r = hear(started(), 'Ciao');
    const id = r.state.genId;
    r = next(r.state, { type: 'command', command: 'stop' });
    expect(next(r.state, { type: 'delta', id, text: 'Tardi. ' }).state).toBe(r.state);
  });
});

describe('pause and resume', () => {
  it('asks afresh after pausing mid-reply, dropping the part already received', () => {
    let r = hear(started(), 'Ciao');
    r = delta(r, 'Metà. ');
    r = next(r.state, { type: 'pause' });
    expect(r.effects).toEqual([{ type: 'cancel' }]);
    expect(r.state.queue).toEqual([]);
    const resumed = next(r.state, { type: 'resume' });
    expect(genOf(resumed)).toBeTruthy();
    expect(resumed.state.reply).toEqual([]);
    expect(resumed.state.turns).toBe(1);
  });

  it('picks up the same sentence after pausing a finished reply', () => {
    let r = hear(started(), 'Ciao');
    r = done(delta(r, 'Uno. Due.'));
    r = next(r.state, { type: 'pause' });
    const resumed = next(r.state, { type: 'resume' });
    expect(resumed.effects).toEqual([{ type: 'speak', utterance: expect.objectContaining({ text: 'Uno.' }) }]);
  });
});

describe('failures', () => {
  const failedTurn = (reason) => drain(next(hear(started(), 'Ciao').state, { type: 'failed', id: 1, reason }));

  it('says so calmly and waits, instead of leaving the learner stuck', () => {
    const r = failedTurn('error');
    expect(r.state.phase).toBe('failed');
    expect(r.state.failure).toBe('error');
    expect(r.effects.some((e) => e.type === 'speak')).toBe(true);
    expect(r.effects.some((e) => e.type === 'listen')).toBe(false);
  });

  it('uses a different line when the model refused', () => {
    const say = (reason) => next(hear(started(), 'Ciao').state, { type: 'failed', id: 1, reason }).state.queue[0].text;
    expect(say('refused')).not.toBe(say('error'));
  });

  it('retry sends the same turn again', () => {
    const r = next(failedTurn('error').state, { type: 'retry' });
    expect(genOf(r).messages.at(-1).content).toBe('Ciao');
    expect(r.state.turns).toBe(1);
    expect(r.state.failure).toBeNull();
  });

  it('rephrase drops the unanswered turn and listens again', () => {
    const r = next(failedTurn('refused').state, { type: 'rephrase' });
    expect(r.effects).toEqual([{ type: 'listen' }]);
    expect(r.state.turns).toBe(0);
    expect(r.state.history.at(-1).role).toBe('assistant');
  });

  it('rephrasing after a failed change of topic takes no turn away', () => {
    let r = fullTurn(started(), 'Ciao');
    r = hear(r, 'avanti');
    r = drain(next(r.state, { type: 'failed', id: r.state.genId }));
    r = next(r.state, { type: 'rephrase' });
    expect(r.state.turns).toBe(1);
    expect(r.state.history.at(-1).role).toBe('assistant');
  });

  it('treats an empty reply as a failure', () => {
    const r = drain(done(hear(started(), 'Ciao')));
    expect(r.state.phase).toBe('failed');
    expect(r.state.failure).toBe('empty');
  });

  it('treats a reply of only symbols as a failure', () => {
    const r = drain(done(delta(hear(started(), 'Ciao'), '*** ---')));
    expect(r.state.phase).toBe('failed');
  });

  it('a failure mid-reply stops what was queued from that reply', () => {
    let r = hear(started(), 'Ciao');
    r = delta(r, 'Uno. Due. ');
    r = next(r.state, { type: 'failed', id: r.state.genId });
    expect(r.effects[0]).toEqual({ type: 'cancel' });
    expect(r.state.queue.map((u) => u.text)).not.toContain('Due.');
  });

  it('stop still works from a failure', () => {
    const r = next(failedTurn('error').state, { type: 'command', command: 'stop' });
    expect(r.state.phase).toBe('done');
  });
});

describe('commands and questions', () => {
  it('stops on basta, reporting the turns so far', () => {
    const r = hear(started(), 'basta');
    expect(r.state.phase).toBe('done');
    expect(r.effects).toEqual([{ type: 'cancel' }, { type: 'finish', summary: { weekN: 1, turns: 0, completed: false } }]);
  });

  it('repeat replays the last reply and costs no turn', () => {
    const r = fullTurn(started(), 'Ciao', 'Uno. Due.');
    const again = hear(r, 'ripeti');
    expect(again.state.queue.map((u) => u.text)).toEqual(['Uno.', 'Due.']);
    expect(again.state.turns).toBe(1);
    expect(genOf(again)).toBeUndefined();
  });

  it('slower stays slow for later replies', () => {
    let r = started();
    r = drain(hear(r, 'più lentamente'));
    expect(r.state.slow).toBe(true);
    const reply = delta(hear(r, 'Ciao'), 'Uno. ');
    expect(reply.state.queue[0].rate).toBe('slow');
  });

  it('avanti asks for something else without counting as a turn', () => {
    const r = hear(started(), 'avanti');
    expect(genOf(r)).toBeTruthy();
    expect(r.state.turns).toBe(0);
  });

  it('a command is ignored while a reply is on its way', () => {
    const r = hear(started(), 'Ciao');
    const again = next(r.state, { type: 'command', command: 'repeat' });
    expect(again.effects).toEqual([]);
    expect(again.state.generating).toBe(true);
  });

  it('answers a word question from the glossary, with no model and no turn', () => {
    const r = hear(started(), 'che vuol dire principio?');
    expect(genOf(r)).toBeUndefined();
    expect(r.state.turns).toBe(0);
    expect(r.state.glossed.word).toBe('principio');
    expect(r.state.queue[0]).toMatchObject({ text: 'principio', rate: 'slow' });
    expect(drain(r).state.phase).toBe('listening');
  });

  it('an ordinary sentence containing a command word is a turn', () => {
    expect(hear(started(), 'Il figlio va avanti con coraggio').state.turns).toBe(1);
  });
});

describe('silence', () => {
  it('says it heard nothing, then listens again, at no cost', () => {
    const r = drain(next(started().state, { type: 'noSpeech' }));
    expect(r.state.phase).toBe('listening');
    expect(r.state.turns).toBe(0);
  });

  it('pauses after repeated silence, and resumes with the last line', () => {
    let r = started();
    for (let n = 0; n < SILENT_LIMIT; n++) {
      r = drain(next(r.state, { type: 'noSpeech' }));
    }
    expect(r.state.phase).toBe('paused');
    expect(r.state.pausedReason).toBe('silent');
    const resumed = next(r.state, { type: 'resume' });
    expect(resumed.effects).toEqual([{ type: 'speak', utterance: expect.objectContaining({ text: opening }) }]);
  });

  it('an empty transcript counts as silence, not a turn', () => {
    const r = hear(started(), '   ');
    expect(r.state.turns).toBe(0);
    expect(genOf(r)).toBeUndefined();
  });
});

describe('typing', () => {
  it('falls back to typing when the mic fails, and types a turn', () => {
    let r = next(started().state, { type: 'micUnavailable' });
    expect(r.state.phase).toBe('typing');
    r = next(r.state, { type: 'typed', text: 'Ciao' });
    expect(r.state.turns).toBe(1);
  });

  it('never opens the mic in typing mode', () => {
    const r = started({ typing: true });
    expect(r.state.phase).toBe('typing');
    expect(r.effects.some((e) => e.type === 'listen')).toBe(false);
  });

  it('ignores a late transcript once typing has taken over', () => {
    const r = started({ typing: true });
    expect(next(r.state, { type: 'heard', alternatives: ['Ciao'] }).state).toBe(r.state);
  });
});

describe('the end of a conversation', () => {
  it('closes after the last turn, with a completed summary', () => {
    let r = started();
    for (let n = 0; n < MAX_TURNS - 1; n++) r = fullTurn(r, `Turno ${n}`);
    expect(r.state.phase).toBe('listening');
    r = drain(done(delta(hear(r, 'Ultimo'), 'Va bene.')));
    expect(r.state.phase).toBe('done');
    expect(r.effects.at(-1)).toEqual({ type: 'finish', summary: { weekN: 1, turns: MAX_TURNS, completed: true } });
  });

  it('gets a usable conversation for every week of the course', () => {
    for (const w of PHASES.flatMap((p) => p.weeks)) {
      const r = next(drain(next(createConversa(w), { type: 'start' })).state, { type: 'heard', alternatives: ['Ciao'] });
      expect(genOf(r).system.length, `week ${w.n}`).toBeGreaterThan(100);
    }
  });
});
