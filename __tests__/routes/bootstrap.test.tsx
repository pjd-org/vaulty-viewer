import React from 'react';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.hoisted(() => vi.fn());
const mockGetBootstrapStatus = vi.hoisted(() => vi.fn());
const mockCreateBootstrapRootUser = vi.hoisted(() => vi.fn());
let currentPathname = '/bootstrap';

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
  redirect: ({ to }: { to: string }) => ({ to }),
  useNavigate: () => mockNavigate,
  useRouterState: (selector: (state: { location: { pathname: string } }) => unknown) =>
    selector({ location: { pathname: currentPathname } }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock('../../src/lib/bootstrap', () => ({
  getBootstrapStatus: mockGetBootstrapStatus,
  createBootstrapRootUser: mockCreateBootstrapRootUser,
  resolveBootstrapRedirect: async (pathname: string) => {
    const status = await mockGetBootstrapStatus();
    if (status.nextRoute && pathname !== status.nextRoute) {
      return { status, redirectTo: status.nextRoute };
    }
    if (status.required && pathname !== '/bootstrap') {
      return { status, redirectTo: '/bootstrap' };
    }
    if (status.locked && pathname === '/bootstrap') {
      return { status, redirectTo: '/' };
    }
    return { status, redirectTo: null };
  },
}));

afterEach(() => {
  cleanup();
  mockNavigate.mockReset();
  mockInvalidateQueries.mockReset();
  mockGetBootstrapStatus.mockReset();
  mockCreateBootstrapRootUser.mockReset();
  currentPathname = '/bootstrap';
});

import { Route } from '../../app/routes/bootstrap';

const BootstrapComponent = Route.options.component as React.ComponentType;

beforeEach(async () => {
  await (BootstrapComponent as { preload?: () => Promise<void> }).preload?.();
});

describe('bootstrap route', () => {
  it('renders bootstrap wizard when required', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      state: 'root_user_required',
      phase: 'bootstrap',
      nextRoute: '/bootstrap',
      lock: { active: false, reason: null, scope: null },
      compat: {
        required: true,
        locked: false,
        reason: 'missing-root-user',
      },
      rootUser: { exists: false },
      draft: null,
      preflight: null,
      genesisJob: null,
      required: true,
      locked: false,
      reason: 'missing-root-user',
    });

    render(<BootstrapComponent />);
    expect(await screen.findByRole('heading', { name: /create root user/i })).toBeTruthy();
  });

  it('redirects away when locked', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      state: 'active',
      phase: 'active',
      nextRoute: '/',
      lock: { active: true, reason: 'root user exists', scope: 'all' },
      compat: {
        required: false,
        locked: true,
        reason: 'root-user-exists',
      },
      rootUser: { exists: true },
      draft: null,
      preflight: null,
      genesisJob: null,
      required: false,
      locked: true,
      reason: 'root-user-exists',
    });

    render(<BootstrapComponent />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
    });
  });

  it('submits genesis root and redirects to config', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      state: 'root_user_required',
      phase: 'bootstrap',
      nextRoute: '/bootstrap',
      lock: { active: false, reason: null, scope: null },
      compat: {
        required: true,
        locked: false,
        reason: 'missing-root-user',
      },
      rootUser: { exists: false },
      draft: null,
      preflight: null,
      genesisJob: null,
      required: true,
      locked: false,
      reason: 'missing-root-user',
    });
    mockCreateBootstrapRootUser.mockResolvedValue({
      state: 'new',
      nextRoute: '/onboarding/welcome',
      rootUserId: 'root-1',
      authSessionEstablished: false,
    });

    render(<BootstrapComponent />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Darry' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'root@example.test' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'super-secret' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'super-secret' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /create root user/i }));

    await waitFor(() => {
      expect(mockCreateBootstrapRootUser).toHaveBeenCalledWith({
        displayName: 'Darry',
        email: 'root@example.test',
        password: 'super-secret',
      }, expect.stringContaining('boot_'));
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/welcome' });
    });
  });

  it('shows locked state on 409', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      state: 'root_user_required',
      phase: 'bootstrap',
      nextRoute: '/bootstrap',
      lock: { active: false, reason: null, scope: null },
      compat: {
        required: true,
        locked: false,
        reason: 'missing-root-user',
      },
      rootUser: { exists: false },
      draft: null,
      preflight: null,
      genesisJob: null,
      required: true,
      locked: false,
      reason: 'missing-root-user',
    });
    mockCreateBootstrapRootUser.mockRejectedValue(new Error('A root user already exists.'));

    render(<BootstrapComponent />);

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'root@example.test' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'super-secret' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'super-secret' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /create root user/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('A root user already exists.');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('blocks password mismatch submit', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      state: 'root_user_required',
      phase: 'bootstrap',
      nextRoute: '/bootstrap',
      lock: { active: false, reason: null, scope: null },
      compat: {
        required: true,
        locked: false,
        reason: 'missing-root-user',
      },
      rootUser: { exists: false },
      draft: null,
      required: true,
      locked: false,
      reason: 'missing-root-user',
    });

    render(<BootstrapComponent />);

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'root@example.test' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'super-secret' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'wrong-secret' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /create root user/i }));

    expect(mockCreateBootstrapRootUser).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
