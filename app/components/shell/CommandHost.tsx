import React from 'react';
import { useRouter } from '@tanstack/react-router';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Dialog,
  DialogContent,
} from '@vault/ui';
import { useUIStore } from '../../../src/store/ui';
import {
  VIEWER_PRIMARY_NAV,
  VIEWER_UTILITY_NAV,
} from '../../../src/lib/routes/v3-routing';
import { cn } from '../../../src/lib/utils';

const cmdShortLabelClass =
  'text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)] w-5';
const cmdKbdClass =
  'rounded border border-[var(--border-glass)] bg-[var(--surf-utility)] px-1 py-0.5';

interface UIState {
  command: {
    paletteOpen: boolean;
  };
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

export function CommandHost() {
  const open = useUIStore((s: UIState) => s.command.paletteOpen);
  const close = useUIStore((s: UIState) => s.closeCommandPalette);
  const toggle = useUIStore((s: UIState) => s.toggleCommandPalette);
  const router = useRouter();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  const navigate = (to: string) => {
    close();
    router.navigate({ to: to as never });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent
        aria-label="Command palette"
        className={cn(
          '!top-[20%] !max-w-lg !translate-y-0 !rounded-[20px] !border !border-[var(--border-glass)] !bg-[var(--surf-overlay)] !p-0 !shadow-2xl backdrop-blur-xl',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
        )}
      >
        <Command
          className="flex flex-col overflow-hidden rounded-[20px] !bg-transparent"
          shouldFilter
        >
          <div className="flex items-center gap-3 border-b border-[var(--border-glass-soft)] px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Cmd
            </span>
            <CommandInput
              placeholder="Go to a route, run a command…"
              aria-label="Command input"
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_28%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              autoFocus
            />
            <kbd className="rounded border border-[var(--border-glass)] bg-[var(--surf-utility)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
              ESC
            </kbd>
          </div>

          <CommandList className="!max-h-[360px] overflow-y-auto overscroll-contain p-2">
            <CommandEmpty className="px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">
              No results.
            </CommandEmpty>

            <CommandGroup heading={<SectionHeading>Navigate</SectionHeading>}>
              {VIEWER_PRIMARY_NAV.map(
                (item: { label: string; shortLabel: string; to: string }) => (
                  <PaletteItem
                    key={item.to}
                    value={`${item.label} ${item.to}`}
                    onSelect={() => navigate(item.to)}
                  >
                    <span className={cmdShortLabelClass}>{item.shortLabel}</span>
                    <span>{item.label}</span>
                  </PaletteItem>
                )
              )}
            </CommandGroup>

            <CommandSeparator className="my-1 h-px bg-[var(--border-glass-soft)]" />

            <CommandGroup heading={<SectionHeading>Utility</SectionHeading>}>
              {VIEWER_UTILITY_NAV.map(
                (item: { label: string; shortLabel: string; to: string }) => (
                  <PaletteItem
                    key={item.to}
                    value={`${item.label} ${item.to}`}
                    onSelect={() => navigate(item.to)}
                  >
                    <span className={cmdShortLabelClass}>{item.shortLabel}</span>
                    <span>{item.label}</span>
                  </PaletteItem>
                )
              )}
            </CommandGroup>
          </CommandList>

          <div className="flex items-center justify-between border-t border-[var(--border-glass-soft)] px-4 py-2">
            <span className="text-[10px] text-[var(--text-tertiary)]">
              Viewer V3
            </span>
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
              <kbd className={cmdKbdClass}>↑↓</kbd>
              <span>navigate</span>
              <kbd className={cmdKbdClass}>↵</kbd>
              <span>open</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
      {children}
    </span>
  );
}

function PaletteItem({
  value,
  onSelect,
  children,
}: {
  value: string;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <CommandItem
      value={value}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)]',
        'transition-colors hover:bg-[var(--surf-utility)]',
        'data-[selected=true]:bg-[color-mix(in_srgb,var(--surf-utility)_160%,transparent)] data-[selected=true]:text-[var(--text-primary)]'
      )}
    >
      {children}
    </CommandItem>
  );
}
