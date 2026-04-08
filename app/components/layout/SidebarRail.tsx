import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { SidebarRail as GenieSidebarRail } from '@vault/ui';
import {
  Home,
  Inbox,
  Zap,
  Cpu,
  Briefcase,
  BookOpen,
  FileText,
  FolderKanban,
  MessageCircle,
  Heart,
  Share2,
  Clock,
  Archive,
  Bot,
  Settings,
  User,
  Activity,
} from 'lucide-react';
import { dispatchNavOverlay } from '../../../src/lib/nav-overlays';
import {
  VIEWER_OVERLAY_NAV,
  VIEWER_PRIMARY_NAV,
  VIEWER_SECONDARY_NAV,
  VIEWER_UTILITY_NAV,
} from '../../../src/lib/routes/v3-routing';

type NavTo =
  | (typeof VIEWER_PRIMARY_NAV)[number]['to']
  | (typeof VIEWER_SECONDARY_NAV)[number]['to']
  | (typeof VIEWER_UTILITY_NAV)[number]['to'];

// Map route paths → Lucide icon components
const ROUTE_ICONS: Record<string, React.ReactNode> = {
  '/': <Home size={18} />,
  '/inbox': <Inbox size={18} />,
  '/actions': <Zap size={18} />,
  '/automation': <Cpu size={18} />,
  '/work': <Briefcase size={18} />,
  '/knowledge': <BookOpen size={18} />,
  '/notes': <FileText size={18} />,
  '/portfolio': <FolderKanban size={18} />,
  '/bubble': <MessageCircle size={18} />,
  '/health': <Heart size={18} />,
  '/graph': <Share2 size={18} />,
  '/timeline': <Clock size={18} />,
  '/archive': <Archive size={18} />,
  '/huey': <Bot size={18} />,
  '/settings': <Settings size={18} />,
};

const OVERLAY_ICONS: Record<string, React.ReactNode> = {
  avatar: <User size={18} />,
  cod: <Activity size={18} />,
};

function RailItem({
  label,
  to,
  active,
}: {
  label: string;
  shortLabel: string;
  to: NavTo;
  active: boolean;
}) {
  return (
    <Link
      to={to as never}
      title={label}
      aria-label={label}
      className={[
        'flex h-10 w-10 items-center justify-center rounded-2xl border text-base leading-none transition-[transform,background-color,opacity]',
        active
          ? 'border-sky-500/30 bg-sky-100 text-sky-700 shadow-[0_12px_24px_rgba(56,189,248,0.12)]'
          : 'border-slate-200 bg-black/0 text-slate-500 hover:border-slate-300 hover:bg-black/5 hover:text-slate-700',
      ].join(' ')}
    >
      {ROUTE_ICONS[to] ?? <span className="text-xs">{label.slice(0, 2)}</span>}
    </Link>
  );
}

function OverlayItem({
  label,
  overlay,
  active,
}: {
  label: string;
  shortLabel: string;
  overlay: 'avatar' | 'cod';
  active: boolean;
}) {
  const onClick = () => dispatchNavOverlay(overlay);

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={[
        'flex h-10 w-10 items-center justify-center rounded-2xl border text-base leading-none transition-[transform,background-color]',
        active
          ? 'border-sky-500/30 bg-sky-100 text-sky-700 shadow-[0_12px_24px_rgba(56,189,248,0.12)]'
          : 'border-slate-200 bg-black/0 text-slate-500 hover:border-slate-300 hover:bg-black/5 hover:text-slate-700',
      ].join(' ')}
    >
      {OVERLAY_ICONS[overlay] ?? (
        <span className="text-xs">{label.slice(0, 2)}</span>
      )}
    </button>
  );
}

export function SidebarRail() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isActivePath = (to: NavTo): boolean => {
    if (to === '/') return pathname === '/';
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  const topItems = (
    <>
      {/* Core execution: Home, Inbox, Work */}
      {VIEWER_PRIMARY_NAV.map((item) => (
        <RailItem
          key={item.to}
          label={item.label}
          shortLabel={item.shortLabel}
          to={item.to}
          active={isActivePath(item.to)}
        />
      ))}
      {/* Divider — core vs supporting surfaces */}
      <div className="w-6 border-t border-slate-200 mx-auto" />
      {/* Supporting surfaces */}
      {VIEWER_SECONDARY_NAV.map((item) => (
        <RailItem
          key={item.to}
          label={item.label}
          shortLabel={item.shortLabel}
          to={item.to}
          active={isActivePath(item.to)}
        />
      ))}
    </>
  );

  const bottomItems = (
    <>
      <div className="w-6 border-t border-slate-200 mx-auto" />
      {VIEWER_UTILITY_NAV.map((item) => (
        <RailItem
          key={item.to}
          label={item.label}
          shortLabel={item.shortLabel}
          to={item.to}
          active={isActivePath(item.to)}
        />
      ))}
      {VIEWER_OVERLAY_NAV.map((item) => (
        <OverlayItem
          key={item.overlay}
          label={item.label}
          shortLabel={item.shortLabel}
          overlay={item.overlay}
          active={
            pathname ===
            `/${item.overlay === 'cod' ? 'cod-status' : item.overlay}`
          }
        />
      ))}
    </>
  );

  return (
    <GenieSidebarRail
      logo={
        <Link
          to={'/' as never}
          aria-label="Vault home"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-black/5 text-xs font-bold uppercase tracking-[0.12em] text-slate-700"
        >
          V3
        </Link>
      }
      top={topItems}
      bottom={bottomItems}
    />
  );
}
