import type { NavOverlay } from '../nav-overlays'

export interface ViewerRouteNavItem {
  label: string
  shortLabel: string
  to: string
}

export interface ViewerOverlayNavItem {
  label: string
  shortLabel: string
  overlay: NavOverlay
}

export const VIEWER_TOP_LEVEL_PATHS = [
  '/',
  '/inbox',
  '/actions',
  '/automation',
  '/work',
  '/knowledge',
  '/portfolio',
  '/bubble',
  '/health',
  '/graph',
  '/timeline',
  '/settings',
  '/archive',
] as const

export const VIEWER_PRIMARY_NAV: readonly ViewerRouteNavItem[] = [
  { label: 'Home', shortLabel: 'Ho', to: '/' },
  { label: 'Inbox', shortLabel: 'In', to: '/inbox' },
  { label: 'Actions', shortLabel: 'Ac', to: '/actions' },
  { label: 'Automation', shortLabel: 'Au', to: '/automation' },
  { label: 'Work', shortLabel: 'Wo', to: '/work' },
  { label: 'Knowledge', shortLabel: 'Kn', to: '/knowledge' },
  { label: 'Portfolio', shortLabel: 'Po', to: '/portfolio' },
  { label: 'Bubble', shortLabel: 'Bu', to: '/bubble' },
  { label: 'Health', shortLabel: 'He', to: '/health' },
  { label: 'Graph', shortLabel: 'Gr', to: '/graph' },
  { label: 'Timeline', shortLabel: 'Ti', to: '/timeline' },
  { label: 'Archive', shortLabel: 'Ar', to: '/archive' },
] as const

export const VIEWER_UTILITY_NAV: readonly ViewerRouteNavItem[] = [
  { label: 'Huey', shortLabel: 'Hy', to: '/huey' },
  { label: 'Settings', shortLabel: 'Se', to: '/settings' },
] as const

export const VIEWER_OVERLAY_NAV: readonly ViewerOverlayNavItem[] = [
  { label: 'Avatar', shortLabel: 'Av', overlay: 'avatar' },
  { label: 'COD', shortLabel: 'Co', overlay: 'cod' },
] as const

export const PROJECT_ROUTE_TABS = [
  { label: 'Overview', to: '/project/$slug' },
  { label: 'Tasks', to: '/project/$slug/tasks' },
  { label: 'Knowledge', to: '/project/$slug/knowledge' },
  { label: 'Automation', to: '/project/$slug/automation' },
  { label: 'Timeline', to: '/project/$slug/timeline' },
  { label: 'Dependencies', to: '/project/$slug/dependencies' },
  { label: 'Risks', to: '/project/$slug/risks' },
  { label: 'Settings', to: '/project/$slug/settings' },
] as const

export type ProjectRouteTabPath = (typeof PROJECT_ROUTE_TABS)[number]['to']

export function getProjectTabPath(
  slug: string,
  to: ProjectRouteTabPath = '/project/$slug',
): string {
  return to.replace('$slug', encodeURIComponent(slug))
}

export function getLegacyViewerRedirect(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, '') || '/'

  if (normalized === '/projects') {
    return '/work'
  }

  const projectMatch = normalized.match(/^\/projects\/([^/]+)$/)
  if (projectMatch) {
    return `/project/${projectMatch[1]}`
  }

  return null
}

export function isShellHiddenPath(pathname: string): boolean {
  return pathname === '/login' || pathname === '/oauth/consent'
}
