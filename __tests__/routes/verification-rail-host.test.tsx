/**
 * verification-rail-host.test.tsx
 *
 * Verifies that VerificationRailHost renders outcome cards from the home
 * adapter surface, not just the raw phase text stub.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockUseHomeSurface = vi.hoisted(() => vi.fn());
const mockVerification = vi.hoisted(() => ({
  visible: true,
  phase: 'idle' as 'idle' | 'pending' | 'resolved' | 'failed',
  pinned: false,
  latestId: null as string | null,
}));

vi.mock('../../app/lib/viewer-adapter', () => ({
  useHomeSurface: () => mockUseHomeSurface(),
}));

vi.mock('../../src/store/ui', () => ({
  useUIStore: (selector: (s: unknown) => unknown) =>
    selector({ verification: mockVerification }),
}));

// ---------------------------------------------------------------------------
// Import component under test AFTER mocks
// ---------------------------------------------------------------------------

import { VerificationRailHost } from '../../app/components/layout/VerificationRailHost';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VerificationRailHost', () => {
  beforeEach(() => {
    mockVerification.visible = true;
    mockVerification.phase = 'idle';
    mockVerification.pinned = false;
    mockVerification.latestId = null;
    mockUseHomeSurface.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('returns null when verification is not visible', () => {
    mockVerification.visible = false;
    const { container } = renderWithClient(<VerificationRailHost />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the verification rail header', () => {
    renderWithClient(<VerificationRailHost />);
    expect(screen.getByText('Verification Rail')).toBeTruthy();
  });

  it('shows pending indicator when phase is pending', () => {
    mockVerification.phase = 'pending';
    renderWithClient(<VerificationRailHost />);
    expect(screen.getByText('Verifying…')).toBeTruthy();
  });

  it('shows failed indicator when phase is failed', () => {
    mockVerification.phase = 'failed';
    renderWithClient(<VerificationRailHost />);
    expect(screen.getByText('Verification failed.')).toBeTruthy();
  });

  it('renders outcome cards from the home surface', () => {
    mockUseHomeSurface.mockReturnValue({
      data: {
        verificationRail: [
          {
            id: 'v-1',
            actionId: 'action-1',
            startedAt: '2026-04-01T10:00:00.000Z',
            resolvedAt: '2026-04-01T10:01:00.000Z',
            status: 'success',
            improved: true,
            followUpNeeded: false,
            summary: 'Task promoted to in-progress.',
          },
          {
            id: 'v-2',
            actionId: 'action-2',
            startedAt: '2026-04-01T10:02:00.000Z',
            status: 'warning',
            improved: false,
            followUpNeeded: true,
            summary: 'Action completed with caveats.',
          },
        ],
      },
      isLoading: false,
      error: null,
    });
    renderWithClient(<VerificationRailHost />);
    expect(screen.getByText('Task promoted to in-progress.')).toBeTruthy();
    expect(screen.getByText('Action completed with caveats.')).toBeTruthy();
  });

  it('shows follow-up badge when followUpNeeded is true', () => {
    mockUseHomeSurface.mockReturnValue({
      data: {
        verificationRail: [
          {
            id: 'v-3',
            actionId: 'action-3',
            startedAt: '2026-04-01T10:00:00.000Z',
            status: 'warning',
            improved: false,
            followUpNeeded: true,
            summary: 'Needs follow-up.',
          },
        ],
      },
      isLoading: false,
      error: null,
    });
    renderWithClient(<VerificationRailHost />);
    expect(screen.getByText('Follow-up needed')).toBeTruthy();
  });

  it('renders empty state when no outcomes and not pending', () => {
    renderWithClient(<VerificationRailHost />);
    expect(
      screen.getByText('Operational verification will surface here.')
    ).toBeTruthy();
  });
});
