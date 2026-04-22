import React, { useState } from 'react';

export type GraphHealthReport = {
  graph_generated: string;
  is_stale: boolean;
  node_count: number;
  edge_count: number;
  by_audience: { human: number; agent: number; bubble: number };
  unresolved_link_count: number;
};

interface KnowledgeHealthBannerProps {
  health: GraphHealthReport | null;
  loading?: boolean;
}

export function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - Date.parse(isoString);
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'unknown time ago';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(diffMs / 86_400_000);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export function KnowledgeHealthBanner({
  health,
  loading,
}: KnowledgeHealthBannerProps) {
  const dismissKey = health
    ? `knowledge-banner-dismissed-${health.graph_generated}`
    : null;
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissKey || typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(dismissKey) === '1';
  });

  if (loading) {
    return (
      <div className="knowledge-health-banner knowledge-health-banner--loading">
        <div className="skeleton skeleton--text" style={{ width: '60%' }} />
      </div>
    );
  }

  if (!health) return null;

  const handleDismiss = () => {
    if (dismissKey && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(dismissKey, '1');
    }
    setDismissed(true);
  };

  if (health.node_count === 0) {
    return (
      <div className="knowledge-health-banner knowledge-health-banner--error">
        No knowledge notes found — run the build pipeline first.
      </div>
    );
  }

  if (health.is_stale) {
    return (
      <div className="knowledge-health-banner knowledge-health-banner--warning">
        Graph index is stale (last built:{' '}
        {formatRelativeTime(health.graph_generated)})
      </div>
    );
  }

  if (health.unresolved_link_count > 50) {
    return (
      <div className="knowledge-health-banner knowledge-health-banner--warning">
        {health.unresolved_link_count} unresolved wikilinks detected
      </div>
    );
  }

  if (dismissed) return null;

  const total = health.node_count;
  return (
    <div className="knowledge-health-banner knowledge-health-banner--success">
      {total} note{total !== 1 ? 's' : ''} · built{' '}
      {formatRelativeTime(health.graph_generated)}
      <button
        className="knowledge-health-banner__dismiss cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export default KnowledgeHealthBanner;
