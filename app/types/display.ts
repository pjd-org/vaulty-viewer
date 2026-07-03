// Task display (human-readable)
export interface TaskDisplayMeta {
  durationLabel: string;
  focusLabel: string;
  focusVariant: 'low' | 'medium' | 'deep';
  scoreLabel: string | null;
  scoreVariant: 'best' | 'good' | 'lower' | null;
  effortLabel: string;
  statusLabel: string;
}

// Project summary display
export interface ProjectSummaryDisplay {
  id: string;
  title: string;
  statusLabel: string;
  statusVariant: 'success' | 'danger' | 'warning' | 'default';
  progressText: string;
  progressPercent: number;
  etaLabel: string | null;
  bestMoveTitle: string | null;
}

// COD display state (viewer redesign — distinct from src/lib/cod-status-logic CodDisplayState)
export interface CodDisplayState {
  severityLabel: string;
  severityVariant: 'clear' | 'warn' | 'rest' | 'stop' | 'unknown';
  headline: string;
  actionLabels: string[];
  constraintItems: { label: string; value: string }[];
  signalItems: {
    label: string;
    value: string;
    variant?: 'warn' | 'ok' | 'bad';
  }[];
  reasonText: string;
}

// Inbox item display
export interface InboxItemDisplay {
  title: string;
  originLabel: string;
  contextSnippet: string;
  ageLabel: string;
  actions: ('inspect' | 'promote' | 'reject')[];
  isBlocked: boolean;
  runId: string | null;
}

// Note header display
export interface NoteHeaderDisplay {
  title: string;
  typeLabel: string;
  statusLabel: string | null;
  statusVariant: 'default' | 'success' | 'warning' | 'danger';
  breadcrumbs: { label: string; path?: string }[];
  primaryActions: {
    label: string;
    variant: 'primary' | 'secondary';
    action: string;
  }[];
}
