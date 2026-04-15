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
        'h-full flex flex-col overflow-hidden rounded-[28px] border border-[var(--border-glass)] bg-[var(--surf-overlay)] shadow-[0_20px_44px_rgba(17,21,29,0.12)] backdrop-blur-[14px]',
        className
      )}
    >
      {(header || title || subtitle) && (
        <div className="shrink-0 border-b border-[var(--border-glass)] px-5 py-4">
          {header ?? (
            <div className="flex flex-col gap-1">
              {title && (
                <div className="text-lg font-semibold text-[var(--text-primary)]">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-sm text-[var(--text-secondary)]">
                  {subtitle}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          'grid min-h-0 flex-1',
          sidebar ? 'lg:grid-cols-[18rem_minmax(0,1fr)]' : 'grid-cols-1'
        )}
      >
        {sidebar && (
          <aside className="min-h-0 border-b border-[var(--border-glass)] lg:border-r lg:border-b-0">
            {sidebar}
          </aside>
        )}
        <main className="min-h-0">{children}</main>
      </div>

      {footer && (
        <div className="shrink-0 border-t border-[var(--border-glass)] px-5 py-4">
          {footer}
        </div>
      )}
    </section>
  );
}
