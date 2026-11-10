import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

// A fake recognizer and synthesizer modelled on Chrome, and a fake Ollama whose replies
// a test feeds in by hand, so it can act at any moment during a stream.
let activeRec = null;
let recs = [];
let speaking = [];

class FakeRecognition {
  constructor() { this.started = false; recs.push(this); }
  start() {
    if (speaking.length) throw new Error('mic opened while the tutor was speaking');
    this.started = true;
    activeRec = this;
  }
  stop() { if (this.started) this.end(); }
  abort() { if (this.started) this.end(); }
  end() { this.started = false; if (activeRec === this) activeRec = null; this.onend?.(); }
}
class FakeUtterance { constructor(text) { this.text = text; } }

window.SpeechRecognition = FakeRecognition;
window.SpeechSynthesisUtterance = FakeUtterance;
globalThis.SpeechSynthesisUtterance = FakeUtterance;
window.speechSynthesis = { speak: (u) => speaking.push(u), cancel: () => { speaking = []; }, getVoices: () => [] };

const encoder = new TextEncoder();
let chats = [];

function fakeOllama(url, init) {
  if (String(url).endsWith('/api/tags')) {
    return Promise.resolve({ ok: true, json: async () => ({ models: [{ name: 'gemma4:12b-mlx' }] }) });
  }
  const body = JSON.parse(init.body);
  // Warm-up asks for one token and is answered at once, so tests see only real turns.
  if (body.options.num_predict === 1) {
    return Promise.resolve({ ok: true, status: 200, body: { getReader: () => ({ read: async () => ({ done: true }) }) } });
  }
  const pending = [];
  let waiter = null;
  const chat = {
    body,
    aborted: false,
    send(text) { push({ done: false, value: encoder.encode(`${JSON.stringify({ message: { content: text } })}\n`) }); },
    end() { push({ done: true }); },
    fail(e) { push({ error: e }); },
  };
  function push(item) { if (waiter) { const w = waiter; waiter = null; w(item); } else pending.push(item); }
  chats.push(chat);
  init.signal.addEventListener('abort', () => { chat.aborted = true; chat.fail(Object.assign(new Error('aborted'), { name: 'AbortError' })); });
  return Promise.resolve({
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: () => new Promise((resolve, reject) => {
          const take = (item) => (item.error ? reject(item.error) : resolve(item));
          if (pending.length) take(pending.shift());
          else waiter = take;
        }),
      }),
    },
  });
}

const { Conversa } = await import('./Conversa.jsx');

const week = {
  n: 1,
  vocab: [['il Verbo', 'the Word', 'In principio era il Verbo.']],
  grammar: { title: 'Articoli', body: 'x' },
  passage: { ref: 'Giovanni 1,1', verses: [{ n: 1, t: 'In principio era il Verbo.', en: 'In the beginning was the Word.' }] },
  questions: [{ q: 'Che cosa era in principio?', answers: ['il Verbo'], model: 'In principio era il Verbo.' }],
};

async function flush() {
  await act(async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); });
}
async function speakAll() {
  let guard = 0;
  while (speaking.length && guard++ < 50) {
    await act(async () => { speaking.shift().onend?.(); });
    await flush();
  }
}
async function say(text) {
  const rec = activeRec;
  await act(async () => { rec.onresult?.({ results: [[{ transcript: text }]] }); });
  await flush();
}
async function open(props = {}) {
  const onClose = props.onClose ?? vi.fn();
  render(<Conversa week={week} model="gemma4:12b-mlx" onClose={onClose} {...props} />);
  await flush();
  await speakAll();
  return onClose;
}
const reply = async (chat, text) => {
  await act(async () => { chat.send(text); });
  await flush();
};
const finish = async (chat) => {
  await act(async () => { chat.end(); });
  await flush();
};
const button = (name) => screen.getByRole('button', { name });

beforeEach(() => {
  localStorage.clear();
  activeRec = null;
  recs = [];
  speaking = [];
  chats = [];
  vi.stubGlobal('fetch', vi.fn(fakeOllama));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Conversa', () => {
  it('opens with the authored line, then listens', async () => {
    await open();
    expect(screen.getByText(/Your turn, speak now/)).toBeTruthy();
    expect(activeRec?.started).toBe(true);
    expect(chats.length).toBe(0);
  });

  // The app runs under StrictMode, which mounts components twice in development. An
  // earlier version stalled there: the opening line was cancelled and never restarted.
  it('opens and listens under StrictMode too', async () => {
    render(<StrictMode><Conversa week={week} model="gemma4:12b-mlx" onClose={() => {}} /></StrictMode>);
    await flush();
    expect(speaking.length).toBe(1);
    await speakAll();
    expect(activeRec?.started).toBe(true);
    expect(screen.getByText(/Your turn, speak now/)).toBeTruthy();
    await say('Ciao');
    expect(chats.length).toBe(1);
  });

  it('only ever calls this computer', async () => {
    await open();
    await say('La luce è bella.');
    for (const [url] of fetch.mock.calls) expect(String(url).startsWith('http://localhost:11434/')).toBe(true);
  });

  it('speaks a reply as it streams, with the mic shut until it has finished', async () => {
    await open();
    await say('La luce è bella.');
    expect(screen.getByText('Thinking…')).toBeTruthy();
    await reply(chats[0], 'Sì, è vero. ');
    expect(speaking.map((u) => u.text)).toEqual(['Sì, è vero.']);
    await speakAll();
    expect(activeRec).toBeNull();
    await reply(chats[0], 'Che cosa pensi?');
    await finish(chats[0]);
    expect(activeRec).toBeNull();
    await speakAll();
    expect(activeRec?.started).toBe(true);
  });

  it('sends the conversation so far on the next turn', async () => {
    await open();
    await say('Primo turno.');
    await reply(chats[0], 'Bene. Dimmi.');
    await finish(chats[0]);
    await speakAll();
    await say('Secondo turno.');
    const contents = chats[1].body.messages.map((m) => m.content);
    expect(contents.at(-1)).toBe('Secondo turno.');
    expect(contents).toContain('Primo turno.');
    expect(contents).toContain('Bene. Dimmi.');
  });

  it('keeps the words tappable in a finished reply, and shows markdown-free text', async () => {
    await open();
    await say('Ciao');
    await reply(chats[0], '**Bene** davvero.');
    await finish(chats[0]);
    await speakAll();
    expect(document.querySelector('.conversa-log').textContent).toContain('Bene davvero.');
    expect(document.querySelector('.conversa-log').textContent).not.toContain('*');
    expect(document.querySelector('.conversa-log .gloss-word, .conversa-log .gloss-word-plain')).not.toBeNull();
  });

  it('renders a reply as text, never as HTML', async () => {
    await open();
    await say('Ciao');
    await reply(chats[0], '<img src=x onerror=alert(1)> Bene.');
    await finish(chats[0]);
    await speakAll();
    expect(document.querySelector('.conversa-log img')).toBeNull();
  });

  it('stopping mid-reply aborts the stream and stops the speech', async () => {
    await open();
    await say('Ciao');
    await reply(chats[0], 'Uno. Due. ');
    fireEvent.click(button('Stop'));
    await flush();
    expect(chats[0].aborted).toBe(true);
    expect(speaking.length).toBe(0);
    expect(screen.getByRole('status').textContent).toMatch(/you took 1 turn/);
  });

  it('a stream cancelled mid-reply cannot drive the next turn', async () => {
    await open();
    await say('Ciao');
    const first = chats[0];
    fireEvent.click(button('Pause'));
    await flush();
    expect(first.aborted).toBe(true);
    fireEvent.click(button('Resume'));
    await flush();
    expect(chats.length).toBe(2);
    await reply(chats[1], 'Nuova risposta. ');
    expect(speaking.map((u) => u.text)).toEqual(['Nuova risposta.']);
    expect(document.querySelector('.conversa-log').textContent).not.toContain('Vecchia');
  });

  it('releases the mic and aborts the stream on unmount', async () => {
    const { unmount } = render(<Conversa week={week} model="m" onClose={() => {}} />);
    await flush();
    await speakAll();
    await say('Ciao');
    unmount();
    expect(chats[0].aborted).toBe(true);
    expect(speaking.length).toBe(0);
    expect(activeRec).toBeNull();
  });

  it('explains a connection failure and offers a way forward', async () => {
    await open();
    fetch.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')));
    await say('Ciao');
    await speakAll();
    expect(screen.getByRole('alert').textContent).toMatch(/Couldn't reach Ollama/);
    expect(button('Try again')).toBeTruthy();
    expect(button('Say something else')).toBeTruthy();
    expect(activeRec).toBeNull();
  });

  it('recovers with Try again', async () => {
    await open();
    fetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')));
    await say('Ciao');
    await speakAll();
    fireEvent.click(button('Try again'));
    await flush();
    await reply(chats[0], 'Eccomi.');
    await finish(chats[0]);
    await speakAll();
    expect(activeRec?.started).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('recovers with Say something else', async () => {
    await open();
    fetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')));
    await say('Ciao');
    await speakAll();
    fireEvent.click(button('Say something else'));
    await flush();
    expect(activeRec?.started).toBe(true);
  });

  it('fetches a translation only when asked', async () => {
    await open();
    await say('Ciao');
    await reply(chats[0], 'Va bene.');
    await finish(chats[0]);
    await speakAll();
    const count = chats.length;
    expect(count).toBe(1);
    fireEvent.click(screen.getAllByRole('button', { name: 'In English' })[0]);
    await flush();
    expect(chats.length).toBe(2);
    await reply(chats[1], 'What was in the beginning?');
    expect(document.querySelector('.conversa-en').textContent).toBe('What was in the beginning?');
  });

  it('answers a word question without calling the model', async () => {
    await open();
    await say('che vuol dire principio?');
    expect(chats.length).toBe(0);
    expect(document.querySelector('.tutor-glossed').textContent).toMatch(/principio/);
  });

  describe('what it writes', () => {
    const talk = async (n) => {
      for (let i = 0; i < n; i++) {
        await say(`Turno ${i}`);
        await reply(chats[i], 'Bene.');
        await finish(chats[i]);
        await speakAll();
      }
    };

    it('writes no review, score or lesson record, whatever the model says', async () => {
      await open();
      await say('Ciao');
      await reply(chats[0], 'Risposta sbagliata, hai fallito.');
      await finish(chats[0]);
      await speakAll();
      fireEvent.click(button('Stop'));
      await flush();
      expect(localStorage.getItem('italian-bible-srs')).toBeNull();
      expect(localStorage.getItem('italian-bible-verse-srs')).toBeNull();
      expect(localStorage.getItem('italian-bible-tutor')).toBeNull();
    });

    it('saves no part of the conversation', async () => {
      await open();
      await say('Una frase unica da cercare.');
      await reply(chats[0], 'Una risposta unica.');
      await finish(chats[0]);
      await speakAll();
      fireEvent.click(button('Stop'));
      await flush();
      const everything = Object.keys(localStorage).map((k) => localStorage.getItem(k)).join(' ');
      expect(everything).not.toContain('frase unica');
      expect(everything).not.toContain('risposta unica');
    });

    it('counts as practice after a few turns, but not after one', async () => {
      await open();
      await talk(1);
      fireEvent.click(button('Stop'));
      await flush();
      expect(JSON.parse(localStorage.getItem('italian-bible-streak') ?? '{}').today?.practiced).toBeFalsy();
    });

    it('ticks practice after three turns', async () => {
      await open();
      await talk(3);
      fireEvent.click(button('Stop'));
      await flush();
      expect(JSON.parse(localStorage.getItem('italian-bible-streak')).today.practiced).toBe(true);
    });
  });

  describe('on-device speech', () => {
    afterEach(() => { delete window.SpeechRecognition.available; });

    it('asks for it when Italian is installed, and says so', async () => {
      window.SpeechRecognition.available = async () => 'available';
      render(<Conversa week={week} model="m" onClose={() => {}} />);
      await flush();
      await speakAll();
      expect(activeRec.processLocally).toBe(true);
      expect(document.querySelector('.conversa-note').textContent).toMatch(/recognized on this device/);
    });

    it('is honest when the browser would use an online service', async () => {
      await open();
      expect(activeRec.processLocally).toBeUndefined();
      expect(document.querySelector('.conversa-note').textContent).toMatch(/may send your voice online/);
    });
  });
});
