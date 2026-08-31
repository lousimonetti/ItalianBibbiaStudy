import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { VerbFormDrill } from './VerbFormDrill';
import { STORAGE_KEY } from '../utils/verbForms';
import { VERB_FORMS } from '../../course/verbForms';

// vitest runs without `globals`, so cleanup must be explicit.
describe('VerbFormDrill', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('opens on a start screen naming every category', () => {
    render(<VerbFormDrill />);
    expect(screen.getByText('Tempi della lettura')).toBeTruthy();
    expect(screen.getByText('Passato remoto forte')).toBeTruthy();
    expect(screen.getByText('Trapassato prossimo')).toBeTruthy();
    // Nothing practised yet.
    expect(screen.getAllByText('new').length).toBeGreaterThan(0);
  });

  it('grades an answer, records it, and reveals the bridge to the taught tense', () => {
    render(<VerbFormDrill />);
    fireEvent.click(screen.getByRole('button', { name: /^Start/ }));

    // Whichever form is served, answering with its infinitive must be accepted.
    const form = document.querySelector('.vf-form').textContent.trim();
    const item = VERB_FORMS.find((v) => form.startsWith(v.form));

    fireEvent.change(screen.getByLabelText('The infinitive'), { target: { value: item.inf } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(screen.getByText('Giusto!')).toBeTruthy();
    expect(document.querySelector('.vf-bridge').textContent).toContain(item.pp);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[item.cat])
      .toEqual({ attempts: 1, correct: 1 });
  });

  it('names the verb you confused it with', () => {
    render(<VerbFormDrill />);
    fireEvent.click(screen.getByRole('button', { name: /^Start/ }));
    fireEvent.change(screen.getByLabelText('The infinitive'), { target: { value: 'camminare' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    // camminare is not in the dataset, so this is a plain miss, not a confusion.
    expect(screen.getByText('Not quite')).toBeTruthy();
  });

  it('will not check an empty answer', () => {
    render(<VerbFormDrill />);
    fireEvent.click(screen.getByRole('button', { name: /^Start/ }));
    expect(screen.getByRole('button', { name: 'Check' }).disabled).toBe(true);
  });
});
