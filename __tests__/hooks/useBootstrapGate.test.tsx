import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetBootstrapStatus = vi.hoisted(() => vi.fn());

vi.mock('../../src/lib/bootstrap', () => ({
  getBootstrapStatus: mockGetBootstrapStatus,
}));

import { useBootstrapGate } from '../../src/hooks/useBootstrapGate';

describe('useBootstrapGate', () => {
  beforeEach(() => {
    mockGetBootstrapStatus.mockReset();
  });

  it('redirects onboarding to bootstrap when bootstrap is required', async () => {
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

    const { result } = renderHook(() => useBootstrapGate('/onboarding/profile'));

    await waitFor(() => {
      expect(result.current.redirectTo).toBe('/bootstrap');
    });
  });

  it('allows login when bootstrap is locked', async () => {
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
      required: false,
      locked: true,
      reason: 'root-user-exists',
    });

    const { result } = renderHook(() => useBootstrapGate('/login'));

    await waitFor(() => {
      expect(result.current.redirectTo).toBeNull();
    });
  });

  it('prefers nextRoute over legacy flags', async () => {
    mockGetBootstrapStatus.mockResolvedValue({
      state: 'active',
      phase: 'active',
      nextRoute: '/onboarding/welcome',
      lock: { active: true, reason: 'root user exists', scope: 'all' },
      compat: {
        required: false,
        locked: true,
        reason: 'root-user-exists',
      },
      rootUser: { exists: true },
      draft: null,
      required: false,
      locked: true,
      reason: 'root-user-exists',
    });

    const { result } = renderHook(() => useBootstrapGate('/onboarding/profile'));

    await waitFor(() => {
      expect(result.current.redirectTo).toBe('/onboarding/welcome');
    });
  });
});
