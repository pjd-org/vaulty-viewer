import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { GlassSurface } from '@vault/ui';

import { WorkspaceScaffold } from '../components/layout';
import { RouteLoadingState } from '../components/ui';
import { automationSearchParams } from '../../src/lib/routes/search-params';
import {
  useAutomationSurface,
  type PipelineEntry,
  type SchedulerJobEntry,
  type AutomationSurfacePayload,
} from '../lib/viewer-adapter';

export const Route = createFileRoute('/automation')({
  validateSearch: automationSearchParams,
  component: AutomationRoute,
});

// ---------------------------------------------------------------------------
// Selection types — discriminated union for type safety
// ---------------------------------------------------------------------------

type Selection =
  | { kind: 'pipeline'; pipeline: PipelineEntry }
  | { kind: 'job'; job: SchedulerJobEntry };

// ---------------------------------------------------------------------------
// AutomationDetail — aside panel
// ---------------------------------------------------------------------------

function AutomationDetail({ selection }: { selection: Selection }) {
  if (selection.kind === 'pipeline') {
    const { pipeline } = selection;
    return (
    <GlassSurface variant="canvas" radius="2xl" shadow="sm" border="default" className="flex flex-col gap-3 p-4 text-sm"
      data-testid="automation-pipeline-detail"
    >
        <p className="font-mono font-medium text-[var(--text-primary)]">
          {pipeline.name}
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          No execution history yet. Trigger a run via the scheduler or CLI to
          see runtime metadata here.
        </p>
      </GlassSurface>
    );
  }

  if (selection.kind === 'job') {
    const { job } = selection;
    const run = job.lastRun as Record<string, unknown> | null | undefined;
    const lastRunStatus = run ? String(run.status ?? '—') : null;
    const lastRunEndedAt = run?.endedAt
      ? new Date(String(run.endedAt)).toLocaleString([], {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : null;
    const isFailed = lastRunStatus?.startsWith('failed');

    return (
    <GlassSurface variant="canvas" radius="2xl" shadow="sm" border="default" className="flex flex-col gap-4 p-4 text-sm"
      data-testid="automation-job-detail"
    >
        <div>
          <p className="font-mono font-medium text-[var(--text-primary)]">
            {job.id}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {job.pipeline}
          </p>
        </div>

        <div className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          {job.cron && (
            <p>
              <span className="font-medium text-[var(--text-primary)]">
                Cron:
              </span>{' '}
              <span className="font-mono">{job.cron}</span>
            </p>
          )}
          {job.intervalSec != null && (
            <p>
              <span className="font-medium text-[var(--text-primary)]">
                Interval:
              </span>{' '}
              {job.intervalSec}s
            </p>
          )}
          {job.mode && (
            <p>
              <span className="font-medium text-[var(--text-primary)]">
                Mode:
              </span>{' '}
              {job.mode}
            </p>
          )}
          {job.source && (
            <p>
              <span className="font-medium text-[var(--text-primary)]">
                Source:
              </span>{' '}
              {job.source}
            </p>
          )}
        </div>

        {lastRunStatus && (
          <div className="flex flex-col gap-1 text-xs">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Last run
            </p>
            <p
              className={
                isFailed
                  ? 'text-destructive font-medium'
                  : 'text-muted-foreground'
              }
            >
              {lastRunStatus}
              {lastRunEndedAt ? ` · ${lastRunEndedAt}` : ''}
            </p>
          </div>
        )}
      </GlassSurface>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// PipelineList
// ---------------------------------------------------------------------------

function PipelineList({
  pipelines,
  selectedId,
  onSelect,
}: {
  pipelines: PipelineEntry[];
  selectedId: string | null;
  onSelect: (p: PipelineEntry) => void;
}) {
  if (pipelines.length === 0) {
    return (
      <p className="text-sm italic text-[var(--text-secondary)]">
        No pipelines defined.
      </p>
    );
  }
  return (
    <ul data-testid="automation-pipeline-list" className="flex flex-col gap-1">
      {pipelines.map((p) => (
        <li key={p.name}>
          <button
            type="button"
            onClick={() => onSelect(p)}
            className={[
              'flex w-full items-center gap-2 rounded-[14px] border px-3 py-2 text-sm transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              selectedId === p.name
                ? 'border-[color-mix(in_srgb,var(--a-sky)_32%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] text-[var(--text-primary)]'
                : 'border-[var(--border-glass-soft)] bg-[var(--surf-base)] text-[var(--text-secondary)] hover:bg-[var(--surf-utility)]',
            ].join(' ')}
          >
            <span className="font-mono text-xs text-[var(--text-tertiary)] shrink-0">
              ▸
            </span>
            <span>{p.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// SchedulerSection
// ---------------------------------------------------------------------------

function SchedulerSection({
  scheduler,
  selectedJobId,
  onSelectJob,
}: {
  scheduler: AutomationSurfacePayload['scheduler'];
  selectedJobId: string | null;
  onSelectJob: (job: SchedulerJobEntry) => void;
}) {
  return (
    <div data-testid="automation-scheduler-section" className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-[var(--text-secondary)]">Scheduler</span>
        {scheduler.enabled ? (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold uppercase text-success">
            enabled
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase text-[var(--text-secondary)]">
            disabled
          </span>
        )}
        <span className="text-xs text-[var(--text-secondary)]">
          · {scheduler.mode} · {scheduler.tz}
        </span>
      </div>
      {scheduler.jobs.length === 0 ? (
        <p className="text-xs italic text-[var(--text-secondary)]">
          No scheduled jobs.
        </p>
      ) : (
        <GlassSurface variant="canvas" radius="xl" shadow="sm" border="default" className="overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-glass-soft)] text-left">
              <th className="px-3 py-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                ID
              </th>
              <th className="px-3 py-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Pipeline
              </th>
              <th className="px-3 py-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Schedule
              </th>
              <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Last run
              </th>
            </tr>
          </thead>
          <tbody>
            {scheduler.jobs.map((job: SchedulerJobEntry) => {
              const run = job.lastRun as Record<string, unknown>;
              const status = String(run?.status ?? '—');
              const endedAt = run?.endedAt
                ? new Date(String(run.endedAt)).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;
              const failed = status.startsWith('failed');
              return (
                <tr
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectJob(job)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectJob(job);
                    }
                  }}
                  className={[
                    'border-b border-[var(--border-glass-soft)]/70 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20',
                    selectedJobId === job.id
                      ? 'bg-[color-mix(in_srgb,var(--a-sky)_10%,var(--surf-elevated))]'
                      : 'hover:bg-[var(--surf-utility)]',
                  ].join(' ')}
                >
                  <td className="px-3 py-2 pr-4 font-mono text-xs text-[var(--text-primary)]">
                    {job.id}
                  </td>
                  <td className="px-3 py-2 pr-4 text-[var(--text-primary)]">{job.pipeline}</td>
                  <td className="px-3 py-2 pr-4 font-mono text-xs text-[var(--text-secondary)]">
                    {job.cron ??
                      (job.intervalSec != null ? `${job.intervalSec}s` : '—')}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {job.lastRun != null ? (
                      <span
                        className={
                          failed
                            ? 'text-destructive font-medium'
                            : 'text-[var(--text-secondary)]'
                        }
                      >
                        {status}
                        {endedAt ? ` · ${endedAt}` : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </GlassSurface>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AutomationRoute
// ---------------------------------------------------------------------------

function AutomationRoute() {
  const { data, isLoading } = useAutomationSurface();
  const [selection, setSelection] = useState<Selection | null>(null);

  const selectedPipelineId =
    selection?.kind === 'pipeline' ? selection.pipeline.name : null;
  const selectedJobId = selection?.kind === 'job' ? selection.job.id : null;

  return (
    <WorkspaceScaffold
      title="Automation"
      subtitle="Pipelines, Primary Agent, schedules, and runners in one machine-control lane."
      summaryItems={[
        {
          label: 'Pipelines',
          value: data ? String(data.pipelines.length) : '—',
          detail: 'Registered pipelines',
        },
        {
          label: 'Scheduler',
          value: data ? (data.scheduler.enabled ? 'On' : 'Off') : '—',
          detail: 'Scheduler status',
        },
        {
          label: 'Jobs',
          value: data ? String(data.scheduler.jobs.length) : '—',
          detail: 'Scheduled jobs',
        },
        {
          label: 'Mode',
          value: data ? data.scheduler.mode : '—',
          detail: 'Execution mode',
        },
      ]}
      primaryTitle="Pipelines & Scheduler"
      primarySubtitle="Registered pipelines and scheduled jobs."
      primary={
        isLoading ? (
          <RouteLoadingState label="Loading automation controls..." />
        ) : data == null ? (
          <div data-testid="automation-empty-state" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              No automation data yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Adapter context is wired. Data will appear once the runtime
              surface connects.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <GlassSurface variant="canvas" radius="2xl" shadow="sm" border="default" className="flex flex-col gap-3 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Pipelines
              </h3>
              <PipelineList
                pipelines={data.pipelines}
                selectedId={selectedPipelineId}
                onSelect={(p) =>
                  setSelection({ kind: 'pipeline', pipeline: p })
                }
              />
            </GlassSurface>
            <GlassSurface variant="canvas" radius="2xl" shadow="sm" border="default" className="p-4">
              <SchedulerSection
                scheduler={data.scheduler}
                selectedJobId={selectedJobId}
                onSelectJob={(job) => setSelection({ kind: 'job', job })}
              />
            </GlassSurface>
          </div>
        )
      }
      aside={selection ? <AutomationDetail selection={selection} /> : null}
    />
  );
}
