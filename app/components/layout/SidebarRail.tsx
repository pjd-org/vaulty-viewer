import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { SidebarRail as GenieSidebarRail } from '@vault/ui'

const NAV_ITEMS = [
  { label: 'Home',      icon: '🏠', to: '/'          as const },
  { label: 'Projects',  icon: '📁', to: '/projects'  as const },
  { label: 'Inbox',     icon: '📥', to: '/inbox'     as const },
  { label: 'Huey',      icon: '🤖', to: '/huey'      as const },
  { label: 'COD',       icon: '⚡', to: '/cod-status' as const },
  { label: 'Knowledge', icon: '🧠', to: '/knowledge' as const },
  { label: 'Avatar',    icon: '👤', to: '/avatar'    as const },
] as const

type NavTo = (typeof NAV_ITEMS)[number]['to']

function RailItem({ label, icon, to, active }: { label: string; icon: string; to: NavTo; active: boolean }) {
  return (
    <Link
      to={to}
      title={label}
      aria-label={label}
      className={[
        'flex items-center justify-center w-10 h-10 rounded-xl text-lg transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800',
      ].join(' ')}
    >
      {icon}
    </Link>
  )
}

export function SidebarRail() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  function isActive(to: NavTo): boolean {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  const navItems = NAV_ITEMS.map(({ label, icon, to }) => (
    <RailItem key={to} label={label} icon={icon} to={to} active={isActive(to)} />
  ))

  const settingsItem = (
    <button
      title="Settings"
      aria-label="Settings"
      className="flex items-center justify-center w-10 h-10 rounded-xl text-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
    >
      ⚙️
    </button>
  )

  return <GenieSidebarRail top={navItems} bottom={settingsItem} />
}
