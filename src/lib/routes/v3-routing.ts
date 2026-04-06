import type { NavOverlay } from '../nav-overlays';

export interface ViewerRouteNavItem {
  label: string;
  shortLabel: string;
  to: string;
}

export interface ViewerOverlayNavItem {
  label: string;
  shortLabel: string;
  overlay: NavOverlay;
}

export const VIEWER_TOP_LEVEL_PATHS = [
  '/',
  '/inbox',
  '/actions',
  '/automation',
  '/work',
  '/knowledge',
  '/notes',
  '/portfolio',
  '/bubble',
  '/health',
  '/graph',
  '/timeline',
  '/settings',
  '/archive',
] as const;

export const VIEWER_PRIMARY_NAV: readonly ViewerRouteNavItem[] = [
  { label: 'Home', shortLabel: '⌂', to: '/' },
  { label: 'Inbox', shortLabel: '✉', to: '/inbox' },
  { label: 'Actions', shortLabel: '⚡', to: '/actions' },
  { label: 'Automation', shortLabel: '⚙', to: '/automation' },
  { label: 'Work', shortLabel: '◎', to: '/work' },
  { label: 'Knowledge', shortLabel: '◈', to: '/knowledge' },
  { label: 'Notes', shortLabel: '◻', to: '/notes' },
  { label: 'Portfolio', shortLabel: '▣', to: '/portfolio' },
  { label: 'Bubble', shortLabel: '◉', to: '/bubble' },
  { label: 'Health', shortLabel: '♡', to: '/health' },
  { label: 'Graph', shortLabel: '⬡', to: '/graph' },
  { label: 'Timeline', shortLabel: '↦', to: '/timeline' },
  { label: 'Archive', shortLabel: '⊞', to: '/archive' },
] as const;

export const VIEWER_UTILITY_NAV: readonly ViewerRouteNavItem[] = [
  { label: 'Huey', shortLabel: '✦', to: '/huey' },
  { label: 'Settings', shortLabel: '⚒', to: '/settings' },
] as const;

export const VIEWER_OVERLAY_NAV: readonly ViewerOverlayNavItem[] = [
  { label: 'Avatar', shortLabel: '⬟', overlay: 'avatar' },
  { label: 'COD', shortLabel: '⬡', overlay: 'cod' },
] as const;

export const PROJECT_ROUTE_TABS = [
  { label: 'Overview', to: '/project/$slug' },
  { label: 'Tasks', to: '/project/$slug/tasks' },
  { label: 'Knowledge', to: '/project/$slug/knowledge' },
  { label: 'Automation', to: '/project/$slug/automation' },
  { label: 'Timeline', to: '/project/$slug/timeline' },
  { label: 'Dependencies', to: '/project/$slug/dependencies' },
  { label: 'Risks', to: '/project/$slug/risks' },
  { label: 'Settings', to: '/project/$slug/settings' },
] as const;

export type ProjectRouteTabPath = (typeof PROJECT_ROUTE_TABS)[number]['to'];

export function getProjectTabPath(
  slug: string,
  to: ProjectRouteTabPath = '/project/$slug'
): string {
  return to.replace('$slug', encodeURIComponent(slug));
}

export function getLegacyViewerRedirect(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (normalized === '/projects') {
    return '/work';
  }

  const projectMatch = normalized.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    return `/project/${projectMatch[1]}`;
  }

  return null;
}

export function isShellHiddenPath(pathname: string): boolean {
  return pathname === '/login' || pathname === '/oauth/consent';
}
