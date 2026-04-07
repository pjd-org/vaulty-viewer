import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
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
    critical: 'bg-destructive/10 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-neutral-100 text-neutral-600',
  };

  return (
    <div className="space-y-4 text-sm" data-testid="portfolio-item-detail">
      <div>
        <p className="font-medium leading-snug text-slate-800">{item.title}</p>
        {item.projectId && (
          <p className="mt-0.5 text-xs text-slate-500">{item.projectId}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${severityColor[item.severity] ?? 'bg-neutral-100 text-neutral-600'}`}
        >
          {item.severity}
        </span>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
          {item.kind}
        </span>
        {item.state && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
            {item.state}
          </span>
        )}
      </div>

      {item.summary && (
        <p className="text-xs text-neutral-600">{item.summary}</p>
      )}

      <div className="space-y-1 text-xs text-neutral-500">
        <p>
          <span className="font-medium text-neutral-700">Why surfaced:</span>{' '}
          {item.whySurfaced}
        </p>
        {item.confidence !== undefined && (
          <p>
            <span className="font-medium text-neutral-700">Confidence:</span>{' '}
            {(item.confidence * 100).toFixed(0)}%
          </p>
        )}
        {item.score !== undefined && (
          <p>
            <span className="font-medium text-neutral-700">Score:</span>{' '}
            {item.score}
          </p>
        )}
      </div>

      {item.allowedActions.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">
            Available actions
          </p>
          <ul className="space-y-1">
            {item.allowedActions.map((action) => (
              <li
                key={action.actionType}
                className="text-xs text-neutral-600 bg-neutral-50 rounded-md px-2 py-1"
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
        ? 'bg-orange-500'
        : severity === 'medium'
          ? 'bg-yellow-500'
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
          'flex w-full items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors text-left',
          isSelected ? 'bg-neutral-200/60' : 'hover:bg-muted/50',
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
            <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
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

  const criticalCount =
    data?.items.filter((i) => i.severity === 'critical').length ?? 0;
  const highCount =
    data?.items.filter((i) => i.severity === 'high').length ?? 0;

  return (
    <WorkspaceScaffold
      title="Portfolio"
      subtitle="Pressure-band snapshot (top 2). Full capital allocation surface requires backend API."
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
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data == null || data.total === 0 ? (
          <div data-testid="portfolio-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No projects in the pressure band.
            </p>
            <p className="text-xs text-neutral-400">
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
      asideTitle="Project Detail"
      asideSubtitle="Signal context, project link, and available actions."
      aside={
        selectedItem ? (
          <PortfolioItemDetail item={selectedItem} />
        ) : (
          <div data-testid="portfolio-aside-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No item selected.
            </p>
            <p className="text-xs text-neutral-400">
              Select a project signal to inspect it here.
            </p>
          </div>
        )
      }
    />
  );
}
