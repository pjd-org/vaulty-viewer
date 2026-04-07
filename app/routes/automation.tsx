import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
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
// Selection types
// ---------------------------------------------------------------------------

type SelectionKind = 'pipeline' | 'job';

interface Selection {
  kind: SelectionKind;
  pipeline?: PipelineEntry;
  job?: SchedulerJobEntry;
}

// ---------------------------------------------------------------------------
// AutomationDetail — aside panel
// ---------------------------------------------------------------------------

function AutomationDetail({ selection }: { selection: Selection }) {
  if (selection.kind === 'pipeline' && selection.pipeline) {
    const { pipeline } = selection;
    return (
      <div
        className="space-y-3 text-sm"
        data-testid="automation-pipeline-detail"
      >
        <p className="font-medium text-slate-800 font-mono">{pipeline.name}</p>
        <p className="text-xs text-neutral-500">
          No additional metadata available for this pipeline.
        </p>
      </div>
    );
  }

  if (selection.kind === 'job' && selection.job) {
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
      <div className="space-y-4 text-sm" data-testid="automation-job-detail">
        <div>
          <p className="font-medium text-slate-800 font-mono">{job.id}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{job.pipeline}</p>
        </div>

        <div className="space-y-1 text-xs text-neutral-600">
          {job.cron && (
            <p>
              <span className="font-medium text-neutral-700">Cron:</span>{' '}
              <span className="font-mono">{job.cron}</span>
            </p>
          )}
          {job.intervalSec != null && (
            <p>
              <span className="font-medium text-neutral-700">Interval:</span>{' '}
              {job.intervalSec}s
            </p>
          )}
          {job.mode && (
            <p>
              <span className="font-medium text-neutral-700">Mode:</span>{' '}
              {job.mode}
            </p>
          )}
          {job.source && (
            <p>
              <span className="font-medium text-neutral-700">Source:</span>{' '}
              {job.source}
            </p>
          )}
        </div>

        {lastRunStatus && (
          <div className="space-y-1 text-xs">
            <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">
              Last run
            </p>
            <p
              className={
                isFailed ? 'text-red-500 font-medium' : 'text-neutral-600'
              }
            >
              {lastRunStatus}
              {lastRunEndedAt ? ` · ${lastRunEndedAt}` : ''}
            </p>
          </div>
        )}
      </div>
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
      <p className="text-sm text-muted-foreground italic">
        No pipelines defined.
      </p>
    );
  }
  return (
    <ul data-testid="automation-pipeline-list" className="space-y-1">
      {pipelines.map((p) => (
        <li key={p.name}>
          <button
            type="button"
            onClick={() => onSelect(p)}
            className={[
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-left',
              selectedId === p.name
                ? 'bg-neutral-200/60 text-neutral-900'
                : 'hover:bg-muted/50 text-neutral-700',
            ].join(' ')}
          >
            <span className="font-mono text-xs text-muted-foreground shrink-0">
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
    <div data-testid="automation-scheduler-section" className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-muted-foreground">Scheduler</span>
        {scheduler.enabled ? (
          <span className="text-xs font-semibold text-emerald-600 uppercase">
            enabled
          </span>
        ) : (
          <span className="text-xs font-semibold text-neutral-400 uppercase">
            disabled
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          · {scheduler.mode} · {scheduler.tz}
        </span>
      </div>
      {scheduler.jobs.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No scheduled jobs.
        </p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 font-medium text-muted-foreground">
                ID
              </th>
              <th className="py-2 pr-4 font-medium text-muted-foreground">
                Pipeline
              </th>
              <th className="py-2 pr-4 font-medium text-muted-foreground">
                Schedule
              </th>
              <th className="py-2 font-medium text-muted-foreground">
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
                  onClick={() => onSelectJob(job)}
                  className={[
                    'border-b border-border/50 transition-colors cursor-pointer',
                    selectedJobId === job.id
                      ? 'bg-neutral-200/60'
                      : 'hover:bg-muted/40',
                  ].join(' ')}
                >
                  <td className="py-2 pr-4 font-mono text-xs">{job.id}</td>
                  <td className="py-2 pr-4">{job.pipeline}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                    {job.cron ??
                      (job.intervalSec != null ? `${job.intervalSec}s` : '—')}
                  </td>
                  <td className="py-2 text-xs">
                    {job.lastRun != null ? (
                      <span
                        className={
                          failed
                            ? 'text-destructive font-medium'
                            : 'text-muted-foreground'
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
    selection?.kind === 'pipeline' ? (selection.pipeline?.name ?? null) : null;
  const selectedJobId =
    selection?.kind === 'job' ? (selection.job?.id ?? null) : null;

  return (
    <WorkspaceScaffold
      title="Automation"
      subtitle="Pipelines, Huey, schedules, and runners in one machine-control lane."
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
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data == null ? (
          <div data-testid="automation-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No automation data yet.
            </p>
            <p className="text-xs text-neutral-400">
              Adapter context is wired. Data will appear once the runtime
              surface connects.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Pipelines</h3>
              <PipelineList
                pipelines={data.pipelines}
                selectedId={selectedPipelineId}
                onSelect={(p) =>
                  setSelection({ kind: 'pipeline', pipeline: p })
                }
              />
            </div>
            <SchedulerSection
              scheduler={data.scheduler}
              selectedJobId={selectedJobId}
              onSelectJob={(job) => setSelection({ kind: 'job', job })}
            />
          </div>
        )
      }
      asideTitle="Detail Panel"
      asideSubtitle="Retry, inspect, and verification hooks live here."
      aside={
        selection ? (
          <AutomationDetail selection={selection} />
        ) : (
          <div data-testid="automation-aside-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No item selected.
            </p>
            <p className="text-xs text-neutral-400">
              Select a run, pipeline, or schedule to inspect it here.
            </p>
          </div>
        )
      }
    />
  );
}
