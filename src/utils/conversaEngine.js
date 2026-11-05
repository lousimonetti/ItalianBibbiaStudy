// Conversa: a free spoken conversation about a week's passage, with a local model
// supplying the tutor's replies. A pure state machine in the same style as tutorEngine:
// `next(state, event)` returns the new state plus effects for the caller to carry out.
//
// Nothing here grades. A model's words are spoken and shown, and go nowhere else: the
// summary reports only how many turns the learner took. Replies arrive as `delta` events
// and are spoken sentence by sentence, and the mic stays closed until the queue is empty.
//
// Each generation has an id, and a delta or failure carrying an older id is ignored, so a
// stream that was cancelled can never drive the next turn.

import { conversaOpening, conversaPrompt } from './tutorPrompts';
import { flushBuffer, pushDelta } from './sentenceStream';
import { glossWord, parseCommand, parseWordQuestion, SILENT_LIMIT } from './tutorEngine';
import { TUTOR_LINES as L } from '../data/tutorScript';

export const MAX_TURNS = 10;
export const STREAK_TURNS = 3; // turns before a conversation counts as practice today

const say = (line) => ({ text: line.it, en: line.en, rate: 'normal' });
const CHANGE_TOPIC = 'Possiamo parlare di altro?';

export function createConversa(week, { typing = false, missedWords = [] } = {}) {
  return {
    week,
    missedWords,
    phase: 'idle',
    queue: [],
    history: [],
    turns: 0,
    genId: 0,
    generating: false,
    regenerate: false,
    buffer: '',
    reply: [],
    lastReply: [],
    slow: false,
    typing,
    silentStreak: 0,
    pausedReason: null,
    failure: null,
    closing: false,
    glossed: null,
  };
}

const summary = (state, completed) => ({ weekN: state.week.n, turns: state.turns, completed });

function run(state, extra = []) {
  if (state.queue.length) {
    return { state: { ...state, phase: 'speaking' }, effects: [...extra, { type: 'speak', utterance: state.queue[0] }] };
  }
  if (state.generating) return { state: { ...state, phase: 'thinking' }, effects: extra };
  if (state.failure) return { state: { ...state, phase: 'failed' }, effects: extra };
  if (state.closing) {
    return { state: { ...state, phase: 'done' }, effects: [...extra, { type: 'finish', summary: summary(state, true) }] };
  }
  if (state.typing) return { state: { ...state, phase: 'typing' }, effects: extra };
  return { state: { ...state, phase: 'listening' }, effects: [...extra, { type: 'listen' }] };
}

function generate(state, extra = []) {
  const genId = state.genId + 1;
  const { system, messages } = conversaPrompt(state.week, state.history, { missedWords: state.missedWords });
  return {
    state: {
      ...state, phase: 'thinking', queue: [], genId, generating: true, regenerate: false, buffer: '', reply: [], failure: null,
    },
    effects: [...extra, { type: 'generate', id: genId, system, messages }],
  };
}

const spoken = (state, text) => ({ text, en: '', rate: state.slow ? 'slow' : 'normal' });

function addTurn(state, text) {
  return generate({
    ...state,
    turns: state.turns + 1,
    silentStreak: 0,
    glossed: null,
    history: [...state.history, { role: 'user', content: text }],
  });
}

function onCommand(state, command) {
  const stopAll = [{ type: 'cancel' }];
  switch (command) {
    case 'repeat':
    case 'slower': {
      const s = command === 'slower' ? { ...state, slow: true } : state;
      if (s.generating) return { state: s, effects: [] };
      return run({ ...s, silentStreak: 0, queue: s.lastReply.map((t) => spoken(s, t)) }, stopAll);
    }
    case 'skip':
      if (state.generating || state.closing) return { state, effects: [] };
      return generate({ ...state, silentStreak: 0, history: [...state.history, { role: 'user', content: CHANGE_TOPIC }] }, stopAll);
    case 'stop':
      return {
        state: { ...state, phase: 'done', queue: [], generating: false },
        effects: [...stopAll, { type: 'finish', summary: summary(state, false) }],
      };
    default:
      return { state, effects: [] };
  }
}

function onLearner(state, text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return onSilence(state);
  // The glossary answers these directly, faster and more reliably than a model would.
  const asked = parseWordQuestion(trimmed);
  if (asked) {
    const en = glossWord(asked);
    return run({
      ...state,
      silentStreak: 0,
      glossed: en ? { word: asked, en } : null,
      queue: [en ? { text: asked, en, rate: 'slow' } : say(L.unknownWord)],
    });
  }
  const command = parseCommand(trimmed);
  if (command) return onCommand(state, command);
  return addTurn(state, trimmed);
}

function onSilence(state) {
  const silentStreak = state.silentStreak + 1;
  if (silentStreak >= SILENT_LIMIT) {
    return {
      state: { ...state, silentStreak, phase: 'paused', pausedReason: 'silent', queue: state.lastReply.map((t) => spoken(state, t)) },
      effects: [{ type: 'cancel' }],
    };
  }
  return run({ ...state, silentStreak, queue: [say(L.notHeard)] });
}

function onDelta(state, event) {
  if (event.id !== state.genId || !state.generating) return { state, effects: [] };
  const { sentences, buffer } = pushDelta(state.buffer, event.text);
  const next = {
    ...state,
    buffer,
    reply: [...state.reply, ...sentences],
    queue: [...state.queue, ...sentences.map((t) => spoken(state, t))],
  };
  return state.phase === 'thinking' && next.queue.length ? run(next) : { state: next, effects: [] };
}

function onFailed(state, reason) {
  const line = reason === 'refused' ? L.conversaRefused : L.conversaFailed;
  return run({
    ...state,
    generating: false,
    buffer: '',
    reply: [],
    failure: reason,
    queue: [say(line)],
  }, [{ type: 'cancel' }]);
}

function onGenerated(state, event) {
  if (event.id !== state.genId || !state.generating) return { state, effects: [] };
  const tail = flushBuffer(state.buffer);
  const reply = [...state.reply, ...tail];
  if (!reply.length) return onFailed(state, 'empty');
  const closing = state.turns >= MAX_TURNS;
  const next = {
    ...state,
    generating: false,
    buffer: '',
    reply: [],
    lastReply: reply,
    closing,
    history: [...state.history, { role: 'assistant', content: reply.join(' ') }],
    queue: [...state.queue, ...tail.map((t) => spoken(state, t)), ...(closing ? [say(L.conversaClosing)] : [])],
  };
  return state.phase === 'thinking' ? run(next) : { state: next, effects: [] };
}

export function next(state, event) {
  const nothing = { state, effects: [] };
  if (state.phase === 'done') return nothing;

  switch (event.type) {
    case 'start': {
      if (state.phase !== 'idle') return nothing;
      const opening = conversaOpening(state.week);
      if (!opening) return { state: { ...state, phase: 'done' }, effects: [{ type: 'finish', summary: summary(state, false) }] };
      return run({
        ...state,
        history: [{ role: 'assistant', content: opening }],
        lastReply: [opening],
        queue: [spoken(state, opening)],
      });
    }

    case 'spoken':
      if (state.phase !== 'speaking') return nothing;
      return run({ ...state, queue: state.queue.slice(1) });

    case 'heard':
      if (state.phase !== 'listening') return nothing;
      return onLearner(state, event.alternatives?.[0]);

    case 'typed':
      if (state.phase !== 'typing') return nothing;
      return onLearner(state, event.text);

    case 'noSpeech':
      return state.phase === 'listening' ? onSilence(state) : nothing;

    case 'micUnavailable': {
      const s = { ...state, typing: true };
      return { state: state.phase === 'listening' ? { ...s, phase: 'typing' } : s, effects: [] };
    }

    case 'setTyping': {
      const s = { ...state, typing: event.on };
      if (event.on && state.phase === 'listening') return { state: { ...s, phase: 'typing' }, effects: [{ type: 'cancel' }] };
      if (!event.on && state.phase === 'typing') return run(s);
      return { state: s, effects: [] };
    }

    case 'delta':
      return onDelta(state, event);

    case 'generated':
      return onGenerated(state, event);

    case 'failed':
      if (event.id !== state.genId || !state.generating) return nothing;
      return onFailed(state, event.reason ?? 'error');

    // After a failure: send the same turn again.
    case 'retry':
      return state.phase === 'failed' ? generate({ ...state, failure: null }) : nothing;

    // After a failure: drop the turn the model couldn't answer, and let the learner try
    // something else. It wasn't answered, so it doesn't count as a turn taken.
    case 'rephrase': {
      if (state.phase !== 'failed') return nothing;
      const last = state.history.at(-1);
      const history = last?.role === 'user' ? state.history.slice(0, -1) : state.history;
      const counted = last?.role === 'user' && last.content !== CHANGE_TOPIC;
      return run({ ...state, failure: null, history, turns: counted ? state.turns - 1 : state.turns });
    }

    case 'command':
      if (state.phase === 'idle' || state.phase === 'paused' || state.phase === 'failed') {
        return event.command === 'stop' ? onCommand(state, 'stop') : nothing;
      }
      return onCommand(state, event.command);

    case 'pause': {
      if (!['speaking', 'listening', 'typing', 'thinking'].includes(state.phase)) return nothing;
      // A half-finished reply can't be picked up again, so abandon it and ask afresh.
      const interrupted = state.generating;
      return {
        state: {
          ...state,
          phase: 'paused',
          pausedReason: event.reason ?? 'manual',
          generating: false,
          regenerate: interrupted,
          genId: interrupted ? state.genId + 1 : state.genId,
          queue: interrupted ? [] : state.queue,
          buffer: interrupted ? '' : state.buffer,
          reply: interrupted ? [] : state.reply,
        },
        effects: [{ type: 'cancel' }],
      };
    }

    case 'resume': {
      if (state.phase !== 'paused') return nothing;
      const s = { ...state, pausedReason: null, silentStreak: 0 };
      return s.regenerate ? generate(s) : run(s);
    }

    default:
      return nothing;
  }
}
