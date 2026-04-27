import React from 'react';

interface InboxSummaryLineProps {
  total: number;
  visible: number;
  filters?: string;
  loading?: boolean;
}

export function InboxSummaryLine({
  total,
  visible,
  filters,
  loading = false,
}: InboxSummaryLineProps) {
  return (
    <p className="text-xs text-[var(--text-secondary)]">
      {loading ? 'Refreshing…' : `${visible} of ${total} items`}
      {filters ? ` · ${filters}` : ''}
    </p>
  );
}
