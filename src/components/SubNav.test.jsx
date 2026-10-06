import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SubNav } from './SubNav';

const views = [{ id: 'Prayers' }, { id: 'Rosary' }, { id: 'Saints' }];

describe('SubNav', () => {
  afterEach(cleanup);

  it('marks the active view and selects on click', () => {
    const onSelect = vi.fn();
    render(<SubNav views={views} active="Rosary" onSelect={onSelect} />);
    expect(screen.getByRole('tab', { name: 'Rosary' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: 'Saints' }));
    expect(onSelect).toHaveBeenCalledWith('Saints');
  });

  it('arrow keys move through views and wrap', () => {
    const onSelect = vi.fn();
    render(<SubNav views={views} active="Saints" onSelect={onSelect} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Saints' }), { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenCalledWith('Prayers');
  });
});
