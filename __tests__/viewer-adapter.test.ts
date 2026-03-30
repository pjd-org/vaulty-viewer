import { describe, expect, it } from 'vitest'

import {
  buildHomeSurfacePayload,
  buildActionsSurfacePayload,
  buildInboxSurfacePayload,
  buildProjectSurfacePayload,
  getHomeSurfaceQueryOptions,
  getInboxSurfaceQueryOptions,
  getActionsSurfaceQueryOptions,
  getProjectSurfaceQueryOptions,
} from '../app/lib/viewer-adapter'
import type { NextAction } from '../src/lib/focus-logic'
import type { InboxNote } from '../src/lib/inbox-logic'

const sampleTasks: NextAction[] = [
  {
    id: 'task-1',
    path: 'notes/tasks/task-1.md',
    title: 'Unblock deploy pipeline',
    score: 8.6,
    priority: 9,
    effortScore: 6,
    focusCost: 4,
    estimatedTimeMin: 35,
    status: 'blocked',
    tags: ['deploy'],
    projectId: 'rent-stability-pantin',
    description: 'Restore the failing pipeline so the release path is usable again.',
    blockers: [{ id: 'blocked-by-ci' }],
  },
  {
    id: 'task-2',
    path: 'notes/tasks/task-2.md',
    title: 'Polish project shell',
    score: 6.1,
    priority: 7,
    effortScore: 4,
    focusCost: 3,
    estimatedTimeMin: 50,
    status: 'todo',
    tags: ['ui'],
    projectId: 'rent-stability-pantin',
    description: 'Tighten shell polish after the routing cutover.',
    blockers: [],
  },
]

describe('viewer adapter builders', () => {
  it('builds action recommendations with explanation metadata', () => {
    const payload = buildActionsSurfacePayload(sampleTasks)

    expect(payload.recommendations).toHaveLength(2)
    expect(payload.recommendations[0].title).toBe('Unblock deploy pipeline')
    expect(payload.recommendations[0].whyNow).toContain('Resolving this item')
    expect(payload.recommendations[0].scoreBreakdown.impact).toBeGreaterThan(0)
  })

  it('keeps user and automated rejections separated', () => {
    const archiveNotes: InboxNote[] = [
      {
        path: 'inbox/rejected/user.md',
        title: 'Human rejected proposal',
        status: 'rejected',
        tags: [],
        source: 'rejected',
        frontmatter: {
          rejection_source: 'user',
          rejection_reason: 'No longer needed',
        },
      },
      {
        path: 'inbox/rejected/automated.md',
        title: 'Policy rejected proposal',
        status: 'rejected',
        tags: [],
        source: 'rejected',
        frontmatter: {
          rejection_source: 'automated-policy',
        },
      },
    ]

    const payload = buildInboxSurfacePayload({
      runs: [],
      workbenchNotes: [],
      archiveNotes,
    })

    const userRejected = payload.find((item) => item.rejectionType === 'user')
    const automatedRejected = payload.find(
      (item) => item.rejectionType === 'automated',
    )

    expect(userRejected?.inboxBucket).toBe('rejected_user')
    expect(automatedRejected?.inboxBucket).toBe('rejected_automated')
  })

  it('builds a project-scoped surface from project tasks', () => {
    const payload = buildProjectSurfacePayload({
      projectId: 'rent-stability-pantin',
      tasks: sampleTasks,
    })

    expect(payload.projectId).toBe('rent-stability-pantin')
    expect(payload.pressureBand[0]?.kind).toBe('blocker')
    expect(payload.contextPanel.every((item) => item.projectId === 'rent-stability-pantin')).toBe(true)
  })

  it('builds a pressure-first home surface from the ranked task queue', () => {
    const payload = buildHomeSurfacePayload(sampleTasks)

    expect(payload.pressureBand[0]?.kind).toBe('blocker')
    expect(payload.decisionQueue[0]?.title).toBe('Unblock deploy pipeline')
    expect(payload.immediateActions.every((item) => item.reversibility === 'high')).toBe(
      true,
    )
  })

  it('exposes stable query keys for preloading adapter surfaces', () => {
    expect(getHomeSurfaceQueryOptions().queryKey).toEqual([
      'viewer-adapter',
      'home-surface',
    ])
    expect(getInboxSurfaceQueryOptions().queryKey).toEqual([
      'viewer-adapter',
      'inbox-surface',
    ])
    expect(getActionsSurfaceQueryOptions().queryKey).toEqual([
      'viewer-adapter',
      'actions-surface',
    ])
    expect(
      getProjectSurfaceQueryOptions('rent-stability-pantin').queryKey,
    ).toEqual(['viewer-adapter', 'project-surface', 'rent-stability-pantin'])
  })
})
