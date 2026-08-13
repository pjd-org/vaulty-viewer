import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { GlassBadge, GlassSurface } from '@vault/ui';
import { cn } from '@/src/lib/utils';

import { EmptyState, RouteLoadingState } from '../components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  getAuthFailureKind,
  useLoginRedirectOnUnauthenticated,
} from '../hooks/use-login-redirect';
import { buildAuthTransitionPath } from '../../src/lib/auth-transition';
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
  ok: 'text-emerald-800 dark:text-emerald-300',
  degraded: 'text-amber-800 dark:text-amber-300',
  timeout: 'text-amber-800 dark:text-amber-300',
  error: 'text-red-800 dark:text-red-300',
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
            aria-pressed={selectedId === svc.id}
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
  const color =
    payload.overall === 'ok'
      ? 'text-emerald-800 dark:text-emerald-300'
      : 'text-amber-800 dark:text-amber-300';
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
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isUnauthenticated = useLoginRedirectOnUnauthenticated(error);
  const authFailureKind = getAuthFailureKind(error);

  if (isUnauthenticated) return null;

  const selectedSvc = selectedId
    ? (data?.services.find((s) => s.id === selectedId) ?? null)
    : null;

  React.useEffect(() => {
    if (!selectedId && data?.services.length) {
      setSelectedId(data.services[0].id);
    }
  }, [data, selectedId]);

  const handleSelect = (svc: HealthServiceEntry) => {
    setSelectedId((prev) => (prev === svc.id ? null : svc.id));
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void navigate({ to: buildAuthTransitionPath('/') });
      }}
    >
      <DialogContent
        aria-label="Health details"
        className="!top-[50%] !max-w-[min(960px,calc(100vw-2rem))] !rounded-[24px] !border !border-[var(--border-glass)] !bg-[var(--surf-overlay)] !p-0 !shadow-2xl"
      >
        <div className="max-h-[min(88vh,860px)] overflow-y-auto">
          <div className="border-b border-[var(--border-glass-soft)] px-6 py-5">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl">Health</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-[var(--text-primary)]">
                Platform-integrity lane for freshness, incidents, sync, and
                degraded services.
              </DialogDescription>
            </DialogHeader>

            {data && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <GlassBadge tone="sky" size="md" className="justify-between px-3">
                  <span className="uppercase tracking-[0.2em]">Overall</span>
                  <strong>{data.overall === 'ok' ? 'OK' : 'Degraded'}</strong>
                </GlassBadge>
                <GlassBadge tone="mint" size="md" className="justify-between px-3">
                  <span className="uppercase tracking-[0.2em]">Services</span>
                  <strong>{data.services.length}</strong>
                </GlassBadge>
                <GlassBadge tone="sun" size="md" className="justify-between px-3">
                  <span className="uppercase tracking-[0.2em]">Degraded</span>
                  <strong>{data.services.filter((s) => s.status !== 'ok').length}</strong>
                </GlassBadge>
                <GlassBadge tone="lilac" size="md" className="justify-between px-3">
                  <span className="uppercase tracking-[0.2em]">MCP</span>
                  <strong>{data.services.find((s) => s.id === 'mcp')?.status ?? '—'}</strong>
                </GlassBadge>
              </div>
            )}
          </div>

          <div className="px-6 py-5">
            {isLoading ? (
              <RouteLoadingState label="Loading service checks..." />
            ) : authFailureKind === 'forbidden' ? (
              <EmptyState
                title="Health access forbidden"
                description="You are signed in, but this account cannot read the health surface."
              />
            ) : data == null ? (
              <div data-testid="health-empty-state" className="flex flex-col gap-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  No health data yet.
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Adapter context is wired. Service status will appear once the
                  runtime connects.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <GlassSurface
                  as="section"
                  variant="base"
                  radius="xl"
                  shadow="xs"
                  className="overflow-hidden p-4"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    Overall: <OverallBadge payload={data} />
                  </div>
                  <ServiceTable
                    services={data.services}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                  />
                </GlassSurface>

                <GlassSurface
                  as="section"
                  variant="base"
                  radius="xl"
                  shadow="xs"
                  className="overflow-hidden p-4"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                    Selected service
                  </p>
                  {selectedSvc ? (
                    <ServiceDetail svc={selectedSvc} />
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">
                      Select a service to inspect its details.
                    </p>
                  )}
                </GlassSurface>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
