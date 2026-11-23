import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

// A fake recognition, installed before the component reads availability at
// module load. Each started instance is kept so the test can speak into it.
const started = [];
class FakeRecognition {
  start() { started.push(this); }
  stop() {}
  abort() {}
}
window.SpeechRecognition = FakeRecognition;

const { FluencySprint } = await import('./FluencySprint');
const { loadSprints } = await import('../utils/sprintStore');

function say(text) {
  const rec = started[started.length - 1];
  act(() => rec.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: text }], { isFinal: true })] }));
}

describe('FluencySprint', () => {
  beforeEach(() => { localStorage.clear(); started.length = 0; });
  afterEach(cleanup);

  it('keeps a finished run for the progress check', () => {
    render(<FluencySprint week={{ n: 4, prompt: { it: 'Parla della tua giornata.' } }} />);
    fireEvent.click(screen.getByText(/Sprint 4\/3\/2/));
    fireEvent.click(screen.getByRole('button', { name: /Round 1/ }));
    say('oggi sono andato a messa con la mia famiglia');
    fireEvent.click(screen.getByRole('button', { name: 'Stop early' }));
    expect(loadSprints()).toEqual([]); // not kept mid-run

    fireEvent.click(screen.getByRole('button', { name: /Round 2/ }));
    say('oggi sono andato a messa');
    fireEvent.click(screen.getByRole('button', { name: 'Stop early' }));
    fireEvent.click(screen.getByRole('button', { name: /Round 3/ }));
    say('oggi messa');
    fireEvent.click(screen.getByRole('button', { name: 'Stop early' }));

    const runs = loadSprints();
    expect(runs).toHaveLength(1);
    expect(runs[0].weekN).toBe(4);
    expect(runs[0].rounds.map((r) => r.words)).toEqual([9, 5, 2]);
    expect(runs[0].rounds.map((r) => r.seconds)).toEqual([60, 45, 30]);
  });
});
