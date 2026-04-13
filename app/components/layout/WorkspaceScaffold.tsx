import React from 'react';

import { PageContainer } from './PageContainer';
import { SoftPanel } from './SoftPanel';
import type { SummaryRowItem } from './SummaryRow';

interface WorkspaceScaffoldProps {
  title: string;
  subtitle?: string;
  /** Short current-state line shown in the panel header */
  statusLine?: string;
  /** Suggested next-action prompt shown in the panel header */
  nextAction?: string;
  actions?: React.ReactNode;
  /** Stat items rendered as an inline strip inside the hero header */
  summaryItems?: readonly SummaryRowItem[];
  /** Optional extra hero content rendered under summary items */
  heroContent?: React.ReactNode;
  primaryTitle: string;
  primarySubtitle?: string;
  primary: React.ReactNode;
  asideTitle?: string;
  asideSubtitle?: string;
  aside?: React.ReactNode;
}

/**
 * Header section rendered flush at the top of the primary SoftPanel.
 * Uses the hero gradient as the panel's own header — no nested card.
 * When summaryItems are provided they appear as a compact stat strip
 * inside the hero area, separated by a subtle divider.
 */
function PanelHero({
  title,
  subtitle,
  statusLine,
  nextAction,
  actions,
  summaryItems = [],
  heroContent,
}: {
  title: string;
  subtitle?: string;
  statusLine?: string;
  nextAction?: string;
  actions?: React.ReactNode;
  summaryItems?: readonly SummaryRowItem[];
  heroContent?: React.ReactNode;
}) {
  return (
    <div
      className="relative px-6 py-5 pb-6 genie-surface--hero rounded-t-lg"
      style={{ boxShadow: 'none' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
          )}
          {statusLine && (
            <p className="mt-1 text-sm font-medium text-slate-700">
              {statusLine}
            </p>
          )}
          {nextAction && (
            <p className="mt-1 text-xs text-slate-400">{nextAction}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {summaryItems.length > 0 && (
        <div
          className="mt-5 pt-4 border-t border-slate-200/60 grid gap-x-6 gap-y-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(summaryItems.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {summaryItems.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-slate-800">
                {item.value}
              </p>
              {item.detail && (
                <p className="mt-0.5 text-xs text-slate-500 leading-snug truncate">
                  {item.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {heroContent && (
        <div className="mt-5 pt-4 border-t border-slate-200/60">
          {heroContent}
        </div>
      )}
      {/* bottom separator — sits below gradient, above white content */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-200/80" />
    </div>
  );
}

export function WorkspaceScaffold({
  title,
  subtitle,
  statusLine,
  nextAction,
  actions,
  summaryItems = [],
  heroContent,
  primaryTitle,
  primarySubtitle,
  primary,
  asideTitle,
  asideSubtitle,
  aside,
}: WorkspaceScaffoldProps) {
  const primaryPanel = (
    <SoftPanel
      variant="elevated"
      className="min-h-[420px] overflow-hidden"
      noPadding
    >
      <PanelHero
        title={title}
        subtitle={subtitle}
        statusLine={statusLine}
        nextAction={nextAction}
        actions={actions}
        summaryItems={summaryItems}
        heroContent={heroContent}
      />
      <div className="p-6">
        {(primaryTitle || primarySubtitle) && (
          <div className="mb-4">
            {primaryTitle && (
              <h2 className="text-base font-semibold text-slate-800">
                {primaryTitle}
              </h2>
            )}
            {primarySubtitle && (
              <p className="text-sm text-muted-foreground">{primarySubtitle}</p>
            )}
          </div>
        )}
        {primary}
      </div>
    </SoftPanel>
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        {aside ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
            {primaryPanel}
            <SoftPanel
              title={asideTitle ?? ''}
              subtitle={asideSubtitle}
              variant="utility"
              className="min-h-[420px]"
            >
              {aside}
            </SoftPanel>
          </div>
        ) : (
          primaryPanel
        )}
      </div>
    </PageContainer>
  );
}
