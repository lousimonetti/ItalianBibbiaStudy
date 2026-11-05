import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

// Models Chrome: one active recognition per page, and stop() on an instance that
// never started is a silent no-op with no onend. Speech is driven by hand, so a test
// can assert that the mic never opens while the tutor is still talking.
let activeRec = null;
let recs = [];
let startThrows = 0;

class FakeRecognition {
  constructor() { this.started = false; recs.push(this); }
  start() {
    if (startThrows > 0) { startThrows -= 1; throw new Error('busy'); }
    if (activeRec && activeRec !== this) throw new Error('already started');
    if (speaking.length) throw new Error('mic opened while the tutor was speaking');
    this.started = true;
    activeRec = this;
  }
  stop() { if (this.started) this.end(); }
  abort() { if (this.started) this.end(); }
  end() {
    this.started = false;
    if (activeRec === this) activeRec = null;
    this.onend?.();
  }
}

let speaking = [];
const spokenLog = [];

class FakeUtterance { constructor(text) { this.text = text; } }

function finishSpeech() {
  const u = speaking.shift();
  spokenLog.push(u);
  u.onend?.();
}

async function flush() {
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
}

// Lets the tutor finish talking, up to the point where it opens the mic or stops.
async function speakAll() {
  let guard = 0;
  while (speaking.length && guard++ < 100) {
    await act(async () => { finishSpeech(); });
    await flush();
  }
}

async function say(...alternatives) {
  const rec = activeRec;
  const results = [Object.assign(alternatives.map((transcript) => ({ transcript })), {})];
  await act(async () => { rec.onresult?.({ results }); });
  await flush();
}

window.SpeechRecognition = FakeRecognition;
window.SpeechSynthesisUtterance = FakeUtterance;
globalThis.SpeechSynthesisUtterance = FakeUtterance;
window.speechSynthesis = {
  speak: (u) => speaking.push(u),
  cancel: () => { speaking = []; },
  getVoices: () => [],
};

const { VoiceTutor } = await import('./VoiceTutor.jsx');

const week = {
  n: 1,
  vocab: [['il Verbo', 'the Word', 'In principio era il Verbo.']],
  passage: {
    ref: 'Giovanni 1,1',
    verses: [{ n: 1, t: 'In principio era il Verbo.', en: 'In the beginning was the Word.' }],
  },
  questions: [{ q: 'Che cosa era in principio?', answers: ['il Verbo'], model: 'In principio era il Verbo.' }],
};

const start = () => fireEvent.click(screen.getByRole('button', { name: 'Start lesson' }));
const button = (name) => screen.getByRole('button', { name });

beforeEach(() => {
  localStorage.clear();
  activeRec = null;
  recs = [];
  speaking = [];
  spokenLog.length = 0;
  startThrows = 0;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('VoiceTutor', () => {
  it('renders nothing for a week with no reading', () => {
    const { container } = render(<VoiceTutor week={{ n: 2, vocab: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('speaks from the Start tap, and does not touch the mic before that', () => {
    render(<VoiceTutor week={week} />);
    expect(recs.length).toBe(0);
    start();
    expect(speaking.length).toBe(1);
    expect(recs.length).toBe(0);
  });

  it('opens the mic only after the speech has ended', async () => {
    render(<VoiceTutor week={week} />);
    start();
    await speakAll();
    expect(activeRec).not.toBeNull();
    expect(activeRec.started).toBe(true);
    expect(screen.getByText(/Your turn, speak now/)).toBeTruthy();
  });

  it('runs a whole lesson and records the result', async () => {
    render(<VoiceTutor week={week} />);
    start();
    await speakAll();
    await say('In principio era il Verbo');   // repeat
    await speakAll();
    await say('il Verbo');                    // question
    await speakAll();
    await say('Verbo');                       // recall
    await speakAll();
    expect(screen.getByRole('status').textContent).toMatch(/3 of 3 correct \(100%\)/);
    const store = JSON.parse(localStorage.getItem('italian-bible-tutor'));
    expect(store.weeks[1].best).toBe(100);
    expect(activeRec).toBeNull();
  });

  it('sends a missed verse to verse review and shows it', async () => {
    render(<VoiceTutor week={week} />);
    start();
    await speakAll();
    for (let n = 0; n < 3; n++) {
      await say('la casa grande');
      await speakAll();
    }
    for (const word of ['era', 'principio', 'verbo']) { // the focus step, most missed first
      await say(word);
      await speakAll();
    }
    await say('il Verbo');
    await speakAll();
    await say('Verbo');
    await speakAll();
    expect(screen.getByRole('status').textContent).toMatch(/Giovanni 1,1 will come back/);
    expect(JSON.parse(localStorage.getItem('italian-bible-verse-srs'))['Giovanni 1,1'].lapses).toBe(1);
  });

  it('recovers when the mic start throws once', async () => {
    startThrows = 1;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<VoiceTutor week={week} />);
    start();
    await speakAll();
    expect(activeRec).toBeNull();
    await act(async () => { vi.advanceTimersByTime(350); });
    expect(activeRec?.started).toBe(true);
  });

  it('falls back to typing when the mic keeps failing', async () => {
    startThrows = 5;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<VoiceTutor week={week} />);
    start();
    await speakAll();
    await act(async () => { vi.advanceTimersByTime(350); });
    await flush();
    expect(screen.getByLabelText('Your answer')).toBeTruthy();
    expect(activeRec).toBeNull();
  });

  it('falls back to typing when permission is denied', async () => {
    render(<VoiceTutor week={week} />);
    start();
    await speakAll();
    const rec = activeRec;
    await act(async () => { rec.onerror?.({ error: 'not-allowed' }); });
    await flush();
    expect(screen.getByLabelText('Your answer')).toBeTruthy();
  });

  it('continues past a speech utterance whose onend never fires', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<VoiceTutor week={week} />);
    start();
    const first = speaking[0];
    first.onend = first.onend && null;
    speaking = [];
    await act(async () => { vi.advanceTimersByTime(60000); });
    await flush();
    expect(speaking.length).toBe(1);
    expect(speaking[0]).not.toBe(first);
  });

  it('drops a late transcript after the learner has moved on', async () => {
    render(<VoiceTutor week={week} />);
    start();
    await speakAll();
    const rec = activeRec;
    const onresult = rec.onresult;
    fireEvent.click(button('Skip'));
    await flush();
    await act(async () => { onresult?.({ results: [[{ transcript: 'In principio era il Verbo' }]] }); });
    await flush();
    expect(screen.queryByText(/Heard:/)).toBeNull();
  });

  it('releases the mic and speech on unmount', async () => {
    const { unmount } = render(<VoiceTutor week={week} />);
    start();
    await speakAll();
    expect(activeRec).not.toBeNull();
    unmount();
    expect(activeRec).toBeNull();
    expect(speaking.length).toBe(0);
  });

  it('pauses when the page is hidden, and resumes on the same step', async () => {
    render(<VoiceTutor week={week} />);
    start();
    await speakAll();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    hidden.mockRestore();
    expect(activeRec).toBeNull();
    expect(screen.getByText('Paused')).toBeTruthy();
    fireEvent.click(button('Resume'));
    await flush();
    expect(activeRec?.started).toBe(true);
  });

  it('a stopped lesson can be resumed the same day', async () => {
    render(<VoiceTutor week={week} />);
    start();
    await speakAll();
    fireEvent.click(button('Stop'));
    await flush();
    expect(button('Resume lesson')).toBeTruthy();
    expect(button('Start over')).toBeTruthy();
  });

  describe('interactive lessons', () => {
    const lines = ['Il primo versetto qui.', 'Il secondo versetto qui.', 'Il terzo versetto qui.'];
    const longWeek = {
      n: 3,
      vocab: [],
      passage: { ref: 'Giovanni 1,1-3', verses: lines.map((t, i) => ({ n: i + 1, t, en: `English ${i}` })) },
    };

    it('fades the line after two clean repeats, keeps it out of the caption, and can show it', async () => {
      render(<VoiceTutor week={longWeek} />);
      start();
      await speakAll();
      await say(lines[0]);
      await speakAll();
      await say(lines[1]);
      // Mid-speech on the third line: praise first, then the line itself.
      while (speaking.length && speaking[0].text !== lines[2]) {
        await act(async () => { finishSpeech(); });
        await flush();
      }
      expect(speaking[0].text).toBe(lines[2]);
      expect(screen.queryByText(lines[2])).toBeNull();
      expect(document.querySelector('.tutor-caption')).toBeNull();
      expect(document.querySelector('.tutor-faded .tutor-blank')).not.toBeNull();
      fireEvent.click(button('Show text'));
      expect(screen.queryByRole('button', { name: 'Show text' })).toBeNull();
      expect(document.querySelector('.tutor-faded')).toBeNull();
    });

    it('answers a spoken word question and returns to the same step', async () => {
      render(<VoiceTutor week={week} />);
      start();
      await speakAll();
      await say('In principio era il Verbo');
      await speakAll();
      await say('che vuol dire principio?');
      expect(document.querySelector('.tutor-glossed').textContent).toMatch(/principio/);
      await speakAll();
      expect(screen.getByText('Answer aloud')).toBeTruthy();
      expect(activeRec?.started).toBe(true);
    });

    it('shows a hint after a wrong answer', async () => {
      render(<VoiceTutor week={week} />);
      start();
      await speakAll();
      await say('In principio era il Verbo');
      await speakAll();
      await say('non lo so');
      expect(document.querySelector('.tutor-hint-line').textContent).toMatch(/In principio era il Verbo/);
    });
  });

  describe('local AI', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('shows no Conversa, and never contacts this computer, until someone opts in', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      render(<VoiceTutor week={week} />);
      await flush();
      expect(screen.queryByRole('button', { name: 'Conversa' })).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('opening the setup panel still contacts nothing, until Check connection', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      render(<VoiceTutor week={week} />);
      fireEvent.click(button('Talk freely with a local AI model (optional)'));
      await flush();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(screen.getByText(/ollama pull gemma4:12b-mlx/)).toBeTruthy();
    });

    it('offers no setup on the compact Today card', () => {
      render(<VoiceTutor week={week} compact />);
      expect(screen.queryByRole('button', { name: /local AI/ })).toBeNull();
    });

    it('offers Conversa once opted in and the model is there', async () => {
      localStorage.setItem('coursekit-tutor-ai', JSON.stringify({ enabled: true, model: 'gemma4:12b-mlx' }));
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ models: [{ name: 'gemma4:12b-mlx' }] }) })));
      render(<VoiceTutor week={week} />);
      await flush();
      expect(button('Conversa')).toBeTruthy();
    });

    it('hides Conversa when the chosen model has gone', async () => {
      localStorage.setItem('coursekit-tutor-ai', JSON.stringify({ enabled: true, model: 'gemma4:12b-mlx' }));
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ models: [{ name: 'other' }] }) })));
      render(<VoiceTutor week={week} />);
      await flush();
      expect(screen.queryByRole('button', { name: 'Conversa' })).toBeNull();
    });

    it('hides Conversa when Ollama is off, and the lesson still works', async () => {
      localStorage.setItem('coursekit-tutor-ai', JSON.stringify({ enabled: true, model: 'gemma4:12b-mlx' }));
      vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
      render(<VoiceTutor week={week} />);
      await flush();
      expect(screen.queryByRole('button', { name: 'Conversa' })).toBeNull();
      start();
      await speakAll();
      expect(activeRec?.started).toBe(true);
    });

    it('a lesson grades the same with AI turned on as off', async () => {
      async function runLesson() {
        render(<VoiceTutor week={week} />);
        await flush();
        start();
        await speakAll();
        await say('In principio era il Verbo');
        await speakAll();
        await say('non lo so');
        await speakAll();
        await say('il Verbo');
        await speakAll();
        await say('Verbo');
        await speakAll();
        const result = screen.getByRole('status').textContent;
        cleanup();
        return result;
      }
      const off = await runLesson();
      localStorage.clear();
      localStorage.setItem('coursekit-tutor-ai', JSON.stringify({ enabled: true, model: 'gemma4:12b-mlx' }));
      const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ models: [{ name: 'gemma4:12b-mlx' }] }) }));
      vi.stubGlobal('fetch', fetchSpy);
      const on = await runLesson();
      expect(on).toBe(off);
      for (const [url] of fetchSpy.mock.calls) expect(String(url)).toMatch(/\/api\/tags$/);
    });
  });

  it('starting a second lesson stops the first', async () => {
    render(<><VoiceTutor week={week} /><VoiceTutor week={week} /></>);
    fireEvent.click(screen.getAllByRole('button', { name: 'Start lesson' })[0]);
    await speakAll();
    expect(activeRec).not.toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: /Start/ })[0]);
    await flush();
    expect(screen.getAllByRole('region', { name: 'Voice lesson' }).length).toBe(1);
  });
});
