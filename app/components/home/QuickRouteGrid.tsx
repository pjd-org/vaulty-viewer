import React from 'react';
import { Link } from '@tanstack/react-router';

export function QuickRouteGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        to="/work"
        search={{}}
        className="genie-surface genie-surface--utility p-4 transition-transform block hover:-translate-y-0.5"
      >
        <div className="text-xl mb-2">📁</div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">Work</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Projects & tasks
        </p>
      </Link>

      <Link
        to="/inbox"
        search={{}}
        className="genie-surface genie-surface--utility p-4 transition-transform block hover:-translate-y-0.5"
      >
        <div className="text-xl mb-2">📥</div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Inbox
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Triage queue
        </p>
      </Link>

      <Link
        to="/huey"
        className="genie-surface genie-surface--utility p-4 transition-transform block hover:-translate-y-0.5"
      >
        <div className="text-xl mb-2">🤖</div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">Huey</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Guided assistant
        </p>
      </Link>

      <Link
        to="/knowledge"
        search={{}}
        className="genie-surface genie-surface--utility p-4 transition-transform block hover:-translate-y-0.5"
      >
        <div className="text-xl mb-2">🔍</div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Knowledge
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Browse &amp; discover
        </p>
      </Link>
    </div>
  );
}
