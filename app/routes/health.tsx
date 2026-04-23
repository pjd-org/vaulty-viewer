import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { cn } from '@/src/lib/utils';

import { WorkspaceScaffold } from '../components/layout';
import { EmptyState, RouteLoadingState } from '../components/ui';
import {
  getAuthFailureKind,
  useLoginRedirectOnUnauthenticated,
} from '../hooks/use-login-redirect';
import { healthSearchParams } from '../../src/lib/routes/search-params';
import {
  useHealthSurface,
  type HealthServiceEntry,
  type HealthSurfacePayload,
} from '../lib/viewer-adapter';

export const Route = createFileRoute('/health')({
  validateSearch: healthSearchParams,
  component: HealthRoute,
});

const STATUS_COLORS: Record<HealthServiceEntry['status'], string> = {
  ok: 'text-success',
  degraded: 'text-warning',
  timeout: 'text-warning',
  error: 'text-destructive',
};

function StatusBadge({ status }: { status: HealthServiceEntry['status'] }) {
  return (
    <span
      className={cn('text-xs font-semibold uppercase', STATUS_COLORS[status])}
    >
      {status}
    </span>
  );
}

function ServiceTable({
  services,
  selectedId,
  onSelect,
}: {
  services: HealthServiceEntry[];
  selectedId: string | null;
  onSelect: (svc: HealthServiceEntry) => void;
}) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="py-2 pr-4 font-medium text-muted-foreground">
            Service
          </th>
          <th className="py-2 pr-4 font-medium text-muted-foreground">
            Status
          </th>
          <th className="py-2 pr-4 font-medium text-muted-foreground">
            Latency
          </th>
          <th className="py-2 font-medium text-muted-foreground">Version</th>
        </tr>
      </thead>
      <tbody>
        {services.map((svc) => (
          <tr
            key={svc.id}
            role="button"
            tabIndex={0}
            aria-selected={selectedId === svc.id}
            onClick={() => onSelect(svc)}
            onKeyDown={(e) =>
              (e.key === 'Enter' || e.key === ' ') && onSelect(svc)
            }
            className={cn(
              'border-b border-border/50 cursor-pointer transition-colors',
              selectedId === svc.id ? 'bg-muted/60' : 'hover:bg-muted/40'
            )}
          >
            <td className="py-2 pr-4 font-medium">{svc.name}</td>
            <td className="py-2 pr-4">
              <StatusBadge status={svc.status} />
            </td>
            <td className="py-2 pr-4 tabular-nums text-muted-foreground">
              {svc.latencyMs != null ? `${svc.latencyMs}ms` : '—'}
            </td>
            <td className="py-2 text-muted-foreground">
              {svc.version ??
                (svc.toolCount != null ? `${svc.toolCount} tools` : '—')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ServiceDetail({ svc }: { svc: HealthServiceEntry }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
          Name
        </p>
        <p className="font-medium">{svc.name}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
          Status
        </p>
        <StatusBadge status={svc.status} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
          Latency
        </p>
        <p className="tabular-nums">
          {svc.latencyMs != null ? `${svc.latencyMs}ms` : '—'}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
          Version / Tools
        </p>
        <p>
          {svc.version ??
            (svc.toolCount != null ? `${svc.toolCount} tools` : '—')}
        </p>
      </div>
      {svc.detail && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Detail
          </p>
          <p className="text-muted-foreground break-words">{svc.detail}</p>
        </div>
      )}
    </div>
  );
}

function OverallBadge({ payload }: { payload: HealthSurfacePayload }) {
  const color = payload.overall === 'ok' ? 'text-success' : 'text-warning';
  return (
    <span
      data-testid="health-overall-status"
      className={cn('text-sm font-semibold uppercase', color)}
    >
      {payload.overall}
    </span>
  );
}

function HealthRoute() {
  const { data, isLoading, error } = useHealthSurface();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isUnauthenticated = useLoginRedirectOnUnauthenticated(error);
  const authFailureKind = getAuthFailureKind(error);

  if (isUnauthenticated) return null;

  const selectedSvc = selectedId
    ? (data?.services.find((s) => s.id === selectedId) ?? null)
    : null;

  const handleSelect = (svc: HealthServiceEntry) => {
    setSelectedId((prev) => (prev === svc.id ? null : svc.id));
  };

  return (
    <WorkspaceScaffold
      title="Health"
      subtitle="Platform-integrity lane for freshness, incidents, sync, and degraded services."
      summaryItems={[
        {
          label: 'Overall',
          value: data ? (data.overall === 'ok' ? 'OK' : 'Degraded') : '—',
          detail: data
            ? `As of ${new Date(data.timestamp).toLocaleTimeString()}`
            : 'Awaiting data',
        },
        {
          label: 'Services',
          value: data ? String(data.services.length) : '—',
          detail: 'Monitored endpoints',
        },
        {
          label: 'Degraded',
          value: data
            ? String(data.services.filter((s) => s.status !== 'ok').length)
            : '0',
          detail: 'Services with issues',
        },
        {
          label: 'MCP',
          value: data?.services.find((s) => s.id === 'mcp')?.status ?? '—',
          detail: 'MCP server status',
        },
      ]}
      primaryTitle="Service Status"
      primarySubtitle="Live health of platform services and dependencies."
      primary={
        isLoading ? (
          <RouteLoadingState label="Loading service checks..." />
        ) : authFailureKind === 'forbidden' ? (
          <EmptyState
            title="Health access forbidden"
            description="You are signed in, but this account cannot read the health surface."
          />
        ) : data == null ? (
          <div data-testid="health-empty-state" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              No health data yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Adapter context is wired. Service status will appear once the
              runtime connects.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Overall: <OverallBadge payload={data} />
            </div>
            <ServiceTable
              services={data.services}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
        )
      }
    />
  );
}
