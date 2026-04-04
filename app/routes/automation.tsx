import React from 'react';
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

function PipelineList({ pipelines }: { pipelines: PipelineEntry[] }) {
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
        <li
          key={p.name}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
        >
          <span className="font-mono text-xs text-muted-foreground">▸</span>
          <span>{p.name}</span>
        </li>
      ))}
    </ul>
  );
}

function SchedulerSection({
  scheduler,
}: {
  scheduler: AutomationSurfacePayload['scheduler'];
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
            {scheduler.jobs.map((job: SchedulerJobEntry) => (
              <tr
                key={job.id}
                className="border-b border-border/50 hover:bg-muted/40 transition-colors"
              >
                <td className="py-2 pr-4 font-mono text-xs">{job.id}</td>
                <td className="py-2 pr-4">{job.pipeline}</td>
                <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                  {job.cron ??
                    (job.intervalSec != null ? `${job.intervalSec}s` : '—')}
                </td>
                <td className="py-2 text-xs">
                  {job.lastRun != null
                    ? (() => {
                        const run = job.lastRun as Record<string, unknown>;
                        const status = String(run.status ?? '—');
                        const endedAt = run.endedAt
                          ? new Date(String(run.endedAt)).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' }
                            )
                          : null;
                        const failed = status.startsWith('failed');
                        return (
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
                        );
                      })()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AutomationRoute() {
  const { data, isLoading } = useAutomationSurface();

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
              <PipelineList pipelines={data.pipelines} />
            </div>
            <SchedulerSection scheduler={data.scheduler} />
          </div>
        )
      }
      asideTitle="Detail Panel"
      asideSubtitle="Retry, inspect, and verification hooks live here."
      aside={
        <div data-testid="automation-aside-empty-state" className="space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            No item selected.
          </p>
          <p className="text-xs text-neutral-400">
            Select a run, pipeline, or schedule to inspect it here.
          </p>
        </div>
      }
    />
  );
}
