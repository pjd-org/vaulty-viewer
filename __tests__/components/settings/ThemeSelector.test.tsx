import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the UIStore to control theme state in tests
const mockSetTheme = vi.fn();
let mockTheme = 'system';

vi.mock('../../../src/store/ui', () => ({
  useUIStore: (
    selector: (s: { theme: string; setTheme: typeof mockSetTheme }) => unknown
  ) => selector({ theme: mockTheme, setTheme: mockSetTheme }),
}));

import { ThemeSelector } from '../../../app/components/settings/ThemeSelector';

describe('ThemeSelector', () => {
  beforeEach(() => {
    mockTheme = 'system';
    mockSetTheme.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders three options: Light, Dark, System', () => {
    render(<ThemeSelector />);
    expect(screen.getByRole('radio', { name: 'Light' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'System' })).toBeTruthy();
  });

  it('clicking Dark calls setTheme("dark")', async () => {
    render(<ThemeSelector />);
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('clicking Light calls setTheme("light")', async () => {
    render(<ThemeSelector />);
    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('clicking System calls setTheme("system")', async () => {
    render(<ThemeSelector />);
    fireEvent.click(screen.getByRole('radio', { name: 'System' }));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('active option (system) has aria-checked=true', () => {
    mockTheme = 'system';
    render(<ThemeSelector />);
    const systemBtn = screen.getByRole('radio', { name: 'System' });
    expect(systemBtn.getAttribute('aria-checked')).toBe('true');
  });

  it('inactive options have aria-checked=false', () => {
    mockTheme = 'dark';
    render(<ThemeSelector />);
    expect(
      screen.getByRole('radio', { name: 'Light' }).getAttribute('aria-checked')
    ).toBe('false');
    expect(
      screen.getByRole('radio', { name: 'System' }).getAttribute('aria-checked')
    ).toBe('false');
  });

  it('active option has default variant class (bg-primary)', () => {
    mockTheme = 'dark';
    render(<ThemeSelector />);
    const darkBtn = screen.getByRole('radio', { name: 'Dark' });
    expect(darkBtn.className).toContain('bg-gradient-to-r');
    expect(darkBtn.className).toContain('from-primary');
  });

  it('inactive options do not have bg-primary class', () => {
    mockTheme = 'dark';
    render(<ThemeSelector />);
    const lightBtn = screen.getByRole('radio', { name: 'Light' });
    expect(lightBtn.className).toContain('bg-transparent');
  });
});
