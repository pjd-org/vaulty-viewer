import React from 'react'
import { useRouter } from '@tanstack/react-router'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { useUIStore } from '../../../src/store/ui'
import { VIEWER_PRIMARY_NAV, VIEWER_UTILITY_NAV } from '../../../src/lib/routes/v3-routing'
import { cn } from '../../../src/lib/cn'

interface UIState {
  commandPaletteOpen: boolean
  closeCommandPalette: () => void
  toggleCommandPalette: () => void
}

export function CommandHost() {
  const open = useUIStore((s: UIState) => s.commandPaletteOpen)
  const close = useUIStore((s: UIState) => s.closeCommandPalette)
  const toggle = useUIStore((s: UIState) => s.toggleCommandPalette)
  const router = useRouter()

  // Cmd+K / Ctrl+K shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle])

  const navigate = (to: string) => {
    close()
    router.navigate({ to: to as never })
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-label="Command palette"
          className={cn(
            'fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2',
            'rounded-[20px] border border-white/10 bg-[#0f1117] shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
          )}
        >
          <Command className="flex flex-col overflow-hidden rounded-[20px]" shouldFilter>
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Cmd
              </span>
              <CommandInput
                placeholder="Go to a route, run a command…"
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                autoFocus
              />
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">
                ESC
              </kbd>
            </div>

            <CommandList className="max-h-[360px] overflow-y-auto overscroll-contain p-2">
              <CommandEmpty className="px-3 py-6 text-center text-sm text-slate-500">
                No results.
              </CommandEmpty>

              <CommandGroup heading={<SectionHeading>Navigate</SectionHeading>}>
                {VIEWER_PRIMARY_NAV.map((item: { label: string; shortLabel: string; to: string }) => (
                  <PaletteItem
                    key={item.to}
                    value={`${item.label} ${item.to}`}
                    onSelect={() => navigate(item.to)}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 w-5">
                      {item.shortLabel}
                    </span>
                    <span>{item.label}</span>
                  </PaletteItem>
                ))}
              </CommandGroup>

              <CommandSeparator className="my-1 h-px bg-white/5" />

              <CommandGroup heading={<SectionHeading>Utility</SectionHeading>}>
                {VIEWER_UTILITY_NAV.map((item: { label: string; shortLabel: string; to: string }) => (
                  <PaletteItem
                    key={item.to}
                    value={`${item.label} ${item.to}`}
                    onSelect={() => navigate(item.to)}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 w-5">
                      {item.shortLabel}
                    </span>
                    <span>{item.label}</span>
                  </PaletteItem>
                ))}
              </CommandGroup>
            </CommandList>

            <div className="flex items-center justify-between border-t border-white/5 px-4 py-2">
              <span className="text-[10px] text-slate-600">Viewer V3</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5">↑↓</kbd>
                <span>navigate</span>
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5">↵</kbd>
                <span>open</span>
              </div>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
      {children}
    </span>
  )
}

function PaletteItem({
  value,
  onSelect,
  children,
}: {
  value: string
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <CommandItem
      value={value}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300',
        'transition-colors hover:bg-white/5',
        'data-[selected=true]:bg-white/10 data-[selected=true]:text-slate-100',
      )}
    >
      {children}
    </CommandItem>
  )
}
