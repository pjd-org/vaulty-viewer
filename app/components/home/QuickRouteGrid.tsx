import React from 'react';
import { Link } from '@tanstack/react-router';

const routeTileClass =
  'p-4 transition-transform block hover:-translate-y-0.5 bg-[var(--surf-glass)] border border-[var(--border-glass-default)] shadow-sm backdrop-blur-[var(--blur-lg)] rounded-[24px]';
const routeTitleClass = 'text-sm font-semibold text-[var(--text-primary)]';
const routeSubClass = 'text-xs text-[var(--text-secondary)] mt-0.5';

export function QuickRouteGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link to="/work" search={{}} className={routeTileClass}>
        <div className="text-xl mb-2">📁</div>
        <p className={routeTitleClass}>Work</p>
        <p className={routeSubClass}>Projects & tasks</p>
      </Link>

      <Link to="/inbox" search={{}} className={routeTileClass}>
        <div className="text-xl mb-2">📥</div>
        <p className={routeTitleClass}>Inbox</p>
        <p className={routeSubClass}>Triage queue</p>
      </Link>

      <Link to="/primary-agent" className={routeTileClass}>
        <div className="text-xl mb-2">🤖</div>
        <p className={routeTitleClass}>Primary Agent</p>
        <p className={routeSubClass}>Guided assistant</p>
      </Link>

      <Link to="/knowledge" search={{}} className={routeTileClass}>
        <div className="text-xl mb-2">🔍</div>
        <p className={routeTitleClass}>Knowledge</p>
        <p className={routeSubClass}>Browse &amp; discover</p>
      </Link>
    </div>
  );
}
