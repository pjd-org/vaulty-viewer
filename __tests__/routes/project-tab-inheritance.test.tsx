import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

import type { ProjectSurfacePayload } from '../../app/lib/viewer-adapter'

const mockRouterState = vi.hoisted(() => ({
  pathname: '/project/rent-stability-pantin/tasks',
  search: {
    tab: 'tasks' as string | undefined,
    selectedId: 'task-2' as string | undefined,
    noteId: undefined as string | undefined,
    mode: undefined as 'read' | 'edit' | undefined,
    templateId: undefined as string | undefined,
    memoryTab: undefined as string | undefined,
  },
}))

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
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
  }) => {
    const resolvedTo =
      to &&
      params
        ? Object.entries(params).reduce((acc, [key, value]) => acc.replace(`$${key}`, String(value)), to)
        : to ?? '#'
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(search ?? {})) {
      if (value === undefined || value === null) continue
      query.set(key, String(value))
    }
    const href = `${resolvedTo}${query.toString() ? `?${query.toString()}` : ''}`

    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    )
  },
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string; search: Record<string, unknown> } }) => unknown
  }) => select({ location: { pathname: mockRouterState.pathname, search: mockRouterState.search } }),
}))

import { ProjectRouteShell } from '../../app/components/layout'
import { ProjectTabPlaceholder } from '../../app/components/projects'

const projectSurface: ProjectSurfacePayload = {
  projectId: 'rent-stability-pantin',
  pressureBand: [
    {
      id: 'pressure-1',
      kind: 'blocker',
      title: 'Lease docs missing',
      summary: 'The project still needs a final document scan.',
      severity: 'high',
      surfacedBy: 'cod',
      sourceType: 'task',
      sourceId: 'task-1',
      surfacedAt: '2026-03-30T23:00:00.000Z',
      whySurfaced: 'The tab shell should surface the same live project pressures.',
      confidence: 0.91,
      reversibility: 'high',
      allowedActions: [{ actionType: 'create_task', label: 'Create task' }],
    },
  ],
  decisionQueue: [
    {
      id: 'decision-1',
      title: 'Finalize dossier',
      summary: 'Close the current project dossier.',
      actionType: 'create_task',
      surfacedBy: 'cod',
      sourceSignalIds: ['pressure-1'],
      sourceEntities: [{ id: 'task-1', type: 'task', title: 'Lease docs' }],
      projectId: 'rent-stability-pantin',
      score: 9,
      scoreBreakdown: {
        urgency: 9,
        impact: 8,
        blockageRemoval: 10,
        reversibility: 6,
        confidence: 9,
      },
      whyNow: 'It unblocks the next move.',
      expectedEffect: 'Dossier is ready.',
      confidence: 0.9,
      reversibility: 'high',
    },
  ],
  immediateActions: [
    {
      id: 'decision-1',
      title: 'Finalize dossier',
      summary: 'Close the current project dossier.',
      actionType: 'create_task',
      surfacedBy: 'cod',
      sourceSignalIds: ['pressure-1'],
      sourceEntities: [{ id: 'task-1', type: 'task', title: 'Lease docs' }],
      projectId: 'rent-stability-pantin',
      score: 9,
      scoreBreakdown: {
        urgency: 9,
        impact: 8,
        blockageRemoval: 10,
        reversibility: 6,
        confidence: 9,
      },
      whyNow: 'It unblocks the next move.',
      expectedEffect: 'Dossier is ready.',
      confidence: 0.9,
      reversibility: 'high',
    },
  ],
  verificationRail: [
    {
      id: 'verification-1',
      actionId: 'decision-1',
      startedAt: '2026-03-30T23:01:00.000Z',
      resolvedAt: '2026-03-30T23:02:00.000Z',
      status: 'success',
      improved: true,
      followUpNeeded: false,
      summary: 'Context inherited successfully.',
    },
  ],
  executionSnapshot: {
    activeTasks: [{ id: 'task-1', type: 'task', title: 'Lease docs' }],
    activePipelines: [{ id: 'pipeline-1', type: 'pipeline', title: 'Release pipeline' }],
    activeRunners: [{ id: 'runner-1', type: 'runner', title: 'Primary runner' }],
    primaryAgentJobs: [{ id: 'job-1', type: 'primary_agent_job', title: 'Queued job' }],
    scheduleItems: [{ id: 'schedule-1', type: 'schedule', title: 'Daily sync' }],
  },
  contextPanel: [
    {
      id: 'context-1',
      contextType: 'note',
      title: 'Project brief',
      summary: 'One shared shell context for all nested tabs.',
      sourceId: 'note-1',
      projectId: 'rent-stability-pantin',
      reasonSelected: 'Helpful shell context',
      linkedEntities: [],
    },
  ],
  timelineHints: [],
  dependencyRiskSignals: [],
}

describe('project tab inheritance', () => {
  beforeEach(() => {
    mockRouterState.pathname = '/project/rent-stability-pantin/tasks'
    mockRouterState.search = {
      tab: 'tasks',
      selectedId: 'task-2',
      noteId: undefined,
      mode: undefined,
      templateId: undefined,
      memoryTab: undefined,
    }
  })

  afterEach(() => {
    cleanup()
  })

  it('shares project shell context with nested tabs', () => {
    render(
      <ProjectRouteShell
        slug="rent-stability-pantin"
        summaryItems={[
          { label: 'Scope', value: 'rent-stability-pantin' },
          { label: 'Pressure', value: '1' },
        ]}
        projectSurface={projectSurface}
      >
        <ProjectTabPlaceholder
          title="Project Tasks"
          description="Task queues, active work, and blockers for this project will render here."
        />
      </ProjectRouteShell>,
    )

    expect(screen.getByText('Project Tasks')).toBeTruthy()
    const contextBlock = screen.getByTestId('project-shell-context')
    expect(contextBlock.textContent).toContain('Inherited project shell')
    expect(contextBlock.textContent).toContain('Project: rent-stability-pantin')
    expect(contextBlock.textContent).toContain('1 pressure signal')
    expect(contextBlock.textContent).toContain('1 decision')
    expect(contextBlock.textContent).toContain('1 verification item')
  })
})
