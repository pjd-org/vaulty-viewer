import React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockGetBootstrapStatus = vi.hoisted(() => vi.fn());
const mockPatchBootstrapDraft = vi.hoisted(() => vi.fn());
const mockStartGitHubInstall = vi.hoisted(() => vi.fn());
const mockGetGitHubStatus = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({ options }),
  useNavigate: () => mockNavigate,
  useSearch: () => ({ installed: false, error: undefined }),
}));

vi.mock('../../src/lib/bootstrap', () => ({
  getBootstrapStatus: mockGetBootstrapStatus,
  patchBootstrapDraft: mockPatchBootstrapDraft,
  startGitHubInstall: mockStartGitHubInstall,
  getGitHubStatus: mockGetGitHubStatus,
}));

import { Route as GitHubRoute } from '../../app/routes/onboarding.github';

const GitHubComponent = GitHubRoute.options.component as React.ComponentType;

const baseStatus = {
  state: 'github_host_required',
  phase: 'onboarding',
  nextRoute: '/onboarding/github',
  lock: { active: false, reason: null, scope: null },
  required: false,
  locked: false,
  reason: 'root-user-exists',
  rootUser: { exists: true },
  draft: { displayName: 'Darry', workspaceName: 'My Vault', role: 'solo', draftVersion: 1, etag: 'etag-1', updatedAt: '2026-05-06T00:00:00Z' },
  genesisJob: null,
};

const notInstalledStatus = {
  state: 'github_host_required' as const,
  installationId: null,
  owner: null,
  ownerType: null,
  appInstalled: false,
  verified: false,
  permissions: null,
  permissionsOk: false,
};

const installedStatus = {
  state: 'github_host_connected' as const,
  installationId: 42,
  owner: 'darry',
  ownerType: 'user' as const,
  appInstalled: true,
  verified: false,
  permissions: { metadata: 'read', contents: 'write', administration: 'write' },
  permissionsOk: true,
};

beforeEach(() => {
  mockNavigate.mockReset();
  mockGetBootstrapStatus.mockReset();
  mockPatchBootstrapDraft.mockReset();
  mockStartGitHubInstall.mockReset();
  mockGetGitHubStatus.mockReset();
});

beforeEach(async () => {
  await (GitHubComponent as { preload?: () => Promise<void> }).preload?.();
});

afterEach(() => cleanup());

describe('onboarding.github route', () => {
  it('renders install form when app is not installed', async () => {
    mockGetBootstrapStatus.mockResolvedValue(baseStatus);
    mockGetGitHubStatus.mockResolvedValue(notInstalledStatus);

    render(<GitHubComponent />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /install github app/i })).toBeDefined();
    });
    expect(screen.getByLabelText(/github owner/i)).toBeDefined();
    expect(screen.getByLabelText(/owner type/i)).toBeDefined();
  });

  it('install button is disabled when owner is empty', async () => {
    mockGetBootstrapStatus.mockResolvedValue(baseStatus);
    mockGetGitHubStatus.mockResolvedValue(notInstalledStatus);

    render(<GitHubComponent />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /install github app/i })).toBeDefined();
    });

    const btn = screen.getByRole('button', { name: /install github app/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('calls startGitHubInstall and redirects on install', async () => {
    mockGetBootstrapStatus.mockResolvedValue(baseStatus);
    mockGetGitHubStatus.mockResolvedValue(notInstalledStatus);
    mockStartGitHubInstall.mockResolvedValue({
      installUrl: 'https://github.com/apps/vaulty/installations/new?target_id=user%3Adarry',
      state: 'github_host_required',
    });

    const assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    render(<GitHubComponent />);

    await waitFor(() => {
      expect(screen.getByLabelText(/github owner/i)).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText(/github owner/i), { target: { value: 'darry' } });

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /install github app/i }) as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    fireEvent.click(screen.getByRole('button', { name: /install github app/i }));

    await waitFor(() => {
      expect(mockStartGitHubInstall).toHaveBeenCalledWith('darry', 'user');
    });
  });

  it('renders connected state when app is installed', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      ...baseStatus,
      state: 'github_host_connected',
      draft: {
        ...baseStatus.draft,
        githubPlan: {
          owner: 'darry',
          ownerType: 'user',
          repo: 'my-vault',
          branch: 'main',
          visibility: 'private',
          installationId: 42,
          appInstalled: true,
          verified: false,
          conflictPolicy: 'block',
        },
      },
    });
    mockGetGitHubStatus.mockResolvedValue(installedStatus);

    render(<GitHubComponent />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).toBeDefined();
    });
    expect(screen.getByText(/darry/)).toBeDefined();
    expect(screen.getByLabelText(/repository name/i)).toBeDefined();
  });

  it('saves githubPlan and navigates on continue', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      ...baseStatus,
      state: 'github_host_connected',
      draft: {
        ...baseStatus.draft,
        githubPlan: {
          owner: 'darry',
          ownerType: 'user',
          repo: 'my-vault',
          branch: 'main',
          visibility: 'private',
          installationId: 42,
          appInstalled: true,
          verified: false,
          conflictPolicy: 'block',
        },
      },
    });
    mockGetGitHubStatus.mockResolvedValue(installedStatus);
    mockPatchBootstrapDraft.mockResolvedValue({
      draft: {},
      status: { nextRoute: '/onboarding/review' },
    });

    render(<GitHubComponent />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(mockPatchBootstrapDraft).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/review' });
    });
  });

  it('shows error when getGitHubStatus fails', async () => {
    mockGetBootstrapStatus.mockResolvedValue(baseStatus);
    mockGetGitHubStatus.mockRejectedValue(new Error('network error'));

    render(<GitHubComponent />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });
});
