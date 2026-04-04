import React from 'react';
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

function PortfolioItem({ item }: { item: PressureSignal }) {
  return (
    <li
      data-testid={`portfolio-item-${item.id}`}
      className="flex items-start gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
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
    </li>
  );
}

function PortfolioList({ data }: { data: PortfolioSurfacePayload }) {
  return (
    <div data-testid="portfolio-list" className="space-y-1">
      <ul className="space-y-1">
        {data.items.map((item) => (
          <PortfolioItem key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function PortfolioRoute() {
  const { data, isLoading } = usePortfolioSurface();

  const criticalCount =
    data?.items.filter((i) => i.severity === 'critical').length ?? 0;
  const highCount =
    data?.items.filter((i) => i.severity === 'high').length ?? 0;

  return (
    <WorkspaceScaffold
      title="Portfolio"
      subtitle="Projects under pressure — highest-priority project-scoped signals."
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
          <PortfolioList data={data} />
        )
      }
      asideTitle="Project Detail"
      asideSubtitle="Signal context, project link, and available actions."
      aside={
        <div data-testid="portfolio-aside-empty-state" className="space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            No item selected.
          </p>
          <p className="text-xs text-neutral-400">
            Select a project signal to inspect it here.
          </p>
        </div>
      }
    />
  );
}
