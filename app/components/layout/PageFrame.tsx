import React from 'react';

interface PageFrameProps {
  title: string;
  subtitle?: string;
  /** Short line describing current state, e.g. "3 items pending review" */
  statusLine?: string;
  /** Suggested next action shown as a muted prompt, e.g. "→ Open Inbox to triage" */
  nextAction?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageFrame({
  title,
  subtitle,
  statusLine,
  nextAction,
  actions,
  children,
}: PageFrameProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-[28px] p-6 genie-surface genie-surface--hero genie-layer-hero">
        <div className="genie-content flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
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
      </header>
      {children}
    </div>
  );
}
