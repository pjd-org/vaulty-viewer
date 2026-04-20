import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRouterState = vi.hoisted(() => ({
  pathname: '/',
}));

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

vi.mock('../../app/components/layout', () => ({
  ViewerSidebar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="viewer-sidebar">{children}</div>
  ),
  TopCommandBar: () => <div data-testid="top-command-bar" />,
  VerificationRailHost: () => <aside data-testid="verification-rail" />,
}));

vi.mock('../../app/components/shell', () => ({
  CommandHost: () => <div data-testid="command-host" />,
  ModalHost: () => <div data-testid="modal-host" />,
}));

vi.mock('../../app/routes/avatar', () => ({
  AvatarRoute: () => <div data-testid="avatar-route" />,
}));

vi.mock('../../app/routes/cod-status', () => ({
  CODStatusRoute: () => <div data-testid="cod-status-route" />,
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  );

  return {
    ...actual,
    HeadContent: () => null,
    Scripts: () => null,
    Outlet: () => <div data-testid="route-outlet" />,
    useRouter: () => ({ options: { context: { queryClient: {} } } }),
    useRouterState: ({
      select,
    }: {
      select: (state: { location: { pathname: string } }) => unknown;
    }) => select({ location: { pathname: mockRouterState.pathname } }),
  };
});

import { Route } from '../../app/routes/__root';

const RootComponent = Route.options.component as React.ComponentType;

beforeEach(async () => {
  await (RootComponent as { preload?: () => Promise<void> }).preload?.();
});

describe('root shell behavior', () => {
  beforeEach(() => {
    mockRouterState.pathname = '/';
  });

  it.each(['/', '/inbox', '/actions', '/project/rent-stability-pantin'])(
    'renders shell chrome on %s',
    (pathname) => {
      mockRouterState.pathname = pathname;

      const markup = renderToStaticMarkup(<RootComponent />);

      expect(markup).toContain('data-testid="viewer-sidebar"');
      expect(markup).toContain('data-testid="top-command-bar"');
      expect(markup).toContain('data-testid="verification-rail"');
      expect(markup).toContain('data-testid="route-outlet"');
    }
  );

  it('hides shell chrome on login routes', () => {
    mockRouterState.pathname = '/login';

    const markup = renderToStaticMarkup(<RootComponent />);

    expect(markup).not.toContain('data-testid="viewer-sidebar"');
    expect(markup).not.toContain('data-testid="top-command-bar"');
    expect(markup).not.toContain('data-testid="verification-rail"');
    expect(markup).toContain('data-testid="route-outlet"');
  });
});
