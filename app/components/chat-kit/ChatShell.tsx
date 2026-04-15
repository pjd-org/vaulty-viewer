import type { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

export interface ChatShellProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChatShell({
  title,
  subtitle,
  header,
  sidebar,
  footer,
  children,
  className,
}: ChatShellProps) {
  return (
    <section
      className={cn(
        'genie-surface genie-surface--overlay relative flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] text-[var(--text-primary)]',
        className
      )}
    >
      {(header || title || subtitle) && (
        <div className="shrink-0 border-b border-[var(--border-glass-soft)] bg-[color-mix(in_srgb,var(--surf-base)_88%,transparent)] px-6 py-5">
          {header ?? (
            <div className="flex flex-col gap-1.5">
              {title && (
                <div className="text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                  {subtitle}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          'grid min-h-0 flex-1 bg-[linear-gradient(180deg,rgba(255,255,255,0.46),rgba(255,255,255,0.24))]',
          sidebar ? 'lg:grid-cols-[18rem_minmax(0,1fr)]' : 'grid-cols-1'
        )}
      >
        {sidebar && (
          <aside className="min-h-0 border-b border-[var(--border-glass-soft)] bg-[color-mix(in_srgb,var(--surf-base)_82%,transparent)] lg:border-r lg:border-b-0">
            {sidebar}
          </aside>
        )}
        <main className="min-h-0">{children}</main>
      </div>

      {footer && (
        <div className="shrink-0 border-t border-[var(--border-glass-soft)] bg-[color-mix(in_srgb,var(--surf-base)_88%,transparent)] px-6 py-5">
          {footer}
        </div>
      )}
    </section>
  );
}
