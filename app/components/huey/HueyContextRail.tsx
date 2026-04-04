import React from 'react';
import { Mic, MicOff } from 'lucide-react';
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
  voiceMode: boolean;
  onToggleVoice: () => void;
  voiceAvailable?: boolean;
}

export function HueyContextRail({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  intentTemplates,
  activeIntent,
  onSelectIntent,
  voiceMode,
  onToggleVoice,
  voiceAvailable = true,
}: HueyContextRailProps) {
  const groups = groupByDate(threads);

  return (
    <SoftPanel variant="utility" className="h-full flex flex-col gap-4 !p-5">
      <div className="flex gap-2">
        <PrimaryButton
          onClick={onNewThread}
          className="flex-1 justify-center rounded-full"
        >
          New thread
        </PrimaryButton>
        <button
          type="button"
          disabled={!voiceAvailable}
          onClick={onToggleVoice}
          aria-label={
            voiceMode ? 'Switch to text mode' : 'Switch to voice mode'
          }
          aria-pressed={voiceMode}
          title={
            !voiceAvailable
              ? 'Voice unavailable'
              : voiceMode
                ? 'Switch to text'
                : 'Switch to voice'
          }
          className={[
            'flex items-center justify-center size-9 rounded-full border transition-colors shrink-0',
            voiceMode
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary',
            !voiceAvailable && 'opacity-40 cursor-not-allowed',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {voiceMode ? (
            <MicOff className="size-4" />
          ) : (
            <Mic className="size-4" />
          )}
        </button>
      </div>

      <div>
        <SectionHeader title="Intent" className="mb-2" />
        <div className="flex flex-wrap gap-2">
          {intentTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectIntent(t.id)}
              className="appearance-none border-0 bg-transparent p-0 rounded-full"
              aria-label={`${t.label}${t.description ? ` — ${t.description}` : ''}`}
              aria-pressed={activeIntent === t.id}
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

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <SectionHeader title="Recent" className="mb-2" />
        {groups.length === 0 && (
          <p className="text-xs text-slate-400">No history yet.</p>
        )}
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              {group.label}
            </p>
            {group.items.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => onSelectThread(thread.id)}
                className={[
                  'huey-thread-item w-full text-left text-sm truncate rounded-xl px-3 py-2.5 block transition-colors',
                  thread.id === activeThreadId
                    ? 'huey-thread-item--active'
                    : 'huey-thread-item--idle',
                ].join(' ')}
                title={`${thread.title} · ${formatRelativeTime(thread.timestamp)}`}
              >
                <span aria-hidden="true" className="mr-1">
                  {thread.emoji}
                </span>
                {thread.title}
              </button>
            ))}
          </div>
        ))}
      </div>
    </SoftPanel>
  );
}
