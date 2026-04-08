import React from 'react';

import { PageContainer } from './PageContainer';
import { PageFrame } from './PageFrame';
import { SoftPanel } from './SoftPanel';
import { SummaryRow, type SummaryRowItem } from './SummaryRow';

interface WorkspaceScaffoldProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  summaryItems?: readonly SummaryRowItem[];
  primaryTitle: string;
  primarySubtitle?: string;
  primary: React.ReactNode;
  asideTitle?: string;
  asideSubtitle?: string;
  aside?: React.ReactNode;
}

export function WorkspaceScaffold({
  title,
  subtitle,
  actions,
  summaryItems = [],
  primaryTitle,
  primarySubtitle,
  primary,
  asideTitle,
  asideSubtitle,
  aside,
}: WorkspaceScaffoldProps) {
  return (
    <PageContainer>
      <PageFrame title={title} subtitle={subtitle} actions={actions}>
        <SummaryRow items={summaryItems} />
        {aside ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
            <SoftPanel
              title={primaryTitle}
              subtitle={primarySubtitle}
              variant="elevated"
              className="min-h-[420px]"
            >
              {primary}
            </SoftPanel>
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
          <SoftPanel
            title={primaryTitle}
            subtitle={primarySubtitle}
            variant="elevated"
            className="min-h-[420px]"
          >
            {primary}
          </SoftPanel>
        )}
      </PageFrame>
    </PageContainer>
  );
}
