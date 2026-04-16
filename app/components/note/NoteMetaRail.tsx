import React from 'react';
import { Link } from '@tanstack/react-router';
import { SoftPanel } from '../layout';
import { StatusPill, SoftChip } from '../ui';
import type { NoteLifecycle } from '../../../src/lib/note-logic';
import {
  stripMarkdownExtension,
  formatNoteLabel,
} from '../../../src/lib/note-logic';
import type { TaskStatus } from '../ui';

const KNOWN_STATUSES: TaskStatus[] = [
  'todo',
  'in-progress',
  'blocked',
  'done',
  'backlog',
];

const metaDtClass =
  'text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mb-1';
const sysDtClass =
  'text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]';
const sysValueClass = 'text-xs text-[var(--text-tertiary)] break-all mt-0.5';
const metaValueClass = 'text-sm text-[var(--text-secondary)]';

function isKnownStatus(s: string): s is TaskStatus {
  return (KNOWN_STATUSES as string[]).includes(s);
}

function getStringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function getNumberValue(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

interface RelatedNote {
  path: string;
  score: number;
  reasons?: string[];
}

interface NoteMetaRailProps {
  frontmatter: Record<string, unknown>;
  lifecycle: NoteLifecycle;
  relatedNotes: RelatedNote[];
  path?: string;
  workspaceLink?: boolean;
  workspaceTo?: string;
  workspaceParams?: Record<string, string>;
  workspaceSearch?: Record<string, unknown>;
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

export function NoteMetaRail({
  frontmatter,
  lifecycle,
  relatedNotes,
  path,
  workspaceLink = false,
  workspaceTo,
  workspaceParams,
  workspaceSearch,
  accentColor,
}: NoteMetaRailProps) {
  const accent = accentColor ?? 'var(--a-sky)';
  const rawStatus = getStringValue(frontmatter.status);
  const priority = getNumberValue(frontmatter.priority);
  const dueDate =
    getStringValue(frontmatter.dueDate) ?? getStringValue(frontmatter.due_date);
  const created = getStringValue(frontmatter.created);
  const tags = Array.isArray(frontmatter.tags)
    ? (frontmatter.tags as unknown[]).map((t) => String(t))
    : [];

  const formattedDue = dueDate
    ? new Date(dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;
  const formattedCreated = created
    ? new Date(created).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-4">
      {/* Metadata */}
      <SoftPanel title="Metadata">
        <dl className="space-y-3">
          {rawStatus && (
            <div>
              <dt className={metaDtClass}>Status</dt>
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
              <dt className={metaDtClass}>Priority</dt>
              <dd>
                <SoftChip
                  label={`P${priority} · High priority`}
                  variant="warning"
                />
              </dd>
            </div>
          )}
          {priority !== null && priority < 7 && (
            <div>
              <dt className={metaDtClass}>Priority</dt>
              <dd className={metaValueClass}>P{priority}</dd>
            </div>
          )}
          {formattedDue && (
            <div>
              <dt className={metaDtClass}>Due</dt>
              <dd className={metaValueClass}>{formattedDue}</dd>
            </div>
          )}
          {tags.length > 0 && (
            <div>
              <dt className={metaDtClass}>Tags</dt>
              <dd className="flex flex-wrap gap-1.5 mt-1">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    to="/"
                    search={{ q: tag, collection: 'all' }}
                    className="text-[11px] px-2 py-0.5 bg-[var(--surf-utility)] text-[var(--text-secondary)] rounded-full transition-colors"
                    style={
                      {
                        '--tag-hover-bg': `color-mix(in srgb,${accent} 10%,transparent)`,
                      } as React.CSSProperties
                    }
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLAnchorElement
                      ).style.backgroundColor =
                        `color-mix(in srgb,${accent} 10%,transparent)`;
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        'var(--text-info)';
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLAnchorElement
                      ).style.backgroundColor = '';
                      (e.currentTarget as HTMLAnchorElement).style.color = '';
                    }}
                  >
                    #{tag}
                  </Link>
                ))}
              </dd>
            </div>
          )}
          {formattedCreated && (
            <div>
              <dt className={metaDtClass}>Created</dt>
              <dd className={metaValueClass}>{formattedCreated}</dd>
            </div>
          )}
        </dl>
      </SoftPanel>

      {/* Related notes */}
      <SoftPanel title="Related">
        {relatedNotes.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)]">
            No related notes found yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {relatedNotes.map((related) => {
              const slug = stripMarkdownExtension(related.path);
              const label = formatNoteLabel(slug.split('/').pop() ?? slug);
              const collection = slug.split('/')[0] ?? '';
              return (
                <Link
                  key={related.path}
                  to={workspaceLink ? (workspaceTo ?? '/knowledge') : '/note'}
                  params={workspaceLink ? workspaceParams : undefined}
                  search={
                    workspaceLink
                      ? { ...(workspaceSearch ?? {}), noteId: slug }
                      : { p: slug }
                  }
                  className="block p-2.5 rounded-xl border border-[var(--border-glass-soft)] bg-[var(--surf-utility)] transition-all group"
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.backgroundColor = `color-mix(in srgb,${accent} 8%,transparent)`;
                    el.style.borderColor = `color-mix(in srgb,${accent} 15%,transparent)`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.backgroundColor = '';
                    el.style.borderColor = '';
                  }}
                >
                  <p className="text-xs font-medium text-[var(--text-secondary)] truncate group-hover:text-[var(--text-info)]">
                    {label}
                  </p>
                  {collection && (
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                      {collection}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </SoftPanel>

      {/* System (collapsed) */}
      <details className="rounded-[28px] border border-[var(--border-glass)] bg-[var(--surf-base)] shadow-sm overflow-hidden">
        <summary className="px-6 py-4 text-xs font-medium text-[var(--text-tertiary)] cursor-pointer hover:text-[var(--text-secondary)] select-none list-none flex items-center justify-between">
          <span>System</span>
          <span aria-hidden="true" className="opacity-50">
            ▸
          </span>
        </summary>
        <div className="px-6 pb-5 space-y-3">
          {lifecycle.source !== 'canonical' && (
            <div>
              <p className={sysDtClass}>Source</p>
              <p className={sysValueClass}>{lifecycle.source}</p>
            </div>
          )}
          {lifecycle.runId && (
            <div>
              <p className={sysDtClass}>Run ID</p>
              <p className={sysValueClass}>{lifecycle.runId}</p>
            </div>
          )}
          {lifecycle.targetPath && (
            <div>
              <p className={sysDtClass}>Target</p>
              <p className={sysValueClass}>{lifecycle.targetPath}</p>
            </div>
          )}
          {lifecycle.reviewStatus && (
            <div>
              <p className={sysDtClass}>Review</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {lifecycle.reviewStatus}
              </p>
            </div>
          )}
          {path && (
            <div>
              <p className={sysDtClass}>Path</p>
              <p className={sysValueClass}>{path}</p>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
