import { describe, it, expect, beforeEach } from 'vitest';
import { loadTutor, saveResume, resumeFor, clearResume, recordLesson } from './tutorStore';

const TODAY = new Date(2026, 10, 5, 12);
const TOMORROW = new Date(2026, 10, 6, 12);

beforeEach(() => localStorage.clear());

describe('tutorStore', () => {
  it('resumes the same week on the same day only', () => {
    saveResume(3, { i: 4 }, TODAY);
    expect(resumeFor(3, TODAY)).toEqual({ i: 4 });
    expect(resumeFor(4, TODAY)).toBeNull();
    expect(resumeFor(3, TOMORROW)).toBeNull();
  });

  it('clears a resume point', () => {
    saveResume(3, { i: 4 }, TODAY);
    clearResume();
    expect(resumeFor(3, TODAY)).toBeNull();
  });

  it('tracks lessons done and keeps the best score', () => {
    recordLesson({ weekN: 2, score: 80 }, TODAY);
    recordLesson({ weekN: 2, score: 60 }, TOMORROW);
    expect(loadTutor().weeks[2]).toEqual({ done: 2, best: 80, last: '2026-11-06' });
  });

  it('finishing a lesson drops its resume point', () => {
    saveResume(2, { i: 4 }, TODAY);
    recordLesson({ weekN: 2, score: 80 }, TODAY);
    expect(loadTutor().resume).toBeNull();
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('italian-bible-tutor', '{nope');
    expect(loadTutor()).toEqual({ weeks: {}, resume: null });
  });
});
