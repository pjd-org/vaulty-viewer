import React, { useState, useEffect, useMemo } from 'react';
import { SoftPanel, SectionHeader } from '../layout';
import { PrimaryButton, SoftChip } from '../ui';
import type {
  ThreadRecord,
  IntentTemplate,
  IntentType,
} from '../../../src/lib/huey-intents';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function groupByDate(threads: ThreadRecord[]) {
  const now = Date.now();
  const DAY = 86_400_000;
  const today: ThreadRecord[] = [];
  const yesterday: ThreadRecord[] = [];
  const older: ThreadRecord[] = [];

  for (const t of threads) {
    const age = now - t.timestamp;
    if (age < DAY) today.push(t);
    else if (age < 2 * DAY) yesterday.push(t);
    else older.push(t);
  }

  const groups: { label: string; items: ThreadRecord[] }[] = [];
  if (today.length) groups.push({ label: 'Today', items: today });
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
  if (older.length) groups.push({ label: 'Earlier', items: older });
  return groups;
}

// Workflow category grouping — local since IntentTemplate has no category field
const WORKFLOW_GROUPS: { label: string; ids: IntentType[] }[] = [
  { label: 'Execution', ids: ['plan_next_step', 'generate_code'] },
  { label: 'Memory', ids: ['review_spec', 'summarize_state'] },
  { label: 'Debug', ids: ['debug_blocker'] },
  { label: 'Free', ids: ['freeform'] },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HueyContextRailProps {
  threads: ThreadRecord[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  intentTemplates: IntentTemplate[];
  activeIntent: IntentType | null;
  onSelectIntent: (t: IntentType) => void;
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

export function HueyContextRail({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  intentTemplates,
  activeIntent,
  onSelectIntent,
  accentColor,
}: HueyContextRailProps) {
  const accent = accentColor ?? 'var(--a-sky)';
  const [groups, setGroups] = useState<
    { label: string; items: ThreadRecord[] }[]
  >([]);

  const [workflowSearch, setWorkflowSearch] = useState('');

  useEffect(() => {
    setGroups(groupByDate(threads));
  }, [threads]);

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    const q = workflowSearch.trim().toLowerCase();
    if (!q) return intentTemplates;
    return intentTemplates.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [intentTemplates, workflowSearch]);

  // Build grouped views from filtered list
  const visibleGroups = useMemo(() => {
    if (workflowSearch.trim()) {
      // When searching, show all matches in a single flat group
      return filteredTemplates.length > 0
        ? [{ label: 'Results', items: filteredTemplates }]
        : [];
    }
    return WORKFLOW_GROUPS.map((g) => ({
      label: g.label,
      items: intentTemplates.filter((t) => g.ids.includes(t.id)),
    })).filter((g) => g.items.length > 0);
  }, [filteredTemplates, intentTemplates, workflowSearch]);

  return (
    <SoftPanel variant="utility" className="h-full flex flex-col gap-4 !p-5">
      <PrimaryButton
        onClick={onNewThread}
        className="w-full justify-center rounded-full"
      >
        New thread
      </PrimaryButton>

      <div>
        <SectionHeader title="Workflows" className="mb-2" />
        <p className="text-xs text-[var(--text-tertiary)] mb-2">
          Pick a mode to focus the conversation, or just type.
        </p>

        {/* Search */}
        <input
          type="search"
          value={workflowSearch}
          onChange={(e) => setWorkflowSearch(e.target.value)}
          placeholder="Filter workflows…"
          aria-label="Filter workflows"
          className="w-full rounded-full border border-[var(--border-glass)] bg-[var(--surf-glass)] px-3 py-1.5 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none mb-3"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = accent;
            e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, ${accent} 30%, transparent)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.boxShadow = '';
          }}
        />

        {/* Grouped workflow chips */}
        {visibleGroups.length === 0 && workflowSearch.trim() && (
          <p className="text-xs text-[var(--text-tertiary)]">
            No matching workflows.
          </p>
        )}
        <div className="space-y-3">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-1.5">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectIntent(t.id)}
                    className="appearance-none border-0 bg-transparent p-0 rounded-full"
                    title={t.description}
                  >
                    <SoftChip
                      label={t.label}
                      variant={activeIntent === t.id ? 'primary' : 'default'}
                      className="cursor-pointer"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <SectionHeader title="Recent" className="mb-2" />
        {groups.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)]">No history yet.</p>
        )}
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
              {group.label}
            </p>
            {group.items.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                suppressHydrationWarning
                className={[
                  'huey-thread-item w-full text-left text-sm rounded-xl px-3 py-2.5 block transition-colors',
                  thread.id === activeThreadId
                    ? 'huey-thread-item--active'
                    : 'huey-thread-item--idle',
                ].join(' ')}
                title={`${thread.title} · ${formatRelativeTime(thread.timestamp)}`}
              >
                <div className="flex items-center gap-1 truncate">
                  <span aria-hidden="true" className="shrink-0">
                    {thread.emoji}
                  </span>
                  <span className="truncate">{thread.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {thread.intent && (
                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide shrink-0">
                      {thread.intent.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span
                    className="text-[10px] text-[var(--text-tertiary)] shrink-0"
                    suppressHydrationWarning
                  >
                    {formatRelativeTime(thread.timestamp)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </SoftPanel>
  );
}
