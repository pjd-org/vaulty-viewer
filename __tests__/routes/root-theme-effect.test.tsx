/**
 * Tests for the theme useEffect in RootComponent.
 * Verifies that document.documentElement.classList is mutated correctly
 * as theme state changes (dark / light / system) and covers the D1 matchMedia
 * null guard and the system OS-change listener.
 */
import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---- store mock --------------------------------------------------------
const mockSetTheme = vi.fn();
let mockTheme = 'system';

vi.mock('../../src/store/ui', () => ({
  useUIStore: (
    selector: (s: { theme: string; setTheme: typeof mockSetTheme }) => unknown
  ) => selector({ theme: mockTheme, setTheme: mockSetTheme }),
  THEME_STORAGE_KEY: 'vault-theme',
}));

// ---- router / query mocks (minimal — mirrors root-shell-behavior.test.tsx) ---
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  );
  return {
    ...actual,
    HeadContent: () => null,
    Scripts: () => null,
    Outlet: () => <div data-testid="outlet" />,
    useRouter: () => ({ options: { context: { queryClient: {} } } }),
    useRouterState: ({
      select,
    }: {
      select: (s: { location: { pathname: string } }) => unknown;
    }) => select({ location: { pathname: '/' } }),
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query'
  );
  return {
    ...actual,
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    dehydrate: () => undefined,
  };
});

vi.mock('../../app/components/layout/ViewerSidebar', () => ({
  ViewerSidebar: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('../../app/components/layout', () => ({
  TopCommandBar: () => null,
}));

vi.mock('../../app/components/layout/VerificationRailHost', () => ({
  VerificationRailHost: () => null,
}));

vi.mock('../../app/components/shell/CommandHost', () => ({
  CommandHost: () => null,
}));

vi.mock('../../app/components/overlays/AvatarOverlay', () => ({
  AvatarOverlay: () => null,
}));
vi.mock('../../app/components/overlays/CODStatusOverlay', () => ({
  CODStatusOverlay: () => null,
}));
vi.mock('../../app/components/ui/sonner', () => ({ Toaster: () => null }));

import { Route } from '../../app/routes/__root';

const RootComponent = Route.options.component as React.ComponentType;

beforeEach(async () => {
  await (RootComponent as { preload?: () => Promise<void> }).preload?.();
});

// ---- matchMedia helpers ------------------------------------------------
type ChangeHandler = (e: { matches: boolean }) => void;
let _changeListeners: ChangeHandler[] = [];

function mockMatchMedia(matches: boolean) {
  _changeListeners = [];
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: (_: string, handler: ChangeHandler) => {
        _changeListeners.push(handler);
      },
      removeEventListener: (_: string, handler: ChangeHandler) => {
        _changeListeners = _changeListeners.filter((h) => h !== handler);
      },
      dispatchEvent: () => false,
    }),
  });
}

function fireOsChange(matches: boolean) {
  _changeListeners.forEach((h) => h({ matches }));
}

// -----------------------------------------------------------------------

describe('root theme effect — DOM class mutations', () => {
  beforeEach(() => {
    mockTheme = 'system';
    mockSetTheme.mockClear();
    // Reset matchMedia to a default (light OS)
    mockMatchMedia(false);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    cleanup();
    _changeListeners = [];
  });

  it('adds .dark when theme is "dark"', () => {
    mockTheme = 'dark';
    render(<RootComponent />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes .dark when theme is "light" (even if class was pre-existing)', () => {
    document.documentElement.classList.add('dark');
    mockTheme = 'light';
    render(<RootComponent />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('adds .dark when theme is "system" and OS prefers dark', () => {
    mockMatchMedia(true);
    mockTheme = 'system';
    render(<RootComponent />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('does not add .dark when theme is "system" and OS prefers light', () => {
    mockMatchMedia(false);
    mockTheme = 'system';
    render(<RootComponent />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('system: OS preference change to dark adds .dark', () => {
    mockMatchMedia(false);
    mockTheme = 'system';
    render(<RootComponent />);
    act(() => fireOsChange(true));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('system: OS preference change to light removes .dark', () => {
    mockMatchMedia(true);
    mockTheme = 'system';
    render(<RootComponent />);
    act(() => fireOsChange(false));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('does not crash when window.matchMedia is undefined (D1 guard)', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    });
    mockTheme = 'system';
    expect(() => render(<RootComponent />)).not.toThrow();
    // With matchMedia undefined the system branch exits early — no class applied
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('system branch listener is removed on unmount (no leak)', () => {
    mockMatchMedia(false);
    mockTheme = 'system';
    const { unmount } = render(<RootComponent />);
    expect(_changeListeners).toHaveLength(1);
    act(() => unmount());
    expect(_changeListeners).toHaveLength(0);
  });
});
