import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

const NAV_ITEMS = [
  { label: 'Home', icon: '🏠', to: '/' as const },
  { label: 'Projects', icon: '📁', to: '/projects' as const },
  { label: 'Inbox', icon: '📥', to: '/inbox' as const },
  { label: 'Huey', icon: '🤖', to: '/huey' as const },
  { label: 'COD', icon: '⚡', to: '/cod-status' as const },
  { label: 'Knowledge', icon: '🧠', to: '/knowledge' as const },
  { label: 'Avatar', icon: '👤', to: '/avatar' as const },
] as const

type NavTo = (typeof NAV_ITEMS)[number]['to']

export function SidebarRail() {
  const router = useRouterState()
  const pathname = router.location.pathname

  function isActive(to: NavTo): boolean {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  return (
    <nav className="flex flex-col gap-1 h-full">
      <div className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, icon, to }) => (
          <Link
            key={to}
            to={to}
            className={[
              'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors',
              isActive(to)
                ? 'bg-primary/10 text-primary'
                : 'text-neutral-600 hover:bg-neutral-100',
            ].join(' ')}
          >
            <span className="text-base leading-none">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
      <div className="pt-4 border-t border-neutral-100">
        <button className="flex items-center gap-3 px-3 py-2 text-xs text-neutral-400 w-full rounded-xl hover:bg-neutral-100 transition-colors">
          <span className="text-base leading-none">⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </nav>
  )
}
