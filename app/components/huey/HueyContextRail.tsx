import React from 'react'
import { SoftPanel, SectionHeader } from '../layout'
import { PrimaryButton, SoftChip } from '../ui'
import type { ThreadRecord, IntentTemplate, IntentType } from '../../../src/lib/huey-intents'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function groupByDate(threads: ThreadRecord[]) {
  const now = Date.now()
  const DAY = 86_400_000
  const today: ThreadRecord[] = []
  const yesterday: ThreadRecord[] = []
  const older: ThreadRecord[] = []

  for (const t of threads) {
    const age = now - t.timestamp
    if (age < DAY) today.push(t)
    else if (age < 2 * DAY) yesterday.push(t)
    else older.push(t)
  }

  const groups: { label: string; items: ThreadRecord[] }[] = []
  if (today.length) groups.push({ label: 'Today', items: today })
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday })
  if (older.length) groups.push({ label: 'Earlier', items: older })
  return groups
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HueyContextRailProps {
  threads: ThreadRecord[]
  activeThreadId: string | null
  onSelectThread: (id: string) => void
  onNewThread: () => void
  intentTemplates: IntentTemplate[]
  activeIntent: IntentType | null
  onSelectIntent: (t: IntentType) => void
}

export function HueyContextRail({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  intentTemplates,
  activeIntent,
  onSelectIntent,
}: HueyContextRailProps) {
  const groups = groupByDate(threads)

  return (
    <SoftPanel variant="utility" className="h-full flex flex-col gap-4 !p-5">
      <PrimaryButton onClick={onNewThread} className="w-full justify-center rounded-full">
        New thread
      </PrimaryButton>

      <div>
        <SectionHeader title="Intent" className="mb-2" />
        <div className="flex flex-wrap gap-2">
          {intentTemplates.map((t) => (
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

      <div className="flex-1 min-h-0 overflow-y-auto">
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
                  thread.id === activeThreadId ? 'huey-thread-item--active' : 'huey-thread-item--idle',
                ].join(' ')}
                title={`${thread.title} · ${formatRelativeTime(thread.timestamp)}`}
              >
                <span aria-hidden="true" className="mr-1">{thread.emoji}</span>
                {thread.title}
              </button>
            ))}
          </div>
        ))}
      </div>
    </SoftPanel>
  )
}
