import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockGetBootstrapStatus = vi.hoisted(() => vi.fn());
const mockStartBootstrapGenesis = vi.hoisted(() => vi.fn());
const mockGetBootstrapGenesisJob = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../src/lib/bootstrap', () => ({
  getBootstrapStatus: mockGetBootstrapStatus,
  startBootstrapGenesis: mockStartBootstrapGenesis,
  getBootstrapGenesisJob: mockGetBootstrapGenesisJob,
}));

import { Route as GenesisRoute } from '../../app/routes/genesis';

const GenesisComponent = GenesisRoute.options.component as React.ComponentType;

beforeEach(async () => {
  mockNavigate.mockReset();
  mockGetBootstrapStatus.mockReset();
  mockStartBootstrapGenesis.mockReset();
  mockGetBootstrapGenesisJob.mockReset();
  await (GenesisComponent as { preload?: () => Promise<void> }).preload?.();
});

afterEach(() => cleanup());
afterEach(() => {
  vi.useRealTimers();
});

describe('genesis route', () => {
  it('starts genesis, polls job status, and redirects on success', async () => {
    vi.useFakeTimers();

    mockGetBootstrapStatus.mockResolvedValue({
      state: 'preflight_passed',
      phase: 'onboarding',
      nextRoute: '/genesis',
      lock: { active: false, reason: null, scope: null },
      compat: { required: false, locked: false, reason: 'root-user-exists' },
      rootUser: { exists: true },
      draft: {
        displayName: 'Darry',
        workspaceName: 'Vaulty',
        workspaceIntent: 'bootstrap the workspace',
        draftVersion: 2,
        etag: '"draft:v2"',
        updatedAt: '2026-04-28T12:01:00.000Z',
      },
      preflight: {
        reportId: 'report_123',
        planHash: 'plan_123',
        idempotencyKey: 'preflight-1',
        draftEtag: '"draft:v2"',
        checkedAt: '2026-04-28T12:02:00.000Z',
        report: {
          summary: 'Ready for preflight.',
          planHash: 'plan_123',
          readyForGenesis: true,
          checks: [],
        },
      },
      genesisJob: null,
      required: false,
      locked: false,
      reason: 'root-user-exists',
    });

    mockStartBootstrapGenesis.mockResolvedValue({
      jobId: 'job_1',
      state: 'genesis_queued',
      pollUrl: '/api/v1/bootstrap/jobs/job_1',
    });

    mockGetBootstrapGenesisJob
      .mockResolvedValueOnce({
        jobId: 'job_1',
        status: 'queued',
        phase: 'genesis_queued',
        percent: 0,
        message: 'Genesis queued',
        result: null,
        error: null,
        reportId: 'report_123',
        planHash: 'plan_123',
        createdAt: '2026-04-28T12:02:00.000Z',
        updatedAt: '2026-04-28T12:02:00.000Z',
      })
      .mockResolvedValueOnce({
        jobId: 'job_1',
        status: 'running',
        phase: 'running_genesis_init',
        percent: 55,
        message: 'Genesis is provisioning the vault',
        result: null,
        error: null,
        reportId: 'report_123',
        planHash: 'plan_123',
        createdAt: '2026-04-28T12:02:00.000Z',
        updatedAt: '2026-04-28T12:02:00.500Z',
      })
      .mockResolvedValueOnce({
        jobId: 'job_1',
        status: 'succeeded',
        phase: 'finalised',
        percent: 100,
        message: 'Genesis completed',
        result: { bootstrapState: 'active', redirectTo: '/' },
        error: null,
        reportId: 'report_123',
        planHash: 'plan_123',
        createdAt: '2026-04-28T12:02:00.000Z',
        updatedAt: '2026-04-28T12:02:01.000Z',
        completedAt: '2026-04-28T12:02:01.000Z',
      });

    await React.act(async () => {
      render(<GenesisComponent />);
      await Promise.resolve();
    });

    expect(mockStartBootstrapGenesis).toHaveBeenCalledWith(
      {
        reportId: 'report_123',
        planHash: 'plan_123',
      },
      expect.stringContaining('gen_')
    );

    await React.act(async () => {
      await vi.advanceTimersByTimeAsync(650);
      await Promise.resolve();
    });

    expect(screen.getByText(/genesis completed/i)).toBeTruthy();
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });

  });

  it('shows failure UI when genesis fails', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      state: 'genesis_failed',
      phase: 'onboarding',
      nextRoute: '/genesis',
      lock: { active: false, reason: null, scope: null },
      compat: { required: false, locked: false, reason: 'root-user-exists' },
      rootUser: { exists: true },
      draft: {
        displayName: 'Darry',
        workspaceName: 'Vaulty',
        workspaceIntent: 'bootstrap the workspace',
        draftVersion: 2,
        etag: '"draft:v2"',
        updatedAt: '2026-04-28T12:01:00.000Z',
      },
      preflight: {
        reportId: 'report_123',
        planHash: 'plan_123',
        idempotencyKey: 'preflight-1',
        draftEtag: '"draft:v2"',
        checkedAt: '2026-04-28T12:02:00.000Z',
        report: {
          summary: 'Ready for preflight.',
          planHash: 'plan_123',
          readyForGenesis: true,
          checks: [],
        },
      },
      genesisJob: {
        jobId: 'job_1',
        status: 'failed',
        phase: 'failed',
        percent: 100,
        message: 'Genesis failed',
        result: null,
        error: {
          type: 'https://example.test/problems/bootstrap-genesis-failed',
          title: 'Genesis failed',
          status: 500,
          detail: 'Watcher bridge rejected the genesis request.',
          instance: '/api/v1/bootstrap/jobs/job_1',
          code: 'BOOTSTRAP_GENESIS_FAILED',
        },
        reportId: 'report_123',
        planHash: 'plan_123',
        createdAt: '2026-04-28T12:02:00.000Z',
        updatedAt: '2026-04-28T12:02:01.000Z',
        completedAt: '2026-04-28T12:02:01.000Z',
      },
      required: false,
      locked: false,
      reason: 'root-user-exists',
    });

    await React.act(async () => {
      render(<GenesisComponent />);
      await Promise.resolve();
    });

    expect(screen.getByText(/genesis failed/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /retry genesis/i })).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalledWith({ to: '/' });
  });
});
