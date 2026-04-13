import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, it, expect, vi } from 'vitest';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  );

  return {
    ...actual,
    Link: ({
      to,
      params,
      search,
      className,
      children,
      ...props
    }: {
      to?: string;
      params?: Record<string, unknown>;
      search?: Record<string, unknown>;
      className?: string;
      children?: React.ReactNode;
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
  };
});

// ProjectDetail exports Route; for test we render SkeletonCard to assert loading state

describe('ProjectDetail (skeleton)', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows skeleton when loading', async () => {
    const { default: SkeletonCard } =
      await import('../../app/components/ui/SkeletonCard');
    const qc = new QueryClient();
    const { container } = render(
      <QueryClientProvider client={qc}>
        <SkeletonCard />
      </QueryClientProvider>
    );
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('renders the project board without loading skeleton when task cache is preloaded', async () => {
    const { ProjectDetailScene } =
      await import('../../app/components/projects/ProjectDetailScene');
    const qc = new QueryClient();
    qc.setQueryData(['project', 'rent-stability-pantin'], {
      id: 'rent-stability-pantin',
      title: 'Rent Stability Pantin',
      statusVariant: 'warning',
      statusLabel: 'Paused',
      progressPercent: 42,
      progressText: '42%',
      etaLabel: 'Tomorrow',
      bestMoveTitle: 'Finalize dossier',
    });
    qc.setQueryData(
      ['tasks'],
      [
        {
          id: 'task-1',
          title: 'Prep dossier',
          status: 'todo',
          priority: 8,
          estimatedTimeMin: 30,
          tags: [],
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
          tags: [],
          projectId: 'rent-stability-pantin',
          completedAt: null,
          createdAt: null,
          cmsSlug: 'task-2',
          link: '/note?p=task-2',
        },
      ]
    );
    qc.setQueryData(
      ['viewer-adapter', 'project-surface', 'rent-stability-pantin'],
      {
        projectId: 'rent-stability-pantin',
        pressureBand: [],
        decisionQueue: [],
        immediateActions: [],
        verificationRail: [],
        executionSnapshot: {
          activeTasks: [],
          activePipelines: [],
          activeRunners: [],
          hueyJobs: [],
          scheduleItems: [],
        },
        contextPanel: [],
        timelineHints: [],
        dependencyRiskSignals: [],
      }
    );

    const { container } = render(
      <QueryClientProvider client={qc}>
        <ProjectDetailScene projectId="rent-stability-pantin" />
      </QueryClientProvider>
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeFalsy();
    expect(screen.getByText('Project command center')).toBeTruthy();
    expect(screen.getByText('Rent Stability Pantin')).toBeTruthy();
    expect(screen.getByText('Paused')).toBeTruthy();
    expect(screen.getByText('42%')).toBeTruthy();
    expect(screen.getByText('Tomorrow')).toBeTruthy();
    expect(screen.getByText('Finalize dossier')).toBeTruthy();
    expect(screen.getByText('Prep dossier')).toBeTruthy();
    expect(screen.getByText('Book viewing')).toBeTruthy();

    expect(
      screen
        .getByText('Board & execution queue')
        .closest('a')
        ?.getAttribute('data-link-to')
    ).toBe('/project/$slug/tasks');
    expect(
      screen
        .getByText('Workspace & notes')
        .closest('a')
        ?.getAttribute('data-link-to')
    ).toBe('/project/$slug/knowledge');
    expect(
      screen
        .getByText('Pipelines & runners')
        .closest('a')
        ?.getAttribute('data-link-to')
    ).toBe('/project/$slug/automation');
  });

  it('surfaces adapter-backed pressure, immediate actions, execution snapshot, and verification rails', async () => {
    const { ProjectDetailScene } =
      await import('../../app/components/projects/ProjectDetailScene');
    const qc = new QueryClient();

    qc.setQueryData(['project', 'rent-stability-pantin'], {
      id: 'rent-stability-pantin',
      title: 'Rent Stability Pantin',
      statusVariant: 'warning',
      statusLabel: 'Paused',
      progressPercent: 42,
      progressText: '42%',
      etaLabel: 'Tomorrow',
      bestMoveTitle: 'Finalize dossier',
    });

    qc.setQueryData(['tasks'], []);

    qc.setQueryData(
      ['viewer-adapter', 'project-surface', 'rent-stability-pantin'],
      {
        projectId: 'rent-stability-pantin',
        pressureBand: [
          {
            id: 'pressure-1',
            kind: 'risk',
            title: 'Lease renewal at risk',
            summary: 'The next renewal decision needs attention.',
            severity: 'high',
            surfacedBy: 'cod',
            sourceType: 'project',
            sourceId: 'rent-stability-pantin',
            surfacedAt: '2026-03-30T21:00:00.000Z',
            whySurfaced:
              'This project is approaching a critical decision point.',
            allowedActions: [],
          },
        ],
        decisionQueue: [
          {
            id: 'decision-1',
            title: 'Lock lease renewal path',
            summary: 'Confirm the direction before the next review cycle.',
            actionType: 'approve',
            surfacedBy: 'cod',
            sourceSignalIds: ['pressure-1'],
            sourceEntities: [
              {
                id: 'rent-stability-pantin',
                type: 'project',
                title: 'Rent Stability Pantin',
              },
            ],
            projectId: 'rent-stability-pantin',
            score: 9.6,
            scoreBreakdown: {
              urgency: 9,
              impact: 9,
              blockageRemoval: 8,
              reversibility: 7,
              confidence: 9,
            },
            whyNow: 'The lease decision is now the primary project risk.',
            expectedEffect: 'Reduces uncertainty around the renewal path.',
            confidence: 0.94,
            reversibility: 'high',
          },
        ],
        immediateActions: [
          {
            id: 'action-1',
            title: 'Finalize dossier',
            summary: 'Compile the documents needed for the next decision.',
            actionType: 'create_task',
            surfacedBy: 'cod',
            sourceSignalIds: ['pressure-1'],
            sourceEntities: [
              {
                id: 'task-1',
                type: 'task',
                title: 'Prep dossier',
                projectId: 'rent-stability-pantin',
              },
            ],
            projectId: 'rent-stability-pantin',
            score: 9.2,
            scoreBreakdown: {
              urgency: 9,
              impact: 8,
              blockageRemoval: 7,
              reversibility: 9,
              confidence: 9,
            },
            whyNow:
              'The dossier can be assembled without waiting on other work.',
            expectedEffect:
              'Moves the project toward a clean renewal decision.',
            confidence: 0.91,
            reversibility: 'high',
            mutationRef: {
              domain: 'work',
              operation: 'create_task',
              targetId: 'task-1',
            },
          },
        ],
        verificationRail: [
          {
            id: 'verification-1',
            actionId: 'action-rent-stability-pantin',
            startedAt: '2026-03-30T21:05:00.000Z',
            status: 'success',
            summary: 'Lease status verified',
          },
        ],
        executionSnapshot: {
          activeTasks: [
            {
              id: 'task-1',
              type: 'task',
              title: 'Prep dossier',
              projectId: 'rent-stability-pantin',
            },
          ],
          activePipelines: [
            {
              id: 'pipeline-1',
              type: 'pipeline',
              title: 'Nightly build',
            },
          ],
          activeRunners: [
            {
              id: 'runner-1',
              type: 'runner',
              title: 'Runner alpha',
            },
          ],
          hueyJobs: [
            {
              id: 'job-1',
              type: 'huey_job',
              title: 'Huey queue',
            },
          ],
          scheduleItems: [
            {
              id: 'schedule-1',
              type: 'schedule',
              title: 'Renewal reminder',
            },
          ],
        },
        contextPanel: [],
        timelineHints: [],
        dependencyRiskSignals: [],
      }
    );

    render(
      <QueryClientProvider client={qc}>
        <ProjectDetailScene projectId="rent-stability-pantin" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Pressure Signals')).toBeTruthy();
    expect(screen.getByText('Lease renewal at risk')).toBeTruthy();
    expect(screen.getByText('Immediate Actions')).toBeTruthy();
    expect(screen.getAllByText('Finalize dossier')).toHaveLength(2);
    expect(screen.getByText('Inspect in Actions')).toBeTruthy();
    expect(screen.getByText('Verification Rail')).toBeTruthy();
    expect(screen.getByText('Lease status verified')).toBeTruthy();
    expect(screen.getByText('Execution Snapshot')).toBeTruthy();
    expect(screen.getByText('Active Tasks')).toBeTruthy();
    expect(screen.getByText('Prep dossier')).toBeTruthy();
    expect(screen.getByText('Nightly build')).toBeTruthy();
    expect(screen.getByText('Runner alpha')).toBeTruthy();
    expect(screen.getByText('Huey queue')).toBeTruthy();
    expect(screen.getByText('Renewal reminder')).toBeTruthy();
  });
});
