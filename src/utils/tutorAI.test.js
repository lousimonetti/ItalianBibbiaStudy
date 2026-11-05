import { describe, it, expect, beforeEach } from 'vitest';
import { forgetTutorAI, loadTutorAI, localSpeechAvailable, originCommand, saveTutorAI } from './tutorAI';
import { exportSnapshot } from './syncSnapshot';

beforeEach(() => localStorage.clear());

describe('settings', () => {
  it('is off until someone opts in', () => {
    expect(loadTutorAI()).toEqual({ enabled: false, model: '' });
  });

  it('remembers the choice', () => {
    saveTutorAI({ enabled: true, model: 'gemma4:12b-mlx' });
    expect(loadTutorAI()).toEqual({ enabled: true, model: 'gemma4:12b-mlx' });
  });

  it('can be forgotten', () => {
    saveTutorAI({ enabled: true, model: 'x' });
    forgetTutorAI();
    expect(loadTutorAI().enabled).toBe(false);
  });

  it('survives unreadable or wrongly shaped data', () => {
    localStorage.setItem('coursekit-tutor-ai', '{broken');
    expect(loadTutorAI()).toEqual({ enabled: false, model: '' });
    localStorage.setItem('coursekit-tutor-ai', '{"enabled":"yes","model":7}');
    expect(loadTutorAI()).toEqual({ enabled: false, model: '' });
  });

  it('stays out of sync backups, since it describes this computer', () => {
    saveTutorAI({ enabled: true, model: 'gemma4:12b-mlx' });
    const snapshot = exportSnapshot();
    expect(JSON.stringify(snapshot)).not.toContain('gemma4');
    expect(JSON.stringify(snapshot)).not.toContain('tutor-ai');
  });
});

describe('originCommand', () => {
  it('needs nothing on localhost, which Ollama already allows', () => {
    expect(originCommand('http://localhost:5173')).toBeNull();
    expect(originCommand('http://localhost:4173')).toBeNull();
    expect(originCommand('http://127.0.0.1:5173')).toBeNull();
  });

  it('names exactly this site, never a wildcard', () => {
    const command = originCommand('https://study.louissimonetti.com');
    expect(command).toBe('launchctl setenv OLLAMA_ORIGINS "https://study.louissimonetti.com"');
    expect(command).not.toContain('*');
  });

  it('does not treat a lookalike host as local', () => {
    expect(originCommand('https://localhost.example.com')).not.toBeNull();
  });
});

describe('localSpeechAvailable', () => {
  const withResult = (result) => ({ available: async () => result });

  it('is true only when the language is already installed', async () => {
    expect(await localSpeechAvailable(withResult('available'), 'it-IT')).toBe(true);
    expect(await localSpeechAvailable(withResult('downloadable'), 'it-IT')).toBe(false);
    expect(await localSpeechAvailable(withResult('unavailable'), 'it-IT')).toBe(false);
  });

  it('asks about on-device recognition for the right language', async () => {
    let asked;
    await localSpeechAvailable({ available: async (o) => { asked = o; return 'available'; } }, 'it-IT');
    expect(asked).toEqual({ langs: ['it-IT'], processLocally: true });
  });

  it('is false in a browser without the API, or when the check throws', async () => {
    expect(await localSpeechAvailable(function Old() {}, 'it-IT')).toBe(false);
    expect(await localSpeechAvailable(undefined, 'it-IT')).toBe(false);
    expect(await localSpeechAvailable({ available: async () => { throw new Error('x'); } }, 'it-IT')).toBe(false);
  });
});
