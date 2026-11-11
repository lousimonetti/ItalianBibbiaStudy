import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { storageKey } from '../utils/storageKey';
import { useDueCount } from './useDueCount';
import { SRS_EVENT } from './useSrs';

const CARDS = [{ it: 'la luce' }, { it: 'il verbo' }, { it: 'la vita' }];
const KEY = storageKey('srs');

function Probe() {
  return <span data-testid="due">{useDueCount(CARDS)}</span>;
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('useDueCount', () => {
  it('counts only scheduled cards that are due, not unseen ones', () => {
    localStorage.setItem(KEY, JSON.stringify({
      'la luce': { due: Date.now() - 1000 },
      'il verbo': { due: Date.now() + 86400000 },
    }));
    render(<Probe />);
    expect(screen.getByTestId('due').textContent).toBe('1');
  });

  it('re-counts when a review is saved', () => {
    render(<Probe />);
    expect(screen.getByTestId('due').textContent).toBe('0');
    act(() => {
      localStorage.setItem(KEY, JSON.stringify({ 'la vita': { due: Date.now() - 1 } }));
      window.dispatchEvent(new Event(SRS_EVENT));
    });
    expect(screen.getByTestId('due').textContent).toBe('1');
  });
});
