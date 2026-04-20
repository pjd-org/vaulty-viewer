import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({
    primary,
    aside,
  }: {
    primary?: React.ReactNode;
    aside?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="scaffold-primary">{primary}</div>
      <div data-testid="scaffold-aside">{aside}</div>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Settings route
// ---------------------------------------------------------------------------
import { Route as SettingsRouteModule } from '../../app/routes/settings';
const SettingsComponent = SettingsRouteModule.options
  .component as React.ComponentType;

beforeEach(async () => {
  await (SettingsComponent as { preload?: () => Promise<void> }).preload?.();
});

describe('settings route — rendering', () => {
  it('renders ThemeSelector radiogroup', () => {
    render(<SettingsComponent />);
    expect(screen.getByRole('radiogroup', { name: /theme/i })).toBeTruthy();
  });

  it('renders DensitySelector radiogroup', () => {
    render(<SettingsComponent />);
    expect(
      screen.getByRole('radiogroup', { name: /layout density/i })
    ).toBeTruthy();
  });

  it('renders SidebarCollapseToggle button', () => {
    render(<SettingsComponent />);
    expect(screen.getByRole('button', { name: /sidebar/i })).toBeTruthy();
  });
});

describe('settings route — DensitySelector interactions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('marks "Comfortable" as selected by default', () => {
    render(<SettingsComponent />);
    const btn = screen.getByRole('radio', { name: 'Comfortable' });
    expect(btn.getAttribute('aria-checked')).toBe('true');
  });

  it('clicking "Compact" marks it as selected', () => {
    render(<SettingsComponent />);
    fireEvent.click(screen.getByRole('radio', { name: 'Compact' }));
    expect(
      screen
        .getByRole('radio', { name: 'Compact' })
        .getAttribute('aria-checked')
    ).toBe('true');
  });

  it('clicking "Spacious" persists to localStorage', () => {
    render(<SettingsComponent />);
    fireEvent.click(screen.getByRole('radio', { name: 'Spacious' }));
    expect(localStorage.getItem('vault-density')).toBe('spacious');
  });
});

describe('settings route — SidebarCollapseToggle interactions', () => {
  it('shows "Hide sidebar" when sidebar is expanded (default)', () => {
    render(<SettingsComponent />);
    expect(screen.getByRole('button', { name: /hide sidebar/i })).toBeTruthy();
  });

  it('clicking toggle switches label to "Show sidebar"', () => {
    render(<SettingsComponent />);
    fireEvent.click(screen.getByRole('button', { name: /hide sidebar/i }));
    expect(screen.getByRole('button', { name: /show sidebar/i })).toBeTruthy();
  });
});
