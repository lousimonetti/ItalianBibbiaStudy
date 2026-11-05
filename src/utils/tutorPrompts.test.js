import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import {
  conversaOpening, conversaPrompt, conversaSystem, explainPrompt, missContext, passageText, translatePrompt, trimHistory,
  MAX_HISTORY_CHARS, MAX_PASSAGE_CHARS,
} from './tutorPrompts';

const weeks = PHASES.flatMap((p) => p.weeks);
const week = weeks[0];
// A rough ceiling: Apple's on-device context window is small and also holds the reply.
const MAX_PROMPT_CHARS = 6000;

describe('explainPrompt', () => {
  const miss = {
    expected: 'E il Verbo si fece carne', heard: 'il Verbo si fa carne', en: 'And the Word became flesh',
    question: '', grammarTitle: 'Passato remoto', grammarBody: 'A narrative tense.',
  };

  it('gives the model the facts of the miss', () => {
    const text = explainPrompt(miss).messages[0].content;
    expect(text).toContain('E il Verbo si fece carne');
    expect(text).toContain('il Verbo si fa carne');
    expect(text).toContain('And the Word became flesh');
    expect(text).toContain('Passato remoto');
  });

  it('tells the model the transcript is unreliable, and asks for no verdict or doctrine', () => {
    const { system } = explainPrompt(miss);
    expect(system).toMatch(/speech recognition/);
    expect(system).toMatch(/Do not say whether the learner passed/);
    expect(system).toMatch(/Do not interpret doctrine/);
    expect(system).toMatch(/Never quote or invent Bible verses/);
  });

  it('says so when the learner said nothing', () => {
    expect(explainPrompt({ ...miss, heard: '' }).messages[0].content).toContain('(nothing)');
  });

  it('stays within budget on the longest grammar note in the course', () => {
    const longest = weeks.reduce((a, b) => ((b.grammar?.body?.length ?? 0) > (a.grammar?.body?.length ?? 0) ? b : a));
    const { system, messages } = explainPrompt(missContext({ kind: 'repeat', text: 'x', en: 'y' }, 'z', longest));
    expect(system.length + messages[0].content.length).toBeLessThan(2000);
  });
});

describe('missContext', () => {
  it('reads the right expected text for each kind of step', () => {
    expect(missContext({ kind: 'repeat', text: 'R', en: 'E' }, 'h', week).expected).toBe('R');
    expect(missContext({ kind: 'recall', full: 'F', en: 'E' }, 'h', week).expected).toBe('F');
    const ask = missContext({ kind: 'ask', q: 'Q', model: 'M' }, 'h', week);
    expect(ask.expected).toBe('M');
    expect(ask.question).toBe('Q');
  });
});

describe('conversaSystem', () => {
  it('holds the reading, and asks for short simple Italian with no stated corrections', () => {
    const text = conversaSystem(week);
    expect(text).toContain(passageText(week).split('\n')[0]);
    expect(text).toMatch(/simple Italian/);
    expect(text).toMatch(/without pointing it out/);
    expect(text).toMatch(/speech recognition/);
  });

  it('tells the model what it opened with, since the history starts on the learner', () => {
    expect(conversaSystem(week)).toContain(`You began by asking the learner: ${conversaOpening(week)}`);
  });

  it('mentions hard words only when there are some', () => {
    expect(conversaSystem(week)).not.toMatch(/found hard/);
    expect(conversaSystem(week, { missedWords: ['tenebre'] })).toMatch(/found hard, worth using again: tenebre/);
  });

  it('stays within budget for every week, and never cuts a verse in half', () => {
    for (const w of weeks) {
      const history = [{ role: 'user', content: 'x'.repeat(MAX_HISTORY_CHARS) }];
      const { system, messages } = conversaPrompt(w, history, { missedWords: ['a', 'b', 'c'] });
      expect(system.length + messages[0].content.length, `week ${w.n}`).toBeLessThan(MAX_PROMPT_CHARS);
      const passage = passageText(w);
      expect(passage.length, `week ${w.n}`).toBeLessThanOrEqual(MAX_PASSAGE_CHARS);
      expect(passage.length, `week ${w.n}`).toBeGreaterThan(0);
    }
  });
});

describe('conversaOpening', () => {
  it('has an authored opening line for every week', () => {
    for (const w of weeks) expect(conversaOpening(w), `week ${w.n}`).toBeTruthy();
  });

  it('falls back to the writing prompt, then to nothing', () => {
    expect(conversaOpening({ prompt: { it: 'Scrivi.' } })).toBe('Scrivi.');
    expect(conversaOpening({})).toBe('');
  });
});

describe('trimHistory', () => {
  const turn = (role, n) => ({ role, content: 'x'.repeat(n) });

  it('keeps everything under budget', () => {
    const history = [turn('user', 10), turn('assistant', 10), turn('user', 10)];
    expect(trimHistory(history, 100)).toEqual(history);
  });

  it('drops the oldest turns first, and always keeps the newest', () => {
    const newest = turn('user', 50);
    expect(trimHistory([turn('user', 50), turn('assistant', 50), newest], 60)).toEqual([newest]);
    expect(trimHistory([newest], 10)).toEqual([newest]);
  });

  it('never starts on a tutor reply', () => {
    const history = [turn('user', 90), turn('assistant', 20), turn('user', 20)];
    const kept = trimHistory(history, 45);
    expect(kept[0].role).toBe('user');
    expect(kept).toHaveLength(1);
  });

  it('handles an empty history', () => {
    expect(trimHistory([])).toEqual([]);
  });
});

describe('translatePrompt', () => {
  it('passes the text through as the message', () => {
    const { system, messages } = translatePrompt('Che cosa hai letto?');
    expect(messages).toEqual([{ role: 'user', content: 'Che cosa hai letto?' }]);
    expect(system).toMatch(/into natural English/);
  });
});
