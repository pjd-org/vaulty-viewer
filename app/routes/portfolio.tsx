import React, { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { RouteLoadingState } from '../components/ui';
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
    <div className="space-y-4 text-sm" data-testid="portfolio-item-detail">
      <div>
        <p className="font-medium leading-snug text-foreground">{item.title}</p>
        {item.projectId && (
          <p className="mt-0.5 text-xs text-muted-foreground">{item.projectId}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${severityColor[item.severity] ?? 'bg-muted text-muted-foreground'}`}
        >
          {item.severity}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {item.kind}
        </span>
        {item.state && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {item.state}
          </span>
        )}
      </div>

      {item.summary && <p className="text-xs text-muted-foreground">{item.summary}</p>}

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Why surfaced:</span>{' '}
          {item.whySurfaced}
        </p>
        {item.confidence !== undefined && (
          <p>
            <span className="font-medium text-foreground">Confidence:</span>{' '}
            {(item.confidence * 100).toFixed(0)}%
          </p>
        )}
        {item.score !== undefined && (
          <p>
            <span className="font-medium text-foreground">Score:</span>{' '}
            {item.score}
          </p>
        )}
      </div>

      {item.allowedActions.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Actions (display only)
          </p>
          <ul className="space-y-1">
            {item.allowedActions.map((action) => (
              <li
                key={action.actionType}
                className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                {action.label}
              </li>
            ))}
          </ul>
        </div>
      )}
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
          'flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
          isSelected ? 'bg-primary/10' : 'hover:bg-muted/40',
        ].join(' ')}
      >
        <SeverityDot severity={item.severity} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.title}</p>
          {item.projectId && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.projectId}
            </p>
          )}
          {item.summary && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
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
    <div data-testid="portfolio-list" className="space-y-1">
      <p
        data-testid="portfolio-cap-notice"
        className="text-xs text-muted-foreground mb-2"
      >
        Showing top {data.total} project signal{data.total !== 1 ? 's' : ''}{' '}
        from the pressure band.
      </p>
      <ul className="space-y-1">
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
      subtitle={`Pressure-band snapshot${data ? ` (top ${data.total})` : ''}. Full capital allocation surface requires backend API.`}
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
          <div data-testid="portfolio-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              No projects in the pressure band.
            </p>
            <p className="text-xs text-muted-foreground">
              Project-scoped signals will appear here once COD surfaces
              project-linked tasks.
            </p>
          </div>
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
