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
      className="relative px-5 py-4 pb-5 genie-surface genie-surface--hero rounded-t-lg"
      style={{ boxShadow: 'none' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              {subtitle}
            </p>
          )}
          {statusLine && (
            <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
              {statusLine}
            </p>
          )}
          {nextAction && (
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              {nextAction}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {summaryItems.length > 0 && (
        <div
          className="mt-4 pt-3 border-t border-[var(--border-glass-soft)] grid gap-x-5 gap-y-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(summaryItems.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {summaryItems.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                {item.label}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
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

      {heroContent && (
        <div className="mt-5 pt-4 border-t border-[var(--border-glass-soft)]">
          {heroContent}
        </div>
      )}
      {/* bottom separator — sits below gradient, above white content */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--border-glass-soft)]" />
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
      <div className="p-4">
        {(primaryTitle || primarySubtitle) && (
          <div className="mb-3">
            {primaryTitle && (
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {primaryTitle}
              </h2>
            )}
            {primarySubtitle && (
              <p className="text-xs text-[var(--text-secondary)] leading-snug mt-0.5">
                {primarySubtitle}
              </p>
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
