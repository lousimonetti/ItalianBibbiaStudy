import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UiText } from './UiText.jsx';
import { ImmersionProvider } from './ImmersionProvider.jsx';

const KEY = 'italian-bible-immersion';

beforeEach(() => {
  localStorage.clear();
});

describe('UiText', () => {
  it('renders English by default (immersion off, no provider needed)', () => {
    render(<UiText k="tab.tracker" />);
    expect(screen.getByText('Tracker')).toBeTruthy();
  });

  it('renders Italian with the English as a title gloss when immersion is on', () => {
    localStorage.setItem(KEY, '1');
    render(
      <ImmersionProvider>
        <UiText k="tab.tracker" />
      </ImmersionProvider>
    );
    const node = screen.getByText('Percorso');
    expect(node).toBeTruthy();
    expect(node.getAttribute('title')).toBe('Tracker');
    expect(node.getAttribute('aria-label')).toBe('Tracker');
  });

  it('still renders English inside the provider when immersion is off', () => {
    localStorage.setItem(KEY, '0');
    render(
      <ImmersionProvider>
        <UiText k="tab.journal" />
      </ImmersionProvider>
    );
    expect(screen.getByText('Journal')).toBeTruthy();
  });

  it('falls back to the raw key for an unknown string', () => {
    render(<UiText k="does.not.exist" />);
    expect(screen.getByText('does.not.exist')).toBeTruthy();
  });
});
