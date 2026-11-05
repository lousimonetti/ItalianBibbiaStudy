import { describe, it, expect, vi } from 'vitest';
import { listModels, streamChat, warmUp, OllamaError, OLLAMA_URL } from './ollamaClient';

function streamResponse(chunks, { ok = true, status = 200 } = {}) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok,
    status,
    body: {
      getReader: () => ({
        read: async () => (i < chunks.length ? { done: false, value: encoder.encode(chunks[i++]) } : { done: true }),
      }),
    },
  };
}

const line = (content) => `${JSON.stringify({ message: { content } })}\n`;
const run = (fetchImpl, extra = {}) => {
  const out = [];
  return streamChat({
    model: 'm', system: 's', messages: [{ role: 'user', content: 'u' }], onDelta: (t) => out.push(t), fetchImpl, ...extra,
  }).then(() => out);
};

describe('listModels', () => {
  it('returns the model names, from this computer only', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ models: [{ name: 'a' }, { name: 'b' }] }) }));
    expect(await listModels(fetchImpl)).toEqual(['a', 'b']);
    expect(fetchImpl.mock.calls[0][0]).toBe('http://localhost:11434/api/tags');
  });

  it('reports a network failure as a connection problem', async () => {
    await expect(listModels(async () => { throw new TypeError('Failed to fetch'); }))
      .rejects.toMatchObject({ name: 'OllamaError', kind: 'connect' });
  });

  it('reports a bad status', async () => {
    await expect(listModels(async () => ({ ok: false, status: 500 }))).rejects.toMatchObject({ kind: 'server' });
  });

  it('copes with no models installed', async () => {
    expect(await listModels(async () => ({ ok: true, json: async () => ({}) }))).toEqual([]);
  });
});

describe('streamChat', () => {
  it('always calls the fixed local address', () => {
    expect(OLLAMA_URL).toBe('http://localhost:11434');
  });

  it('turns thinking off, and sends the measured options with the system prompt first', async () => {
    const fetchImpl = vi.fn(async () => streamResponse([line('Ciao')]));
    await run(fetchImpl);
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.think).toBe(false);
    expect(body.stream).toBe(true);
    expect(body.options.num_ctx).toBe(2048);
    expect(body.messages[0]).toEqual({ role: 'system', content: 's' });
    expect(body.messages[1]).toEqual({ role: 'user', content: 'u' });
  });

  it('delivers each piece of text in order', async () => {
    expect(await run(async () => streamResponse([line('Uno '), line('due')]))).toEqual(['Uno ', 'due']);
  });

  it('handles lines split across network chunks, and a last line with no newline', async () => {
    const whole = line('Uno');
    const last = JSON.stringify({ message: { content: 'due' } });
    const out = await run(async () => streamResponse([whole.slice(0, 5), whole.slice(5), last]));
    expect(out).toEqual(['Uno', 'due']);
  });

  it('keeps multi-byte characters whole when split across chunks', async () => {
    const bytes = new TextEncoder().encode(line('è'));
    let i = 0;
    const res = {
      ok: true,
      status: 200,
      body: { getReader: () => ({ read: async () => (i < bytes.length ? { done: false, value: bytes.slice(i++, i) } : { done: true }) }) },
    };
    expect(await run(async () => res)).toEqual(['è']);
  });

  it('skips the final stats line, which carries no text', async () => {
    const out = await run(async () => streamResponse([line('Ciao'), `${JSON.stringify({ done: true, message: { content: '' } })}\n`]));
    expect(out).toEqual(['Ciao']);
  });

  it('names a missing model separately', async () => {
    await expect(run(async () => streamResponse([], { ok: false, status: 404 }))).rejects.toMatchObject({ kind: 'model' });
  });

  it('reports a connection failure', async () => {
    await expect(run(async () => { throw new TypeError('Failed to fetch'); })).rejects.toMatchObject({ kind: 'connect' });
  });

  it('reports an error sent mid-stream', async () => {
    const e = await run(async () => streamResponse([line('Uno'), `${JSON.stringify({ error: 'out of memory' })}\n`])).catch((x) => x);
    expect(e).toBeInstanceOf(OllamaError);
    expect(e.message).toBe('out of memory');
  });

  it('reports garbage as a server problem rather than crashing', async () => {
    await expect(run(async () => streamResponse(['not json\n']))).rejects.toMatchObject({ kind: 'server' });
  });

  it('passes a cancellation through as an abort, not an error to show', async () => {
    const controller = new AbortController();
    const fetchImpl = (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    });
    const pending = run(fetchImpl, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('aborts at once when already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = (_url, { signal }) => (signal.aborted
      ? Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
      : Promise.resolve(streamResponse([])));
    await expect(run(fetchImpl, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('warmUp', () => {
  it('asks for a single token, to load the model and cache the system prompt', async () => {
    const fetchImpl = vi.fn(async () => streamResponse([line('C')]));
    expect(await warmUp({ model: 'm', system: 'the system prompt', fetchImpl })).toBe(true);
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.options.num_predict).toBe(1);
    expect(body.messages[0].content).toBe('the system prompt');
  });

  it('never throws, because the first real turn reports the problem', async () => {
    expect(await warmUp({ model: 'm', system: 's', fetchImpl: async () => { throw new TypeError('x'); } })).toBe(false);
  });
});
