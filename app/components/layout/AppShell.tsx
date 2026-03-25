import React from 'react'

interface AppShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-6 py-6">
        <aside className="w-[240px] shrink-0 rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm sticky top-6 h-fit">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
