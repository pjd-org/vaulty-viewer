import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';

import {
  PROJECT_ROUTE_TABS,
  getProjectTabPath,
} from '../../../src/lib/routes/v3-routing';
import { projectSearchParams } from '../../../src/lib/routes/search-params';
import { PageContainer } from './PageContainer';
import { SoftPanel } from './SoftPanel';
import { ProjectRouteShellProvider } from './ProjectRouteContext';
import type { SummaryRowItem } from './SummaryRow';
import type { ProjectSurfacePayload } from '../../lib/viewer-adapter';

interface ProjectRouteShellProps {
  slug: string;
  summaryItems?: readonly SummaryRowItem[];
  projectSurface?: ProjectSurfacePayload | null;
  children: React.ReactNode;
}

export function ProjectRouteShell({
  slug,
  summaryItems = [],
  projectSurface = null,
  children,
}: ProjectRouteShellProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const projectSearch = useRouterState({
    select: (state) => projectSearchParams(state.location.search),
  });
  const projectPath = `/project/${encodeURIComponent(slug)}`;
  const shellContext = React.useMemo(
    () => ({
      projectId: slug,
      projectPath,
      summaryItems,
      projectSurface,
    }),
    [projectPath, projectSurface, slug, summaryItems]
  );

  return (
    <PageContainer>
      <SoftPanel variant="elevated" className="overflow-hidden" noPadding>
        {/* ── Hero header ─────────────────────────────────────────────── */}
        <div className="px-6 py-5 genie-surface genie-surface--hero border-b border-[var(--border-glass)] rounded-t-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Project: {slug}
              </h1>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                Scoped command center
              </p>
            </div>
            <Link
              to="/work"
              search={{
                tab: undefined,
                status: undefined,
                selectedId: undefined,
              }}
              className="btn-secondary rounded-full px-4 py-2 text-sm font-medium shrink-0"
            >
              Back to Work
            </Link>
          </div>

          {/* ── Inline stat strip ──────────────────────────────────────── */}
          {summaryItems.length > 0 && (
            <div
              className="mt-4 pt-4 border-t border-[var(--border-glass-soft)] grid gap-x-6 gap-y-3"
              style={{
                gridTemplateColumns: `repeat(${Math.min(summaryItems.length, 4)}, minmax(0, 1fr))`,
              }}
            >
              {summaryItems.map((item) => (
                <div key={item.label} className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--text-primary)]">
                    {item.value}
                  </p>
                  {item.detail && (
                    <p className="mt-0.5 text-xs text-[var(--text-tertiary)] leading-snug truncate">
                      {item.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tab nav ─────────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-b border-[var(--border-glass)] bg-[var(--surf-base)]">
          <div className="flex flex-wrap gap-2">
            {PROJECT_ROUTE_TABS.map((tab) => {
              const to = getProjectTabPath(slug, tab.to);
              const active =
                pathname === to ||
                (to !== `/project/${slug}` && pathname.startsWith(`${to}/`));

              return (
                <Link
                  key={tab.label}
                  to={tab.to}
                  params={{ slug }}
                  search={projectSearch}
                  className={[
                    'tab rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'active text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)]',
                  ].join(' ')}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <div className="p-6">
          <ProjectRouteShellProvider value={shellContext}>
            {children}
          </ProjectRouteShellProvider>
        </div>
      </SoftPanel>
    </PageContainer>
  );
}
