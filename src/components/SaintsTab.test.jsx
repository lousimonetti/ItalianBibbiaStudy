import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

// The story fetch goes to Wikipedia; here it only records what was asked for.
const asked = [];
vi.mock('../utils/saints', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    fetchSaintStory: vi.fn(async (subject) => {
      asked.push(subject);
      return { it: null, en: null };
    }),
  };
});

const { SaintsTab } = await import('./SaintsTab');

async function renderOn(y, m, d) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(y, m - 1, d, 10));
  render(<SaintsTab />);
  await act(async () => {});
}

describe('SaintsTab liturgy', () => {
  beforeEach(() => { asked.length = 0; localStorage.clear(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('shows a plain weekday with its season and keeps the saint\'s story', async () => {
    await renderOn(2026, 11, 21);
    expect(screen.getByText('Sabato della XXXIII settimana del Tempo Ordinario')).toBeTruthy();
    expect(screen.getByText('Tempo Ordinario')).toBeTruthy();
    expect(screen.getByText('Presentazione della B.V. Maria')).toBeTruthy();
    expect(asked.at(-1).it).toBe('Presentazione di Maria al Tempio');
  });

  it('on a movable solemnity tells the feast\'s story and names the saint underneath', async () => {
    await renderOn(2026, 11, 22);
    expect(screen.getByText("Nostro Signore Gesù Cristo Re dell'universo")).toBeTruthy();
    expect(screen.getByText('Giorno di precetto')).toBeTruthy();
    expect(screen.getByText(/Si ricorda anche/)).toBeTruthy();
    expect(asked.at(-1)).toMatchObject({ it: 'Cristo Re', feast: true });
  });

  it('notes where a fixed feast falls when it moves', async () => {
    await renderOn(2030, 12, 8);
    expect(screen.getByText('II domenica di Avvento')).toBeTruthy();
    expect(screen.getByText(/Quest'anno si celebra lunedì 9 dicembre/)).toBeTruthy();
  });

  it('coming feasts jump the tab to that day', async () => {
    await renderOn(2026, 11, 21);
    fireEvent.click(screen.getByRole('button', { name: /Coming feasts/ }));
    fireEvent.click(screen.getByRole('button', { name: /Immacolata Concezione/ }));
    await act(async () => {});
    expect(screen.getByText(/martedì 8 dicembre/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /torna a oggi/ })).toBeTruthy();
  });
});
