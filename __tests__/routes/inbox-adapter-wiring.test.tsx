import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRouteState = vi.hoisted(() => ({
  search: { view: 'archive' as 'queue' | 'workbench' | 'archive' | undefined },
}))

const mockNavigate = vi.hoisted(() => vi.fn())
const mockEnsureQueryData = vi.hoisted(() => vi.fn())
const mockRefresh = vi.hoisted(() => vi.fn())
const mockCommitRun = vi.hoisted(() => vi.fn())
const mockRejectRun = vi.hoisted(() => vi.fn())
const mockUseInbox = vi.hoisted(() => vi.fn())
const mockUseInboxSurface = vi.hoisted(() => vi.fn())
const mockInboxSurfaceQueryOptions = vi.hoisted(() => ({
  queryKey: ['viewer-adapter', 'inbox-surface'],
  queryFn: vi.fn(),
}))
const mockGetInboxSurfaceQueryOptions = vi.hoisted(() =>
  vi.fn(() => mockInboxSurfaceQueryOptions),
)

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mockRouteState.search,
  }),
  useNavigate: () => mockNavigate,
}))

vi.mock('../../src/hooks/useInbox', () => ({
  useInbox: () => mockUseInbox(),
}))

vi.mock('../../app/lib/viewer-adapter', () => ({
  getInboxSurfaceQueryOptions: () => mockGetInboxSurfaceQueryOptions(),
  useInboxSurface: () => mockUseInboxSurface(),
}))

vi.mock('../../app/components/layout', () => ({
  PageFrame: ({
    title,
    subtitle,
    actions,
    children,
  }: {
    title: string
    subtitle?: string
    actions?: React.ReactNode
    children: React.ReactNode
  }) => (
    <section>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
      {children}
    </section>
  ),
}))

vi.mock('../../app/components/inbox/InboxItemCard', () => ({
  InboxItemCard: ({
    item,
    onInspect,
    onPromote,
    onReject,
  }: {
    item: { title: string }
    onInspect: () => void
    onPromote?: () => void
    onReject?: () => void
  }) => (
    <article>
      <span>{item.title}</span>
      <button type="button" onClick={onInspect}>
        {`Inspect ${item.title}`}
      </button>
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
}))

vi.mock('../../app/components/inbox/InboxViewSwitcher', () => ({
  InboxViewSwitcher: ({
    counts,
  }: {
    counts: { queue: number; workbench: number; archive: number }
  }) => (
    <div>
      <span>{`Queue (${counts.queue})`}</span>
      <span>{`Workbench (${counts.workbench})`}</span>
      <span>{`Archive (${counts.archive})`}</span>
    </div>
  ),
}))

vi.mock('../../app/components/ui', () => ({
  EmptyState: ({
    title,
    description,
  }: {
    title: string
    description?: string
  }) => (
    <div>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  ),
}))

vi.mock('../../app/lib/display', () => ({
  toInboxItemDisplay: ({
    title,
    _run_id,
    description,
    status,
  }: {
    title?: string
    _run_id?: string
    description?: string
    status?: string
  }) => ({
    title: title ?? 'Untitled',
    originLabel: 'Mock',
    isBlocked: status === 'blocked',
    ageLabel: null,
    contextSnippet: description ?? null,
    actions: _run_id ? ['promote'] : [],
  }),
}))

vi.mock('../../app/lib/queries/agents', () => ({
  useInboxConverterMutation: () => ({
    mutate: vi.fn(),
    data: null,
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}))

import { Route } from '../../app/routes/inbox'

const RouteComponent = Route.options.component as React.ComponentType

describe('inbox adapter wiring', () => {
  beforeEach(() => {
    mockRouteState.search = { view: 'archive' }
    mockEnsureQueryData.mockReset()
    mockGetInboxSurfaceQueryOptions.mockClear()
    mockRejectRun.mockReset()
    mockUseInbox.mockReturnValue({
      runs: [],
      workbenchNotes: [],
      archiveNotes: [],
      counts: { queue: 0, workbench: 0, archive: 0 },
      loading: false,
      error: null,
      apiStatus: 'online',
      refresh: mockRefresh,
      commitRun: mockCommitRun,
      rejectRun: mockRejectRun,
      actionState: {},
      pendingConfirmations: {},
    })
    mockUseInboxSurface.mockReturnValue({
      data: [
        {
          id: 'signal:run-1',
          title: 'Proposal run',
          summary: '1 staged item awaiting review.',
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
          id: 'signal:workbench-note',
          title: 'Workbench note',
          summary: 'Workbench note path',
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
          id: 'signal:archive-note',
          title: 'Human rejected proposal',
          summary: 'Rejected note path',
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
      ],
      isLoading: false,
      error: null,
    })
  })

  it('preloads the inbox adapter surface in the route loader', async () => {
    expect(typeof Route.options.loader).toBe('function')

    await Route.options.loader?.({
      context: {
        queryClient: {
          ensureQueryData: mockEnsureQueryData,
        },
      },
    } as never)

    expect(mockEnsureQueryData).toHaveBeenCalledWith(
      mockInboxSurfaceQueryOptions,
    )
  })

  it('renders archive content and counts from the adapter surface', () => {
    render(<RouteComponent />)

    expect(screen.getByText('Queue (1)')).toBeTruthy()
    expect(screen.getByText('Workbench (1)')).toBeTruthy()
    expect(screen.getByText('Archive (1)')).toBeTruthy()
    expect(screen.getByText('Human rejected proposal')).toBeTruthy()
    expect(screen.queryByText('No rejected notes')).toBeNull()
  })

  it('keeps reject wired for queue items when the matching run is missing', () => {
    mockRouteState.search = { view: 'queue' }

    render(<RouteComponent />)

    fireEvent.click(screen.getByRole('button', { name: 'Reject Proposal run' }))

    expect(mockRejectRun).toHaveBeenCalledWith('run-1')
  })
})
