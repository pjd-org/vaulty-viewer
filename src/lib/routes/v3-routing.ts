import type { NavOverlay } from '../nav-overlays';

export interface ViewerRouteNavItem {
  label: string;
  shortLabel: string;
  to: string;
  group?: 'core' | 'knowledge' | 'system';
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

/** Primary destinations — shown at the top of the rail, grouped by intent. */
export const VIEWER_PRIMARY_NAV: readonly ViewerRouteNavItem[] = [
  // Core execution group
  { label: 'Home', shortLabel: '⌂', to: '/', group: 'core' },
  { label: 'Inbox', shortLabel: '✉', to: '/inbox', group: 'core' },
  { label: 'Work', shortLabel: '◎', to: '/work', group: 'core' },
  { label: 'Agent Shell', shortLabel: '⬡', to: '/agent-shell', group: 'core' },
] as const;

/** Secondary destinations — supporting surfaces, shown below a divider. */
export const VIEWER_SECONDARY_NAV: readonly ViewerRouteNavItem[] = [
  { label: 'Knowledge', shortLabel: '◈', to: '/knowledge', group: 'knowledge' },
  { label: 'Notes', shortLabel: '◻', to: '/notes', group: 'knowledge' },
  { label: 'New Note', shortLabel: '✦', to: '/note-new', group: 'knowledge' },
  { label: 'Graph', shortLabel: '⬡', to: '/graph', group: 'knowledge' },
  { label: 'Actions', shortLabel: '⚡', to: '/actions', group: 'system' },
  { label: 'Automation', shortLabel: '⚙', to: '/automation', group: 'system' },
  { label: 'Portfolio', shortLabel: '▣', to: '/portfolio', group: 'system' },
  { label: 'Bubble', shortLabel: '◉', to: '/bubble', group: 'system' },
  { label: 'Health', shortLabel: '♡', to: '/health', group: 'system' },
  { label: 'Timeline', shortLabel: '↦', to: '/timeline', group: 'system' },
  { label: 'Archive', shortLabel: '⊞', to: '/archive', group: 'system' },
] as const;

export const VIEWER_UTILITY_NAV: readonly ViewerRouteNavItem[] = [
  { label: 'Primary Agent', shortLabel: '✦', to: '/huey' },
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
