import React, { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { EmptyState, RouteLoadingState } from '../components/ui';
import { portfolioSearchParams } from '../../src/lib/routes/search-params';
import {
  usePortfolioSurface,
  type PortfolioSurfacePayload,
  type PressureSignal,
} from '../lib/viewer-adapter';

export const Route = createFileRoute('/portfolio')({
  validateSearch: portfolioSearchParams,
  component: PortfolioRoute,
});

// ---------------------------------------------------------------------------
// PortfolioItemDetail — aside panel
// ---------------------------------------------------------------------------

function PortfolioItemDetail({ item }: { item: PressureSignal }) {
  const severityColor: Record<string, string> = {
    critical: 'bg-destructive/10 text-destructive',
    high: 'bg-warning/10 text-warning',
    medium: 'bg-primary/10 text-primary',
    low: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="flex flex-col gap-4 text-sm" data-testid="portfolio-item-detail">
      <div>
        <p className="font-medium leading-snug text-[var(--text-primary)]">
          {item.title}
        </p>
        {item.projectId && (
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
            {item.projectId}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${severityColor[item.severity] ?? 'bg-[var(--surf-utility)] text-[var(--text-tertiary)]'}`}
        >
          {item.severity}
        </span>
        <span className="rounded-full bg-[var(--surf-utility)] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]">
          {item.kind}
        </span>
        {item.state && (
          <span className="rounded-full bg-[var(--surf-utility)] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]">
            {item.state}
          </span>
        )}
      </div>

      {item.summary && (
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          {item.summary}
        </p>
      )}

      <div className="flex flex-col gap-1 text-xs text-[var(--text-tertiary)]">
        <p>
          <span className="font-medium text-[var(--text-primary)]">Why surfaced:</span>{' '}
          {item.whySurfaced}
        </p>
        {item.confidence !== undefined && (
          <p>
            <span className="font-medium text-[var(--text-primary)]">Confidence:</span>{' '}
            {(item.confidence * 100).toFixed(0)}%
          </p>
        )}
        {item.score !== undefined && (
          <p>
            <span className="font-medium text-[var(--text-primary)]">Score:</span>{' '}
            {item.score}
          </p>
        )}
      </div>

      {item.allowedActions.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Actions (display only)
          </p>
          <ul className="flex flex-col gap-1">
            {item.allowedActions.map((action) => (
              <li
                key={action.actionType}
                className="rounded-md bg-[var(--surf-utility)] px-2 py-1 text-xs text-[var(--text-secondary)]"
              >
                {action.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {item.projectId ? (
          <Link
            to="/project/$slug/tasks"
            params={{ slug: item.projectId }}
            search={{
              tab: undefined,
              selectedId: item.id,
              noteId: undefined,
              mode: undefined,
              templateId: undefined,
              memoryTab: undefined,
            }}
            className="rounded-full border border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--a-sky)_18%,var(--surf-elevated))]"
          >
            Open project
          </Link>
        ) : (
          <span className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Project unavailable
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SeverityDot
// ---------------------------------------------------------------------------

function SeverityDot({ severity }: { severity: PressureSignal['severity'] }) {
  const color =
    severity === 'critical'
      ? 'bg-destructive'
      : severity === 'high'
        ? 'bg-warning'
        : severity === 'medium'
          ? 'bg-warning/70'
          : 'bg-muted-foreground';
  return <span className={`inline-block size-2 rounded-full ${color}`} />;
}

// ---------------------------------------------------------------------------
// PortfolioItem
// ---------------------------------------------------------------------------

function PortfolioItem({
  item,
  isSelected,
  onSelect,
}: {
  item: PressureSignal;
  isSelected: boolean;
  onSelect: (item: PressureSignal) => void;
}) {
  return (
    <li data-testid={`portfolio-item-${item.id}`}>
      <button
        type="button"
        onClick={() => onSelect(item)}
        className={[
          'flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
          isSelected
            ? 'border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_10%,var(--surf-base))]'
            : 'border-transparent bg-[var(--surf-base)] hover:border-[var(--border-glass-soft)] hover:bg-[var(--surf-elevated)]',
        ].join(' ')}
      >
        <SeverityDot severity={item.severity} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.title}</p>
          {item.projectId && (
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              {item.projectId}
            </p>
          )}
          {item.summary && (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
              {item.summary}
            </p>
          )}
        </div>
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// PortfolioList
// ---------------------------------------------------------------------------

function PortfolioList({
  data,
  selectedId,
  onSelect,
}: {
  data: PortfolioSurfacePayload;
  selectedId: string | null;
  onSelect: (item: PressureSignal) => void;
}) {
  return (
    <div data-testid="portfolio-list" className="flex flex-col gap-1">
      <p
        data-testid="portfolio-cap-notice"
        className="text-xs text-[var(--text-tertiary)] mb-2"
      >
        Showing top {data.total} project signal{data.total !== 1 ? 's' : ''}{' '}
        from the pressure band.
      </p>
      <ul className="flex flex-col gap-1">
        {data.items.map((item) => (
          <PortfolioItem
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PortfolioRoute
// ---------------------------------------------------------------------------

function PortfolioRoute() {
  const { data, isLoading } = usePortfolioSurface();
  const [selectedItem, setSelectedItem] = useState<PressureSignal | null>(null);

  // Clear selection if the selected item is no longer present after a data refresh
  useEffect(() => {
    if (!selectedItem || !data) return;
    const stillExists = data.items.some((i) => i.id === selectedItem.id);
    if (!stillExists) setSelectedItem(null);
  }, [data, selectedItem]);

  const criticalCount =
    data?.items.filter((i) => i.severity === 'critical').length ?? 0;
  const highCount =
    data?.items.filter((i) => i.severity === 'high').length ?? 0;

  return (
    <WorkspaceScaffold
      title="Portfolio"
      subtitle={`Pressure-band snapshot${data ? ` (top ${data.total})` : ''}.`}
      summaryItems={[
        {
          label: 'Total',
          value: data ? String(data.total) : '—',
          detail: 'Projects in pressure band',
        },
        {
          label: 'Critical',
          value: data ? String(criticalCount) : '—',
          detail: 'Critical signals',
        },
        {
          label: 'High',
          value: data ? String(highCount) : '—',
          detail: 'High-severity signals',
        },
        {
          label: 'Source',
          value: 'COD',
          detail: 'Pressure band snapshot',
        },
      ]}
      primaryTitle="Projects Under Pressure"
      primarySubtitle="Project-scoped signals from the COD pressure band."
      primary={
        isLoading ? (
          <RouteLoadingState label="Loading pressure signals..." />
        ) : data == null || data.total === 0 ? (
          <EmptyState
            title="No projects in the pressure band."
            description="Project-scoped signals will appear here once COD surfaces project-linked tasks."
            action={
              <Link
                to="/work"
                className="inline-flex rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
              >
                Review Work
              </Link>
            }
          />
        ) : (
          <PortfolioList
            data={data}
            selectedId={selectedItem?.id ?? null}
            onSelect={setSelectedItem}
          />
        )
      }
    />
  );
}
