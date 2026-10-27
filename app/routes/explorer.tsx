/**
 * /explorer — Vault notes, Archives and Rejected, READ-ONLY.
 *
 * Two views, one component. The distinction that matters most is
 * live vs historical: a deleted record recovered from Git is shown differently
 * from a record that still exists, because treating them the same would imply
 * the live vault still contains something it does not.
 *
 * There is no restore, promote, delete, or edit control here. V1 is a reviewer
 * surface. Every mutation belongs to an owner-scoped review path with its own
 * authorization, and adding a button here would quietly turn browsing into a
 * write path.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { RouteLoadingState } from '../components/ui';
import { GlassSurface } from '@vault/ui';
import { AmbientSurface, SelectableCard } from '../components/v2';
import { roleForProvenance } from '../lib/design/role-mapping';
import { useViewerV2 } from '../lib/design/viewer-v2-context';
import { apiFetch } from '../../src/utils/api';
import { buildVaultDirectoryPage } from '../lib/vault-inventory';

export const Route = createFileRoute('/explorer')({
  component: ExplorerRoute,
});

// ---------------------------------------------------------------------------
// Types — mirror the API contract
// ---------------------------------------------------------------------------

type ExplorerView = 'vault' | 'archives' | 'rejected';
type RecordState = 'live' | 'historical';

interface ExplorerEntry {
  path: string;
  name: string;
  folder: string;
  state: RecordState;
  updatedAt?: string;
  deletedInCommit?: string;
  title?: string;
  tags?: string[];
  status?: string | null;
  size?: number;
  sha256?: string;
  runId?: string;
}

interface ExplorerPage {
  view: ExplorerView;
  folder: string;
  entries: ExplorerEntry[];
  folders: string[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

interface ExplorerPreview {
  view: ExplorerView;
  path: string;
  state: RecordState;
  markdown: string;
  title?: string;
  frontmatter: Record<string, unknown>;
  sha256?: string;
  deletedInCommit?: string;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

async function fetchPage(params: {
  view: ExplorerView;
  folder: string;
  search: string;
  status: string;
  tags: string[];
  history: boolean;
  offset: number;
 }): Promise<ExplorerPage> {
  if (params.view === 'vault') {
    const res = await apiFetch('/api/v1/notes?pattern=**%2F*.%7Bmd%2Cmdx%7D');
    if (res.status === 403) throw new ExplorerDenied('read');
    if (res.status === 401) throw new Error('Sign in to browse vault notes');
    if (!res.ok) throw new Error(`Vault inventory failed: ${res.status}`);
    const body = (await res.json()) as { structuredContent?: { notes?: unknown }; notes?: unknown };
    const notes = body.structuredContent?.notes ?? body.notes;
    if (!Array.isArray(notes)) throw new Error('Vault inventory response is unavailable');
    return buildVaultDirectoryPage(notes, {
      folder: params.folder, search: params.search,
      offset: params.offset, limit: PAGE_SIZE,
    });
  }
  const qs = new URLSearchParams();
  if (params.folder) qs.set('folder', params.folder);
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  for (const tag of params.tags) qs.append('tags', tag);
  if (params.history) qs.set('history', 'true');
  qs.set('offset', String(params.offset));
  qs.set('limit', String(PAGE_SIZE));

  const res = await apiFetch(`/api/v1/explorer/${params.view}?${qs.toString()}`);
  if (res.status === 403) throw new ExplorerDenied();
  if (!res.ok) throw new Error(`explorer list failed: ${res.status}`);
  return (await res.json()) as ExplorerPage;
}

async function fetchPreview(
  view: ExplorerView,
  path: string
): Promise<ExplorerPreview> {
  if (view === 'vault') {
    const res = await apiFetch(`/api/v1/notes/${encodeURIComponent(path)}`);
    if (res.status === 403) throw new ExplorerDenied('read');
    if (res.status === 401) throw new Error('Sign in to preview the note');
    if (!res.ok) throw new Error(`Note preview failed: ${res.status}`);
    const body = (await res.json()) as {
      structuredContent?: { content?: unknown; frontmatter?: unknown };
    };
    const note = body.structuredContent;
    if (!note || typeof note.content !== 'string') {
      throw new Error('Note preview response is unavailable');
    }
    const frontmatter =
      note.frontmatter && typeof note.frontmatter === 'object' &&
      !Array.isArray(note.frontmatter)
        ? note.frontmatter as Record<string, unknown>
        : {};
    return {
      view, path, state: 'live', markdown: note.content, frontmatter,
      title: typeof frontmatter.title === 'string' ? frontmatter.title : undefined,
    };
  }
  const qs = new URLSearchParams({ path });
  const res = await apiFetch(`/api/v1/explorer/${view}/preview?${qs.toString()}`);
  if (res.status === 403) throw new ExplorerDenied();
  if (!res.ok) throw new Error(`explorer preview failed: ${res.status}`);
  return (await res.json()) as ExplorerPreview;
}

class ExplorerDenied extends Error {
  constructor(scope: 'read' | 'review' = 'review') {
    super(`Explorer requires ${scope} access`);
    this.name = 'ExplorerDenied';
  }
}

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

/** Trailing path segment, for display. */
function leaf(pathValue: string): string {
  const parts = pathValue.split('/');
  return parts[parts.length - 1] ?? pathValue;
}

/** Parent folder, '' when already at the view root. */
function parentOf(folder: string, viewRoot: string): string | null {
  if (!folder || folder === viewRoot) return null;
  if (!viewRoot && !folder.includes('/')) return '';
  const idx = folder.lastIndexOf('/');
  const parent = idx > 0 ? folder.slice(0, idx) : viewRoot;
  return parent.length < viewRoot.length ? viewRoot : parent;
}

/**
 * State badge. Historical entries are visually distinct on purpose: they no
 * longer exist in the vault, and a reviewer must never mistake one for a live
 * record that happens to be old.
 */
function StateBadge({ state }: { state: RecordState }) {
  const isHistorical = state === 'historical';
  return (
    <span
      data-testid="explorer-state-badge"
      data-state={state}
      className={[
        'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        // The live badge used emerald-600 on a 10% tint, measured 3.37:1 —
        // below AA for small text. emerald-700 on the same tint clears it.
        isHistorical
          ? 'bg-muted text-muted-foreground line-through'
          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      ].join(' ')}
      title={
        isHistorical
          ? 'Deleted from the vault — visible only in Git history'
          : 'Present in the vault now'
      }
    >
      {isHistorical ? 'historical' : 'live'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Preview panel
// ---------------------------------------------------------------------------

function PreviewPanel({
  view,
  entry,
  onClose,
}: {
  view: ExplorerView;
  entry: ExplorerEntry;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<ExplorerPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPreview(null);
    setError(null);

    if (entry.state === 'historical') {
      // V1 does not reconstruct content from Git: showing bytes as if they were
      // current would blur the live/historical line this whole view rests on.
      setError('Historical record — content is not reconstructed in V1.');
      return;
    }

    fetchPreview(view, entry.path)
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Preview unavailable');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [view, entry.path, entry.state]);

  return (
    <GlassSurface
      variant="canvas"
      radius="2xl"
      shadow="sm"
      border="default"
      className="flex flex-col gap-3 p-4 text-sm"
      data-testid="explorer-preview"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StateBadge state={entry.state} />
            <span className="truncate font-medium">
              {preview?.title ?? entry.title ?? entry.name}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
            {entry.path}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          data-testid="explorer-preview-close"
        >
          Close
        </button>
      </div>

      {/* Provenance */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">State</dt>
        <dd>{entry.state}</dd>
        {entry.runId ? (
          <>
            <dt className="text-muted-foreground">Run</dt>
            <dd className="font-mono">{entry.runId}</dd>
          </>
        ) : null}
        {entry.sha256 ? (
          <>
            <dt className="text-muted-foreground">sha256</dt>
            <dd className="truncate font-mono">{entry.sha256}</dd>
          </>
        ) : null}
        {entry.deletedInCommit ? (
          <>
            <dt className="text-muted-foreground">Deleted in</dt>
            <dd className="font-mono">{entry.deletedInCommit.slice(0, 12)}</dd>
          </>
        ) : null}
        {entry.updatedAt ? (
          <>
            <dt className="text-muted-foreground">Deleted at</dt>
            <dd>{entry.updatedAt}</dd>
          </>
        ) : null}
      </dl>

      {error ? (
        <p className="rounded bg-muted/50 p-3 text-xs text-muted-foreground" data-testid="explorer-preview-error">
          {error}
        </p>
      ) : null}

      {preview ? (
        <>
          {Object.keys(preview.frontmatter).length > 0 ? (
            <details className="rounded bg-muted/30 p-2 text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                Frontmatter
              </summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]">
                {JSON.stringify(preview.frontmatter, null, 2)}
              </pre>
            </details>
          ) : null}
          {/*
            Markdown is rendered as plain text. The Explorer never executes or
            HTML-injects note content: a rejected record is attacker-influenced
            by definition, and previewing it must not become a script surface.
          */}
          <pre
            className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded bg-muted/30 p-3 font-mono text-[11px] leading-relaxed"
            data-testid="explorer-preview-body"
          >
            {preview.markdown}
          </pre>
        </>
      ) : null}
    </GlassSurface>
  );
}

// ---------------------------------------------------------------------------
// Main route
// ---------------------------------------------------------------------------

function ExplorerRoute() {
  const [view, setView] = useState<ExplorerView>('archives');
  const [folder, setFolder] = useState<string>('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [includeHistory, setIncludeHistory] = useState(false);
  const [offset, setOffset] = useState(0);

  const [page, setPage] = useState<ExplorerPage | null>(null);
  const [selected, setSelected] = useState<ExplorerEntry | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const viewRoot = view === 'vault' ? '' : view === 'archives' ? 'archive' : 'inbox/rejected';

  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput]
  );

  // Reset navigation when the view changes — folder paths are view-specific.
  useEffect(() => {
    setFolder('');
    setPage(null);
    setOffset(0);
    setSelected(null);
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(null);
    setError(null);
    setDenied(false);

    fetchPage({
      view,
      folder,
      search,
      status: statusFilter,
      tags,
      history: includeHistory,
      offset,
    })
      .then((p) => {
        if (cancelled) return;
        setPage(p);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ExplorerDenied) setDenied(true);
        else setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [view, folder, search, statusFilter, tags, includeHistory, offset]);

  const { select: selectAmbient } = useViewerV2();

  // Mirror the selected record into shared ambient state. Provenance decides the
  // role: staged/rejected/historical read as `source`, live records as `total`.
  // Hover never reaches this — only an explicit selection does.
  useEffect(() => {
    if (!selected) {
      selectAmbient(null);
      return;
    }
    selectAmbient({
      id: selected.path,
      role: roleForProvenance(selected.state === 'historical' ? 'historical' : 'live'),
    });
  }, [selected, selectAmbient]);

  const navigateTo = useCallback((next: string) => {
    setFolder(next);
    setOffset(0);
    setSelected(null);
  }, []);

  const parent = parentOf(page?.folder ?? folder, viewRoot);

  return (
    <WorkspaceScaffold
      title="Explorer"
      subtitle="Browse readable vault notes, archives and rejected records. Read-only."
      primaryTitle="Records"
      primarySubtitle="Filesystem inventory and reviewer records"
      primary={
      <div className="flex flex-col gap-4" data-testid="explorer-root">
        {/* View switch */}
        <div className="flex items-center gap-2" role="tablist">
          {(['vault', 'archives', 'rejected'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              // Use the canonical .tab styling: its active state is a dark
              // gradient with white text. The hand-rolled
              // bg-primary/text-primary-foreground pairing measured 3.21:1,
              // below the 4.5:1 AA floor, because #4f8cff is a fill colour.
              className={[
                'tab px-3 py-1.5 text-sm capitalize',
                view === v ? 'active font-medium' : 'hover:text-foreground',
              ].join(' ')}
              data-testid={`explorer-tab-${v}`}
            >
              {v}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            Read-only
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="Search path, title, tag…"
            className="min-w-[14rem] flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            data-testid="explorer-search"
          />
          {view !== 'vault' ? (
            <>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => {
              setTagsInput(e.target.value);
              setOffset(0);
            }}
            placeholder="tags (comma separated)"
            className="w-48 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            data-testid="explorer-tags"
          />
          <input
            type="text"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setOffset(0);
            }}
            placeholder="status"
            className="w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            data-testid="explorer-status"
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => {
                setIncludeHistory(e.target.checked);
                setOffset(0);
              }}
              data-testid="explorer-history-toggle"
            />
            Include deleted (Git history)
          </label>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Path search · Markdown / MDX</span>
          )}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => navigateTo(viewRoot)}
            className="rounded px-1.5 py-0.5 hover:bg-muted"
            data-testid="explorer-breadcrumb-root"
          >
            {viewRoot || 'vault'}
          </button>
          {(page?.folder ?? folder)
            .replace(viewRoot, '')
            .split('/')
            .filter(Boolean)
            .map((segment, i, all) => {
              const target = [viewRoot, ...all.slice(0, i + 1)].filter(Boolean).join('/');
              return (
                <React.Fragment key={target}>
                  <span>/</span>
                  <button
                    type="button"
                    onClick={() => navigateTo(target)}
                    className="rounded px-1.5 py-0.5 hover:bg-muted"
                  >
                    {segment}
                  </button>
                </React.Fragment>
              );
            })}
          {parent !== null ? (
            <button
              type="button"
              onClick={() => navigateTo(parent)}
              className="ml-auto rounded px-2 py-0.5 hover:bg-muted"
              data-testid="explorer-up"
            >
              ↑ Up
            </button>
          ) : null}
        </div>

        {denied ? (
          <GlassSurface
            variant="canvas"
            radius="2xl"
            shadow="sm"
            border="default"
            className="p-6 text-sm"
            data-testid="explorer-denied"
          >
            Explorer requires <code className="font-mono">{view === 'vault' ? 'read' : 'review'}</code> access.
          </GlassSurface>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" data-testid="explorer-error">
            {error}
          </p>
        ) : null}

        {loading && !page ? <RouteLoadingState label="Loading explorer" /> : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          {/* Listing */}
          <AmbientSurface className="overflow-hidden rounded-2xl border border-border">
          <GlassSurface
            variant="canvas"
            radius="2xl"
            shadow="sm"
            border="default"
            className="overflow-hidden"
          >
            {/* Subfolders */}
            {page && page.folders.length > 0 ? (
              <ul className="divide-y divide-border/60" data-testid="explorer-folders">
                {page.folders.map((f) => (
                  <li key={f}>
                    <button
                      type="button"
                      onClick={() => navigateTo(f)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted/50"
                      data-testid="explorer-folder"
                    >
                      <span aria-hidden>▸</span>
                      <span className="truncate font-mono text-xs">
                        {leaf(f)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Entries */}
            {page && page.entries.length === 0 && page.folders.length === 0 ? (
              <p
                className="px-4 py-6 text-sm text-muted-foreground"
                data-testid="explorer-empty"
              >
                No records here.
              </p>
            ) : null}

            <ul className="divide-y divide-border/60" data-testid="explorer-entries">
              {page?.entries.map((entry) => (
                <li key={entry.path}>
                  {/*
                    SelectableCard is the shared primitive, so information level
                    actually acts on this list: Focus shows the title only,
                    Standard adds summary/metadata, Deep adds history. The
                    route-local <button> this replaced could not respond to
                    level at all, which is why the three levels were previously
                    pixel-identical here.

                    `data-state` is preserved because the existing route tests
                    assert live-vs-historical through it.
                  */}
                  <SelectableCard
                    id={entry.path}
                    role={roleForProvenance(
                      entry.state === 'historical' ? 'historical' : 'live'
                    )}
                    title={
                      <span className="flex items-center gap-2">
                        <StateBadge state={entry.state} />
                        <span
                          className={[
                            'min-w-0 flex-1 truncate',
                            entry.state === 'historical' ? 'text-muted-foreground' : '',
                          ].join(' ')}
                        >
                          {entry.title ?? entry.name}
                        </span>
                      </span>
                    }
                    summary={entry.path}
                    metadata={
                      <span className="flex flex-wrap items-center gap-2">
                        {entry.tags?.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                          >
                            {t}
                          </span>
                        ))}
                        {entry.status ? <span>{entry.status}</span> : null}
                        {entry.runId ? <span>run {entry.runId}</span> : null}
                      </span>
                    }
                    history={
                      entry.deletedInCommit ? (
                        <span>
                          Deleted in {entry.deletedInCommit.slice(0, 12)}
                          {entry.updatedAt ? ` on ${entry.updatedAt}` : ''}
                        </span>
                      ) : undefined
                    }
                    onSelect={() => setSelected(entry)}
                    className="rounded-none border-0 border-b border-border/60 px-4 py-2"
                  >
                    {/* data-state is the existing route-test hook for
                        live-vs-historical; kept on a real element rather than
                        synthesized by the primitive. */}
                    <span className="sr-only" data-testid="explorer-entry" data-state={entry.state} />
                  </SelectableCard>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {page && page.total > 0 ? (
              <div className="flex items-center justify-between border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
                <span data-testid="explorer-range">
                  {page.offset + 1}–{page.offset + page.entries.length} of{' '}
                  {page.total}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page.offset === 0}
                    onClick={() => setOffset(Math.max(0, page.offset - page.limit))}
                    className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
                    data-testid="explorer-prev"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!page.hasMore}
                    onClick={() => setOffset(page.offset + page.limit)}
                    className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
                    data-testid="explorer-next"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </GlassSurface>
          </AmbientSurface>

          {/* Preview */}
          <div>
            {selected ? (
              <PreviewPanel
                view={view}
                entry={selected}
                onClose={() => setSelected(null)}
              />
            ) : (
              <GlassSurface
                variant="canvas"
                radius="2xl"
                shadow="sm"
                border="default"
                className="p-6 text-sm text-muted-foreground"
                data-testid="explorer-preview-empty"
              >
                Select a record to preview.
              </GlassSurface>
            )}
          </div>
        </div>
      </div>
      }
    />
  );
}
