import React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockGetBootstrapStatus = vi.hoisted(() => vi.fn());
const mockPutBootstrapDraft = vi.hoisted(() => vi.fn());
const mockPatchBootstrapDraft = vi.hoisted(() => vi.fn());
const mockGetBootstrapReview = vi.hoisted(() => vi.fn());
const mockRunBootstrapPreflight = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../src/lib/bootstrap', () => ({
  getBootstrapStatus: mockGetBootstrapStatus,
  putBootstrapDraft: mockPutBootstrapDraft,
  patchBootstrapDraft: mockPatchBootstrapDraft,
  getBootstrapReview: mockGetBootstrapReview,
  runBootstrapPreflight: mockRunBootstrapPreflight,
}));

import { Route as WelcomeRoute } from '../../app/routes/onboarding.welcome';
import { Route as ProfileRoute } from '../../app/routes/onboarding.profile';
import { Route as ReviewRoute } from '../../app/routes/onboarding.review';

const WelcomeComponent = WelcomeRoute.options.component as React.ComponentType;
const ProfileComponent = ProfileRoute.options.component as React.ComponentType;
const ReviewComponent = ReviewRoute.options.component as React.ComponentType;

beforeEach(() => {
  mockNavigate.mockReset();
  mockGetBootstrapStatus.mockReset();
  mockPutBootstrapDraft.mockReset();
  mockPatchBootstrapDraft.mockReset();
  mockGetBootstrapReview.mockReset();
  mockRunBootstrapPreflight.mockReset();
});

beforeEach(async () => {
  await (WelcomeComponent as { preload?: () => Promise<void> }).preload?.();
  await (ProfileComponent as { preload?: () => Promise<void> }).preload?.();
  await (ReviewComponent as { preload?: () => Promise<void> }).preload?.();
});

afterEach(() => cleanup());

describe('onboarding routes', () => {
  it('saves the welcome draft and advances to profile', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      state: 'onboarding_draft',
      phase: 'onboarding',
      nextRoute: '/onboarding/welcome',
      lock: { active: false, reason: null, scope: null },
      compat: { required: false, locked: false, reason: 'root-user-exists' },
      rootUser: { exists: true },
      draft: null,
      genesisJob: null,
      required: false,
      locked: false,
      reason: 'root-user-exists',
    });
    mockPutBootstrapDraft.mockResolvedValue({
      draft: {
        displayName: 'Darry',
        workspaceName: 'Vaulty',
        draftVersion: 1,
        etag: '"draft:v1"',
        updatedAt: '2026-04-28T12:00:00.000Z',
      },
      status: {
        state: 'draft',
        phase: 'onboarding',
        nextRoute: '/onboarding/profile',
        lock: { active: false, reason: null, scope: null },
        compat: { required: false, locked: false, reason: 'root-user-exists' },
        rootUser: { exists: true },
        draft: null,
        required: false,
        locked: false,
        reason: 'root-user-exists',
      },
    });

    render(<WelcomeComponent />);
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Darry' } });
    fireEvent.change(screen.getByLabelText(/workspace name/i), { target: { value: 'Vaulty' } });
    fireEvent.submit(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(mockPutBootstrapDraft).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/profile' });
    });
  });

  it('patches the profile draft and advances to review', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      state: 'draft',
      phase: 'onboarding',
      nextRoute: '/onboarding/profile',
      lock: { active: false, reason: null, scope: null },
      compat: { required: false, locked: false, reason: 'root-user-exists' },
      rootUser: { exists: true },
      draft: {
        displayName: 'Darry',
        workspaceName: 'Vaulty',
        draftVersion: 1,
        etag: '"draft:v1"',
        updatedAt: '2026-04-28T12:00:00.000Z',
      },
      genesisJob: null,
      required: false,
      locked: false,
      reason: 'root-user-exists',
    });
    mockPatchBootstrapDraft.mockResolvedValue({
      draft: {
        displayName: 'Darry',
        workspaceName: 'Vaulty',
        workspaceIntent: 'bootstrap the workspace',
        focusAreas: ['docs', 'api'],
        draftVersion: 2,
        etag: '"draft:v2"',
        updatedAt: '2026-04-28T12:01:00.000Z',
      },
      status: {
        state: 'review',
        phase: 'onboarding',
        nextRoute: '/onboarding/review',
        lock: { active: false, reason: null, scope: null },
        compat: { required: false, locked: false, reason: 'root-user-exists' },
        rootUser: { exists: true },
        draft: null,
        required: false,
        locked: false,
        reason: 'root-user-exists',
      },
    });

    render(<ProfileComponent />);
    fireEvent.change(screen.getByLabelText(/workspace intent/i), {
      target: { value: 'bootstrap the workspace' },
    });
    fireEvent.change(screen.getByLabelText(/focus areas/i), {
      target: { value: 'docs, api' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /continue to review/i }));

    await waitFor(() => {
      expect(mockPatchBootstrapDraft).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/onboarding/review' });
    });
  });

  it('renders the review summary from draft metadata', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      state: 'review',
      phase: 'onboarding',
      nextRoute: '/onboarding/review',
      lock: { active: false, reason: null, scope: null },
      compat: { required: false, locked: false, reason: 'root-user-exists' },
      rootUser: { exists: true },
      draft: {
        displayName: 'Darry',
        workspaceName: 'Vaulty',
        workspaceIntent: 'bootstrap the workspace',
        focusAreas: ['docs', 'api'],
        draftVersion: 2,
        etag: '"draft:v2"',
        updatedAt: '2026-04-28T12:01:00.000Z',
      },
      required: false,
      locked: false,
      reason: 'root-user-exists',
    });
    mockGetBootstrapReview.mockResolvedValue({
      state: 'review',
      phase: 'onboarding',
      nextRoute: '/onboarding/review',
      lock: { active: false, reason: null, scope: null },
      compat: { required: false, locked: false, reason: 'root-user-exists' },
      rootUser: { exists: true },
      draft: {
        displayName: 'Darry',
        workspaceName: 'Vaulty',
        workspaceIntent: 'bootstrap the workspace',
        focusAreas: ['docs', 'api'],
        draftVersion: 2,
        etag: '"draft:v2"',
        updatedAt: '2026-04-28T12:01:00.000Z',
      },
      genesisJob: null,
      required: false,
      locked: false,
      reason: 'root-user-exists',
      review: {
        summary: 'Ready for preflight.',
        planHash: 'plan-hash',
        readyForGenesis: true,
        checks: [],
      },
    });
    mockRunBootstrapPreflight.mockResolvedValue({
      state: 'review',
      phase: 'onboarding',
      nextRoute: '/onboarding/review',
      lock: { active: false, reason: null, scope: null },
      compat: { required: false, locked: false, reason: 'root-user-exists' },
      rootUser: { exists: true },
      draft: {
        displayName: 'Darry',
        workspaceName: 'Vaulty',
        workspaceIntent: 'bootstrap the workspace',
        focusAreas: ['docs', 'api'],
        draftVersion: 2,
        etag: '"draft:v2"',
        updatedAt: '2026-04-28T12:01:00.000Z',
      },
      genesisJob: null,
      required: false,
      locked: false,
      reason: 'root-user-exists',
      review: {
        summary: 'Ready for preflight.',
        planHash: 'plan-hash',
        readyForGenesis: true,
        checks: [],
      },
      preflight: {
        idempotencyKey: 'preflight_abc',
        draftEtag: '"draft:v2"',
        checkedAt: '2026-04-28T12:02:00.000Z',
        report: {
          summary: 'Ready for preflight.',
          planHash: 'plan-hash',
          readyForGenesis: true,
          checks: [],
        },
      },
    });

    render(<ReviewComponent />);
    expect(await screen.findByText(/bootstrap the workspace/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /run preflight/i }));

    await waitFor(() => {
      expect(mockRunBootstrapPreflight).toHaveBeenCalledWith('"draft:v2"', expect.stringMatching(/^preflight_/));
    });
  });
});
