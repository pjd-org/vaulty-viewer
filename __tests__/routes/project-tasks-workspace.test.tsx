import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockRouteState = vi.hoisted(() => ({
  params: { slug: 'rent-stability-pantin' },
  search: {
    selectedId: 'task-2' as string | undefined,
    tab: undefined as string | undefined,
    noteId: undefined as string | undefined,
    mode: undefined as 'read' | 'edit' | undefined,
    templateId: undefined as string | undefined,
    memoryTab: undefined as string | undefined,
  },
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useParams: () => mockRouteState.params,
    useSearch: () => mockRouteState.search,
  }),
  Link: ({
    to,
    params,
    search,
    className,
    children,
    ...props
  }: {
    to?: string
    params?: Record<string, unknown>
    search?: Record<string, unknown>
    className?: string
    children?: React.ReactNode
  }) => (
    <a
      data-link-to={to}
      data-link-params={params ? JSON.stringify(params) : ''}
      data-link-search={search ? JSON.stringify(search) : ''}
      className={className}
      {...props}
    >
      {children}
    </a>
  ),
}))

import { Route } from '../../app/routes/project.$slug.tasks'

const RouteComponent = Route.options.component as React.ComponentType

describe('project tasks lane', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    mockRouteState.params = { slug: 'rent-stability-pantin' }
    mockRouteState.search = {
      selectedId: 'task-2',
      tab: undefined,
      noteId: undefined,
      mode: undefined,
      templateId: undefined,
      memoryTab: undefined,
    }
  })

  it('renders a selectable project task queue and selected task detail', () => {
    const qc = new QueryClient()
    qc.setQueryData(['tasks'], [
      {
        id: 'task-1',
        title: 'Prep dossier',
        status: 'todo',
        priority: 8,
        estimatedTimeMin: 30,
        tags: ['docs'],
        projectId: 'rent-stability-pantin',
        completedAt: null,
        createdAt: null,
        cmsSlug: 'task-1',
        link: '/note?p=task-1',
      },
      {
        id: 'task-2',
        title: 'Book viewing',
        status: 'in-progress',
        priority: 9,
        estimatedTimeMin: 45,
        tags: ['site-visit'],
        projectId: 'rent-stability-pantin',
        completedAt: null,
        createdAt: null,
        cmsSlug: 'task-2',
        link: '/note?p=task-2',
      },
      {
        id: 'task-3',
        title: 'Resolve blocker',
        status: 'blocked',
        priority: 10,
        estimatedTimeMin: 15,
        tags: ['urgent'],
        projectId: 'rent-stability-pantin',
        completedAt: null,
        createdAt: null,
        cmsSlug: 'task-3',
        link: '/note?p=task-3',
      },
    ])

    render(
      <QueryClientProvider client={qc}>
        <RouteComponent />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Task Queue')).toBeTruthy()
    expect(screen.getByText('Selected Task')).toBeTruthy()
    expect(screen.getByText('Blockers')).toBeTruthy()

    const selectedPanel = screen.getByRole('heading', { name: 'Selected Task' }).closest('section')
    expect(selectedPanel).not.toBeNull()
    expect(within(selectedPanel as HTMLElement).getByRole('heading', { name: 'Book viewing' })).toBeTruthy()
    expect(within(selectedPanel as HTMLElement).getByRole('link', { name: 'Open task note' })).toBeTruthy()

    const blockerPanel = screen.getByRole('heading', { name: 'Blockers' }).closest('section')
    expect(blockerPanel).not.toBeNull()
    expect(within(blockerPanel as HTMLElement).getByText('Resolve blocker')).toBeTruthy()
  })
})
