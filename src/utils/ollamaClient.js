// Talks to Ollama on this computer. The address is fixed, not a setting, so a learner's
// words can't be pointed at another host by a typo or a bad link.
//
// A browser reports a CORS rejection and "Ollama isn't running" as the same network error,
// so callers can only say that it couldn't connect, and should offer help for both causes.

export const OLLAMA_URL = 'http://localhost:11434';
export const RECOMMENDED_MODEL = 'gemma4:12b-mlx';

// These were measured on an M5 MacBook Air with 24 GB (see plan-tutor.md). Thinking must be
// off: with it on, the model spent its whole token allowance thinking, and replied with
// nothing. Context 2048 runs as fast as 4096 and uses about 3 GB less memory, and fits
// the most tutorPrompts can send.
const OPTIONS = { temperature: 0.4, num_predict: 200, num_ctx: 2048 };
const KEEP_ALIVE = '30m';
const LIST_TIMEOUT_MS = 2500;
const FIRST_TOKEN_TIMEOUT_MS = 60000; // long enough for a cold model load

export class OllamaError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'OllamaError';
    this.kind = kind; // 'connect', 'model', 'timeout' or 'server'
  }
}

export async function listModels(fetchImpl = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIST_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    if (!res.ok) throw new OllamaError('server', `Ollama replied ${res.status}`);
    const data = await res.json();
    return (data.models ?? []).map((m) => m.name).filter(Boolean);
  } catch (e) {
    if (e instanceof OllamaError) throw e;
    throw new OllamaError('connect', 'Could not reach Ollama');
  } finally {
    clearTimeout(timer);
  }
}

function chatBody(model, system, messages, extra = {}) {
  return JSON.stringify({
    model,
    stream: true,
    think: false,
    keep_alive: KEEP_ALIVE,
    options: { ...OPTIONS, ...extra },
    messages: [{ role: 'system', content: system }, ...messages],
  });
}

// Streams a reply, calling onDelta with each piece of text. Resolves when it ends, and
// rejects on any failure. An abort rejects with an AbortError, which callers discard.
export async function streamChat({ model, system, messages, signal, onDelta, fetchImpl = fetch, extra }) {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', onAbort);
  let timedOut = false;
  let timer = setTimeout(() => { timedOut = true; controller.abort(); }, FIRST_TOKEN_TIMEOUT_MS);
  try {
    let res;
    try {
      res = await fetchImpl(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        body: chatBody(model, system, messages, extra),
        signal: controller.signal,
      });
    } catch (e) {
      if (e?.name === 'AbortError' && !timedOut) throw e;
      throw new OllamaError(timedOut ? 'timeout' : 'connect', 'Could not reach Ollama');
    }
    if (!res.ok) {
      throw new OllamaError(res.status === 404 ? 'model' : 'server', `Ollama replied ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    const handle = (line) => {
      if (!line.trim()) return;
      const data = JSON.parse(line);
      if (data.error) throw new OllamaError('server', data.error);
      const text = data.message?.content;
      if (text) {
        clearTimeout(timer);
        onDelta(text);
      }
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop();
      lines.forEach(handle);
    }
    handle(pending);
  } catch (e) {
    if (e instanceof OllamaError) throw e;
    if (e?.name === 'AbortError') {
      if (timedOut) throw new OllamaError('timeout', 'Ollama took too long to answer');
      throw e;
    }
    throw new OllamaError('server', 'Ollama sent an unreadable reply');
  } finally {
    clearTimeout(timer);
    timer = null;
    signal?.removeEventListener('abort', onAbort);
  }
}

// Loads the model and caches the system prompt ahead of the first turn. Without this the
// first reply took 3-4 s; with it, about 1 s. Failing here is harmless, because the
// first real turn reports the problem properly.
export async function warmUp({ model, system, fetchImpl = fetch }) {
  try {
    await streamChat({
      model, system, messages: [{ role: 'user', content: 'Ciao' }], onDelta: () => {}, fetchImpl, extra: { num_predict: 1 },
    });
    return true;
  } catch {
    return false;
  }
}
