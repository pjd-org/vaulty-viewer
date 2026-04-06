import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { SidebarRail as GenieSidebarRail } from '@vault/ui';
import { dispatchNavOverlay } from '../../../src/lib/nav-overlays';
import {
  VIEWER_OVERLAY_NAV,
  VIEWER_PRIMARY_NAV,
  VIEWER_UTILITY_NAV,
} from '../../../src/lib/routes/v3-routing';

type NavTo =
  | (typeof VIEWER_PRIMARY_NAV)[number]['to']
  | (typeof VIEWER_UTILITY_NAV)[number]['to'];

function RailItem({
  label,
  shortLabel,
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
        'flex h-10 w-10 items-center justify-center rounded-2xl border text-base leading-none transition-[transform,background-color]',
        active
          ? 'border-sky-300/30 bg-sky-300/15 text-slate-50 shadow-[0_12px_24px_rgba(56,189,248,0.18)]'
          : 'border-white/5 bg-white/0 text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-100',
      ].join(' ')}
    >
      {shortLabel}
    </Link>
  );
}

function OverlayItem({
  label,
  shortLabel,
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
          ? 'border-sky-300/30 bg-sky-300/15 text-slate-50 shadow-[0_12px_24px_rgba(56,189,248,0.18)]'
          : 'border-white/5 bg-white/0 text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-100',
      ].join(' ')}
    >
      {shortLabel}
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

  const topItems = VIEWER_PRIMARY_NAV.map((item) => (
    <RailItem
      key={item.to}
      label={item.label}
      shortLabel={item.shortLabel}
      to={item.to}
      active={isActivePath(item.to)}
    />
  ));

  const bottomItems = (
    <>
      <div className="w-6 border-t border-white/10 mx-auto" />
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
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-[0.12em] text-slate-100"
        >
          V3
        </Link>
      }
      top={topItems}
      bottom={bottomItems}
    />
  );
}
