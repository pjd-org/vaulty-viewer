import React from 'react';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.hoisted(() => vi.fn());
const mockGetBootstrapStatus = vi.hoisted(() => vi.fn());
const mockCreateGenesisRoot = vi.hoisted(() => vi.fn());
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
  createGenesisRoot: mockCreateGenesisRoot,
  resolveBootstrapRedirect: async (pathname: string) => {
    const status = await mockGetBootstrapStatus();
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
  mockCreateGenesisRoot.mockReset();
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
      required: true,
      locked: false,
      reason: 'missing-root-user',
    });

    render(<BootstrapComponent />);
    expect(await screen.findByRole('heading', { name: /create root user/i })).toBeTruthy();
  });

  it('redirects away when locked', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
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
      required: true,
      locked: false,
      reason: 'missing-root-user',
    });
    mockCreateGenesisRoot.mockResolvedValue({
      ok: true,
      user: {
        id: 'root-1',
        email: 'root@example.test',
        role: 'root',
        emailVerified: true,
        createdByBootstrap: true,
      },
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
      expect(mockCreateGenesisRoot).toHaveBeenCalledWith({
        displayName: 'Darry',
        email: 'root@example.test',
        password: 'super-secret',
      });
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/config' });
    });
  });

  it('shows locked state on 409', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      required: true,
      locked: false,
      reason: 'missing-root-user',
    });
    mockCreateGenesisRoot.mockResolvedValue({
      ok: false,
      code: 'BOOTSTRAP_LOCKED',
      reason: 'root-user-exists',
      message: 'Bootstrap is already locked.',
    });

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
      expect(screen.getByRole('alert').textContent).toContain('locked');
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
    });
  });

  it('blocks password mismatch submit', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
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

    expect(mockCreateGenesisRoot).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
