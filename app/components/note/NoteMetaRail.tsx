import React from 'react'
import { Link } from '@tanstack/react-router'
import { SoftPanel } from '../layout'
import { StatusPill, SoftChip } from '../ui'
import type { NoteLifecycle } from '../../../src/lib/note-logic'
import { stripMarkdownExtension, formatNoteLabel } from '../../../src/lib/note-logic'
import type { TaskStatus } from '../ui'

const KNOWN_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'done', 'backlog']

function isKnownStatus(s: string): s is TaskStatus {
  return (KNOWN_STATUSES as string[]).includes(s)
}

function getStringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function getNumberValue(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

interface RelatedNote {
  path: string
  score: number
  reasons?: string[]
}

interface NoteMetaRailProps {
  frontmatter: Record<string, unknown>
  lifecycle: NoteLifecycle
  relatedNotes: RelatedNote[]
  path?: string
}

export function NoteMetaRail({ frontmatter, lifecycle, relatedNotes, path }: NoteMetaRailProps) {
  const rawStatus = getStringValue(frontmatter.status)
  const priority = getNumberValue(frontmatter.priority)
  const dueDate = getStringValue(frontmatter.dueDate) ?? getStringValue(frontmatter.due_date)
  const created = getStringValue(frontmatter.created)
  const tags = Array.isArray(frontmatter.tags)
    ? (frontmatter.tags as unknown[]).map((t) => String(t))
    : []

  const formattedDue = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  const formattedCreated = created
    ? new Date(created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="space-y-4">
      {/* Metadata */}
      <SoftPanel title="Metadata">
        <dl className="space-y-3">
          {rawStatus && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Status</dt>
              <dd>
                {isKnownStatus(rawStatus) ? (
                  <StatusPill status={rawStatus} />
                ) : (
                  <SoftChip label={rawStatus} variant="default" />
                )}
              </dd>
            </div>
          )}
          {priority !== null && priority >= 7 && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Priority</dt>
              <dd>
                <SoftChip label={`P${priority} · High priority`} variant="warning" />
              </dd>
            </div>
          )}
          {priority !== null && priority < 7 && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Priority</dt>
              <dd className="text-sm text-neutral-700">P{priority}</dd>
            </div>
          )}
          {formattedDue && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Due</dt>
              <dd className="text-sm text-neutral-700">{formattedDue}</dd>
            </div>
          )}
          {tags.length > 0 && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Tags</dt>
              <dd className="flex flex-wrap gap-1.5 mt-1">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    to="/"
                    search={{ q: tag, collection: 'all' }}
                    className="text-[11px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </dd>
            </div>
          )}
          {formattedCreated && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Created</dt>
              <dd className="text-sm text-neutral-700">{formattedCreated}</dd>
            </div>
          )}
        </dl>
      </SoftPanel>

      {/* Related notes */}
      <SoftPanel title="Related">
        {relatedNotes.length === 0 ? (
          <p className="text-xs text-neutral-400">No related notes found yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {relatedNotes.map((related) => {
              const slug = stripMarkdownExtension(related.path)
              const label = formatNoteLabel(slug.split('/').pop() ?? slug)
              const collection = slug.split('/')[0] ?? ''
              return (
                <Link
                  key={related.path}
                  to="/note"
                  search={{ p: slug }}
                  className="block p-2.5 rounded-xl border border-slate-100 bg-neutral-50 hover:bg-blue-50 hover:border-blue-100 transition-all group"
                >
                  <p className="text-xs font-medium text-neutral-700 truncate group-hover:text-blue-700">
                    {label}
                  </p>
                  {collection && (
                    <p className="text-[10px] text-neutral-400 mt-0.5">{collection}</p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </SoftPanel>

      {/* System (collapsed) */}
      <details className="rounded-[28px] border border-neutral-200 bg-surface shadow-sm overflow-hidden">
        <summary className="px-6 py-4 text-xs font-medium text-neutral-400 cursor-pointer hover:text-neutral-600 select-none list-none flex items-center justify-between">
          <span>System</span>
          <span className="opacity-50">▸</span>
        </summary>
        <div className="px-6 pb-5 space-y-3">
          {lifecycle.source !== 'canonical' && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">Source</p>
              <p className="text-xs text-neutral-400 break-all mt-0.5">{lifecycle.source}</p>
            </div>
          )}
          {lifecycle.runId && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">Run ID</p>
              <p className="text-xs text-neutral-400 break-all mt-0.5">{lifecycle.runId}</p>
            </div>
          )}
          {lifecycle.targetPath && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">Target</p>
              <p className="text-xs text-neutral-400 break-all mt-0.5">{lifecycle.targetPath}</p>
            </div>
          )}
          {lifecycle.reviewStatus && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">Review</p>
              <p className="text-xs text-neutral-400 mt-0.5">{lifecycle.reviewStatus}</p>
            </div>
          )}
          {path && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400">Path</p>
              <p className="text-xs text-neutral-400 break-all mt-0.5">{path}</p>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
