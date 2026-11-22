import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConversationPrep } from './ConversationPrep';
import { PHASES } from '../data/studyData';
import { loadMined } from '../utils/mined';

const week3 = PHASES.flatMap((p) => p.weeks).find((w) => w.n === 3);

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('ConversationPrep', () => {
  it('opens to the sheet, the notes form and the listening links', () => {
    render(<ConversationPrep week={week3} />);
    fireEvent.click(screen.getByRole('button', { name: /prepare for a conversation/i }));
    expect(screen.getByText('Questa settimana ho letto Giovanni 6.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /liturgia del giorno/i }).getAttribute('href'))
      .toBe('https://www.chiesacattolica.it/liturgia-del-giorno/');
  });

  it('saves a word from the conversation, and refuses one that is already a card', () => {
    render(<ConversationPrep week={week3} />);
    fireEvent.click(screen.getByRole('button', { name: /prepare for a conversation/i }));
    fireEvent.change(screen.getByLabelText('Italian word or phrase'), { target: { value: 'fare due chiacchiere' } });
    fireEvent.change(screen.getByLabelText('Meaning'), { target: { value: 'to have a chat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save to My words' }));
    expect(loadMined()).toMatchObject([{ it: 'fare due chiacchiere', en: 'to have a chat', src: 'conversation, week 3' }]);
    fireEvent.change(screen.getByLabelText('Italian word or phrase'), { target: { value: 'la finestra' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save to My words' }));
    expect(screen.getByRole('status').textContent).toMatch(/already one of your cards/);
    expect(loadMined()).toHaveLength(1);
  });
});
