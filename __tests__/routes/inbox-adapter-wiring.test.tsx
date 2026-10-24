import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

const mockRouteState = vi.hoisted(() => ({
  search: {
    view: 'archive' as 'signals' | 'queue' | 'workbench' | 'archive' | undefined,
    rejectedTab: undefined as 'user' | 'automated' | undefined,
    selectedId: undefined as string | undefined,
    severity: undefined as 'high' | 'medium' | 'low' | undefined,
  },
}));

const mockNavigate = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());
const mockCommitRun = vi.hoisted(() => vi.fn());
const mockRejectRun = vi.hoisted(() => vi.fn());
const mockUseInbox = vi.hoisted(() => vi.fn());
const mockOpenModal = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mockRouteState.search,
  }),
  useNavigate: () => mockNavigate,
}));

vi.mock('react-easy-modals', () => ({
  useModals: () => ({
    open: mockOpenModal,
    stack: [],
  }),
}));

vi.mock('../../src/hooks/useInbox', () => ({
  useInbox: () => mockUseInbox(),
}));

// buildInboxSurfacePayload is called client-side now (no separate query)
const mockBuildInboxSurfacePayload = vi.hoisted(() => vi.fn());

vi.mock('../../app/lib/viewer-adapter', () => ({
  buildInboxSurfacePayload: (...args: unknown[]) =>
    mockBuildInboxSurfacePayload(...args),
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({
    title,
    subtitle,
    actions,
    primary,
    aside,
    primaryTitle,
    asideTitle,
  }: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    primary: React.ReactNode;
    aside: React.ReactNode;
    primaryTitle: string;
    asideTitle: string;
  }) => (
    <section>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      <div data-testid="inbox-toolbar">{actions}</div>
      <div data-testid="inbox-primary">
        <h2>{primaryTitle}</h2>
        {primary}
      </div>
      <aside data-testid="inbox-aside">
        <h2>{asideTitle}</h2>
        {aside}
      </aside>
    </section>
  ),
}));

vi.mock('../../app/components/inbox/InboxItemCard', () => ({
  InboxItemCard: ({
    item,
    isExpanded,
    onToggle,
    onInspect,
    onPromote,
    onReject,
    detail,
  }: {
    item: { title: string; originLabel: string; isBlocked: boolean };
    isExpanded?: boolean;
    onToggle?: () => void;
    onInspect: () => void;
    onPromote?: () => void;
    onReject?: () => void;
    detail?: { summary?: string };
  }) => (
    <article>
      <span>{item.title}</span>
      <span>{item.originLabel}</span>
      {item.isBlocked && <span>Blocked</span>}
      <button type="button" onClick={onToggle ?? onInspect}>
        {`Inspect ${item.title}`}
      </button>
      {isExpanded && detail?.summary ? (
        <div data-testid="inline-detail">{detail.summary}</div>
      ) : null}
      {onPromote ? (
        <button type="button" onClick={onPromote}>
          {`Promote ${item.title}`}
        </button>
      ) : null}
      {onReject ? (
        <button type="button" onClick={onReject}>
          {`Reject ${item.title}`}
        </button>
      ) : null}
    </article>
  ),
}));

vi.mock('../../app/components/inbox/InboxViewSwitcher', () => ({
  InboxViewSwitcher: ({
    counts,
  }: {
    counts: { queue: number; workbench: number; archive: number };
  }) => (
    <div>
      <span>{`Queue (${counts.queue})`}</span>
      <span>{`Workbench (${counts.workbench})`}</span>
      <span>{`Archive (${counts.archive})`}</span>
    </div>
  ),
}));

vi.mock('../../app/components/ui', async () => {
  const actual = await vi.importActual<typeof import('../../app/components/ui')>(
    '../../app/components/ui'
  );

  return {
    ...actual,
    EmptyState: ({
      title,
      description,
    }: {
      title: string;
      description?: string;
    }) => (
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    ),
  };
});

vi.mock('../../app/lib/display', () => ({
  toInboxItemDisplay: ({
    title,
    _run_id,
    description,
    status,
  }: {
    title?: string;
    _run_id?: string;
    description?: string;
    status?: string;
  }) => ({
    title: title ?? 'Untitled',
    originLabel: 'Mock',
    isBlocked: status === 'blocked',
    ageLabel: null,
    contextSnippet: description ?? null,
    actions: _run_id ? ['promote'] : [],
  }),
}));

vi.mock('../../app/lib/queries/agents', () => ({
  useInboxConverterMutation: () => ({
    mutate: vi.fn(),
    data: null,
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

import { Route } from '../../app/routes/inbox';

const RouteComponent = Route.options.component as React.ComponentType;

beforeEach(async () => {
  await (RouteComponent as { preload?: () => Promise<void> }).preload?.();
});

describe('inbox adapter wiring', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockRouteState.search = {
      view: 'archive',
      rejectedTab: undefined,
      selectedId: undefined,
      severity: undefined,
    };
    mockRejectRun.mockReset();
    mockOpenModal.mockReset();
    mockUseInbox.mockReturnValue({
      signals: [],
      runs: [
        {
          runId: 'run-1',
          runType: 'extract',
          action: 'Proposal run',
          itemCount: 1,
          confidence: 0.7,
          items: [],
        },
      ],
      workbenchNotes: [
        {
          path: 'inbox/extracted/workbench-note.md',
          title: 'Workbench note',
          tags: [],
          source: 'extracted',
        },
      ],
      archiveNotes: [
        {
          path: 'inbox/rejected/human-rejected-proposal.md',
          title: 'Human rejected proposal',
          tags: [],
          source: 'rejected',
          frontmatter: { rejection_source: 'user' },
        },
        {
          path: 'inbox/rejected/automated-proposal.md',
          title: 'Policy rejected proposal',
          tags: [],
          source: 'rejected',
          frontmatter: {
            rejection_source: 'automated-policy',
            rejection_reason: 'Policy threshold not met.',
          },
        },
      ],
      counts: { queue: 1, workbench: 1, archive: 2 },
      loading: false,
      error: null,
      apiStatus: 'online',
      refresh: mockRefresh,
      commitRun: mockCommitRun,
      rejectRun: mockRejectRun,
      actionState: {},
      pendingConfirmations: {},
    });

    // buildInboxSurfacePayload produces adapter InboxItems from raw data
    mockBuildInboxSurfacePayload.mockImplementation(() => [
      {
        id: 'signal:run-1',
        title: 'Proposal run',
        summary: '1 staged item(s) awaiting review.',
        kind: 'rejection',
        severity: 'medium',
        surfacedBy: 'cod',
        sourceType: 'note',
        sourceId: 'run-1',
        surfacedAt: new Date(0).toISOString(),
        whySurfaced: 'Needs review.',
        reversibility: 'high',
        allowedActions: [{ actionType: 'approve', label: 'Approve' }],
        inboxBucket: 'needs_action',
      },
      {
        id: 'signal:inbox/extracted/workbench-note.md',
        title: 'Workbench note',
        summary: 'inbox/extracted/workbench-note.md',
        kind: 'stale',
        severity: 'low',
        surfacedBy: 'cod',
        sourceType: 'note',
        sourceId: 'inbox/extracted/workbench-note.md',
        surfacedAt: new Date(0).toISOString(),
        whySurfaced: 'Context remains pending.',
        reversibility: 'high',
        allowedActions: [{ actionType: 'open_source', label: 'Open note' }],
        inboxBucket: 'deferred',
      },
      {
        id: 'signal:inbox/rejected/human-rejected-proposal.md',
        title: 'Human rejected proposal',
        summary: 'inbox/rejected/human-rejected-proposal.md',
        kind: 'rejection',
        severity: 'medium',
        surfacedBy: 'cod',
        sourceType: 'note',
        sourceId: 'inbox/rejected/human-rejected-proposal.md',
        surfacedAt: new Date(0).toISOString(),
        whySurfaced: 'Human rejection stays visible.',
        reversibility: 'medium',
        allowedActions: [{ actionType: 'reopen', label: 'Reopen' }],
        inboxBucket: 'rejected_user',
        rejectionType: 'user',
      },
      {
        id: 'signal:inbox/rejected/automated-proposal.md',
        title: 'Policy rejected proposal',
        summary: 'inbox/rejected/automated-proposal.md',
        kind: 'rejection',
        severity: 'high',
        surfacedBy: 'cod',
        sourceType: 'note',
        sourceId: 'inbox/rejected/automated-proposal.md',
        surfacedAt: new Date(0).toISOString(),
        whySurfaced: 'Automated rejection stays visible separately.',
        reversibility: 'high',
        allowedActions: [{ actionType: 'override', label: 'Override' }],
        inboxBucket: 'rejected_automated',
        rejectionType: 'automated',
        rejectionReason: 'Policy threshold not met.',
        rejectionSource: 'automated-policy',
      },
    ]);
  });
  it('renders runtime severity without manual or Blocked labels and preserves inspect evidence', () => {
    mockRouteState.search.view = 'signals';
    const runtimeItem = {
      id: 'signal:scheduler-job-nightly',
      title: 'Nightly failed',
      summary: 'Runner failure',
      kind: 'failure',
      severity: 'high',
      surfacedBy: 'runtime',
      sourceType: 'schedule',
      sourceId: 'vault:scheduler',
      surfacedAt: '2026-10-24T03:00:00.000Z',
      whySurfaced: 'Runner failure',
      allowedActions: [{ actionType: 'open_source', label: 'Inspect' }],
      inboxBucket: 'failure',
      runtimeSignal: true,
      jobId: 'nightly',
      pipelineId: null,
      runId: 'run-9',
      trigger: 'schedule',
      status: 'failed',
      failedAt: null,
      observedAt: '2026-10-24T03:00:00.000Z',
      error: 'Runner unavailable',
      errors: ['No runner connected'],
    };
    mockBuildInboxSurfacePayload.mockReturnValue([runtimeItem]);
    render(<RouteComponent />);
    const card = screen.getByText('Nightly failed').closest('article')!;
    expect(within(card).queryByText(/^manual$/i)).toBeNull();
    expect(within(card).queryByText('Blocked')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Inspect Nightly failed' }));
    expect(mockOpenModal.mock.calls.at(-1)?.[1].detail).toMatchObject({
      jobId: 'nightly', pipelineId: null, runId: 'run-9',
      trigger: 'schedule', status: 'failed', failedAt: null,
      observedAt: runtimeItem.observedAt, error: runtimeItem.error, errors: runtimeItem.errors,
    });
    expect(mockCommitRun).not.toHaveBeenCalled();
  });

  it('rebuilds runtime signals when only the refreshed signals change', () => {
    mockRouteState.search.view = 'signals';
    mockBuildInboxSurfacePayload.mockImplementation(({ signals }) => signals);
    const query = mockUseInbox();
    mockUseInbox.mockReturnValue({ ...query, signals: [] });
    const { rerender } = render(<RouteComponent />);
    mockUseInbox.mockReturnValue({
      ...query,
      signals: [{
        id: 'signal:new', title: 'New runtime failure', runtimeSignal: true,
        severity: 'high', status: 'failed', sourceId: 'vault:scheduler',
        surfacedAt: '2026-10-24T03:00:00.000Z', allowedActions: [],
      }],
    });
    rerender(<RouteComponent />);
    expect(screen.getByText('New runtime failure')).toBeTruthy();
  });


  it('renders archive content and counts from the adapter surface', () => {
    render(<RouteComponent />);

    expect(screen.getByText('Queue (1)')).toBeTruthy();
    expect(screen.getByText('Workbench (1)')).toBeTruthy();
    expect(screen.getByText('Archive (2)')).toBeTruthy();
    expect(screen.getByText('Human rejected proposal')).toBeTruthy();
    expect(screen.getByText('Policy rejected proposal')).toBeTruthy();
    expect(screen.queryByText('No rejected notes')).toBeNull();
  });

  it('renders both archive rejection types in the archive view', () => {
    mockRouteState.search = {
      view: 'archive',
      rejectedTab: 'user',
      selectedId: undefined,
      severity: undefined,
    };

    render(<RouteComponent />);

    expect(screen.getByText('Human rejected proposal')).toBeTruthy();
    expect(screen.getByText('Policy rejected proposal')).toBeTruthy();
  });

  it('does not expose reject for queue items; Reject is disabled at the boundary', () => {
    mockRouteState.search = {
      view: 'queue',
      rejectedTab: undefined,
      selectedId: undefined,
      severity: undefined,
    };

    render(<RouteComponent />);

    expect(screen.queryByRole('button', { name: 'Reject Proposal run' })).toBeNull();
    expect(mockRejectRun).not.toHaveBeenCalled();
  });

  it('uses WorkspaceScaffold with a right-rail aside panel', () => {
    render(<RouteComponent />);
    // WorkspaceScaffold mock renders data-testid="inbox-aside"
    expect(screen.getByTestId('inbox-aside')).toBeTruthy();
    expect(screen.getByTestId('inbox-primary')).toBeTruthy();
  });

  it('Inspect wires selectedId into the URL', () => {
    mockRouteState.search = {
      view: 'queue',
      rejectedTab: undefined,
      selectedId: undefined,
      severity: undefined,
    };
    render(<RouteComponent />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Inspect Proposal run' })
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.objectContaining({ selectedId: 'signal:run-1' }),
      })
    );
  });

  it('keeps the inline detail collapsed when selectedId matches a queue item', () => {
    mockRouteState.search = {
      view: 'queue',
      rejectedTab: undefined,
      selectedId: 'signal:run-1',
      severity: undefined,
    };
    render(<RouteComponent />);
    const primary = screen.getByTestId('inbox-primary');
    expect(primary).toBeTruthy();
    expect(within(primary).queryByTestId('inline-detail')).toBeNull();
  });
});
