import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useInbox } from '../../src/hooks/useInbox';
import { type InboxNote, INBOX_BUCKET_CONFIG } from '../../src/lib/inbox-logic';
import { inboxSearchParams } from '../../src/lib/routes/search-params';
import { toInboxItemDisplay } from '../lib/display';
import { InboxItemCard } from '../components/inbox';
import { EmptyState } from '../components/ui';
import { WorkspaceScaffold } from '../components/layout';
import {
  useInboxConverterMutation,
  type InboxConvertResult,
} from '../lib/queries/agents';
import {
  buildInboxSurfacePayload,
  type InboxItem,
} from '../lib/viewer-adapter';
import { TabsRoot, TabsList, TabsTrigger } from '../components/ui';
import { GlassCard } from '../components/ui/glass-card';
import { cn } from '@/src/lib/utils';

/* ─── types ───────────────────────────────────────────────────────────────── */

interface RunItem {
  path?: string;
  targetPath?: string;
  domainFields?: Record<string, unknown>;
}

interface Run {
  runId: string;
  runType?: string;
  action?: string;
  itemCount: number;
  confidence?: number;
  templateRef?: string;
  items: RunItem[];
  error?: string;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

function runToOriginSource(runType?: string): string {
  if (runType === 'signals_infer') return 'agent';
  if (runType === 'conversation') return 'llm';
  return runType ?? 'manual';
}

function isArchiveBucket(bucket: InboxItem['inboxBucket']) {
  return bucket === 'rejected_user' || bucket === 'rejected_automated';
}

function inboxItemToDisplay(item: InboxItem, note?: InboxNote, run?: Run) {
  const createdAt = (note?.frontmatter?.created ??
    note?.frontmatter?.createdAt ??
    null) as string | null | undefined;
  const source =
    item.rejectionType === 'user'
      ? 'manual'
      : note?.source === 'extracted'
        ? 'agent'
        : run
          ? runToOriginSource(run.runType)
          : item.inboxBucket === 'deferred' ||
              item.inboxBucket === 'rejected_automated'
            ? 'agent'
            : 'manual';

  return toInboxItemDisplay({
    title: item.title,
    _source: source,
    _run_id: run?.runId,
    description: item.summary,
    createdAt: createdAt ?? item.surfacedAt,
    status:
      note?.status ??
      (item.severity === 'high' || item.severity === 'critical'
        ? 'blocked'
        : undefined),
  });
}

function itemSourceType(
  item: InboxItem,
  run?: Run
): 'signals_infer' | 'conversation' | 'manual' {
  if (run?.runType === 'signals_infer') return 'signals_infer';
  if (run?.runType === 'conversation') return 'conversation';
  return 'manual';
}

/* ─── sort helper ────────────────────────────────────────────────────────── */

type SortKey = 'newest' | 'oldest' | 'confidence' | 'itemCount';

function sortItems(
  items: InboxItem[],
  sort: SortKey,
  runById: Map<string, Run>
): InboxItem[] {
  const copy = [...items];
  switch (sort) {
    case 'oldest':
      return copy.sort(
        (a, b) =>
          new Date(a.surfacedAt ?? 0).getTime() -
          new Date(b.surfacedAt ?? 0).getTime()
      );
    case 'confidence':
      return copy.sort((a, b) => {
        const ra = runById.get(a.sourceId);
        const rb = runById.get(b.sourceId);
        return (ra?.confidence ?? 1) - (rb?.confidence ?? 1);
      });
    case 'itemCount':
      return copy.sort((a, b) => {
        const ra = runById.get(a.sourceId);
        const rb = runById.get(b.sourceId);
        return (rb?.itemCount ?? 0) - (ra?.itemCount ?? 0);
      });
    case 'newest':
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.surfacedAt ?? 0).getTime() -
          new Date(a.surfacedAt ?? 0).getTime()
      );
  }
}

/* ─── ConvertPanel (modal footer use only — no inline rendering) ─────────── */

function ConvertPanel({ runId, rawText }: { runId: string; rawText: string }) {
  const { mutate, data, isPending, error, reset } = useInboxConverterMutation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || data) return null;

  if (!isPending && !error) {
    return (
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium',
          'bg-white/10 backdrop-blur-sm border border-white/20 text-white/70',
          'hover:bg-white/15 hover:text-white transition-colors cursor-pointer'
        )}
        onClick={() => mutate(rawText)}
      >
        ✦ Convert to task
      </button>
    );
  }

  if (isPending) {
    return (
      <span className="px-2 py-1 text-xs text-muted-foreground">
        Converting…
      </span>
    );
  }

  if (error) {
    return (
      <span className="px-2 py-1 text-xs text-destructive">
        Failed —{' '}
        <button
          type="button"
          className="underline"
          onClick={() => {
            reset();
            mutate(rawText);
          }}
        >
          retry
        </button>
      </span>
    );
  }

  return null;
}

/* ─── FilterBar ──────────────────────────────────────────────────────────── */

interface FilterBarProps {
  sort: SortKey;
  onSort: (v: SortKey) => void;
  runType: string;
  onRunType: (v: string) => void;
  reversibility: string;
  onReversibility: (v: string) => void;
  severity: string;
  onSeverity: (v: string) => void;
  loading: boolean;
  anyInFlight: boolean;
  onRefresh: () => void;
}

function FilterBar({
  sort,
  onSort,
  runType,
  onRunType,
  reversibility,
  onReversibility,
  severity,
  onSeverity,
  loading,
  anyInFlight,
  onRefresh,
}: FilterBarProps) {
  const selectCls = cn(
    'rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer',
    'bg-white/10 backdrop-blur-sm border border-white/20 text-white/80',
    'focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200',
    '[&>option]:bg-zinc-900 [&>option]:text-white'
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60 shrink-0">
        Sort
      </span>
      <select
        aria-label="Sort inbox items"
        value={sort}
        onChange={(e) => onSort(e.target.value as SortKey)}
        className={selectCls}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="confidence">Confidence ↑</option>
        <option value="itemCount">Item count ↓</option>
      </select>

      <span className="ml-2 shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">
        Filter
      </span>
      <select
        aria-label="Filter by run type"
        value={runType}
        onChange={(e) => onRunType(e.target.value)}
        className={selectCls}
      >
        <option value="">Run type: All</option>
        <option value="signals_infer">Signals infer</option>
        <option value="conversation">Conversation</option>
        <option value="manual">Manual</option>
      </select>
      <select
        aria-label="Filter by reversibility"
        value={reversibility}
        onChange={(e) => onReversibility(e.target.value)}
        className={selectCls}
      >
        <option value="">Reversibility: All</option>
        <option value="high">Reversible</option>
        <option value="medium">Partial</option>
        <option value="low">Irreversible</option>
      </select>
      <select
        aria-label="Filter by severity"
        value={severity}
        onChange={(e) => onSeverity(e.target.value)}
        className={selectCls}
      >
        <option value="">Severity: All</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <div className="ml-auto">
        <button
          type="button"
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
            'bg-white/10 backdrop-blur-sm border border-white/20 text-white/70',
            'hover:bg-white/15 hover:text-white disabled:opacity-40 cursor-pointer'
          )}
          onClick={onRefresh}
          disabled={loading || anyInFlight}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

/* ─── Route ───────────────────────────────────────────────────────────────── */

export const Route = createFileRoute('/inbox')({
  validateSearch: inboxSearchParams,
  component: InboxRoute,
});

function InboxRoute() {
  const {
    runs,
    workbenchNotes,
    archiveNotes,
    loading,
    error,
    refresh,
    commitRun,
    rejectRun,
    actionState,
    counts: inboxHookCounts,
  } = useInbox();

  const surface = React.useMemo(
    () =>
      buildInboxSurfacePayload({
        runs: runs as unknown as Array<Record<string, unknown>>,
        workbenchNotes:
          workbenchNotes as unknown as import('../../src/lib/inbox-logic').InboxNote[],
        archiveNotes:
          archiveNotes as unknown as import('../../src/lib/inbox-logic').InboxNote[],
      }),
    [runs, workbenchNotes, archiveNotes]
  );

  const {
    view: viewParam,
    sort: sortParam,
    severity,
    runType: runTypeParam,
    reversibility: reversibilityParam,
    selectedId,
  } = Route.useSearch();
  const navigate = useNavigate();

  const activeTab = viewParam ?? 'queue';

  // Local state for filters not yet in URL (to avoid excessive navigation noise)
  // runType + reversibility are written to URL; severity is also URL
  // sort is URL
  const currentSort: SortKey = sortParam ?? 'newest';

  const anyActionInFlight = Object.values(actionState).some(
    (s) => s === 'committing' || s === 'rejecting'
  );

  const runById = React.useMemo(
    () => new Map((runs as Run[]).map((run) => [run.runId, run])),
    [runs]
  );

  const noteByPath = React.useMemo(
    () =>
      new Map(
        [
          ...(workbenchNotes as InboxNote[]),
          ...(archiveNotes as InboxNote[]),
        ].map((note) => [note.path, note] as const)
      ),
    [archiveNotes, workbenchNotes]
  );

  /* ─── tab → bucket filter ──────────────────────────────────────────────── */

  const tabItems = React.useMemo(() => {
    return surface.filter((item) => {
      if (activeTab === 'queue') {
        return (
          item.inboxBucket === 'needs_action' ||
          item.inboxBucket === 'needs_approval'
        );
      }
      if (activeTab === 'workbench') {
        return item.inboxBucket === 'deferred';
      }
      if (activeTab === 'archive') {
        return isArchiveBucket(item.inboxBucket);
      }
      return false;
    });
  }, [surface, activeTab]);

  /* ─── apply filters ────────────────────────────────────────────────────── */

  const filteredItems = React.useMemo(() => {
    return tabItems.filter((item) => {
      if (severity && item.severity !== severity) return false;
      if (runTypeParam) {
        const src = itemSourceType(item, runById.get(item.sourceId));
        if (src !== runTypeParam) return false;
      }
      if (reversibilityParam && item.reversibility !== reversibilityParam)
        return false;
      return true;
    });
  }, [tabItems, severity, runTypeParam, reversibilityParam, runById]);

  /* ─── apply sort ───────────────────────────────────────────────────────── */

  const visibleItems = React.useMemo(
    () => sortItems(filteredItems, currentSort, runById),
    [filteredItems, currentSort, runById]
  );

  /* ─── tab counts ───────────────────────────────────────────────────────── */

  const tabCounts = React.useMemo(() => {
    const queue = surface.filter(
      (i) =>
        i.inboxBucket === 'needs_action' || i.inboxBucket === 'needs_approval'
    ).length;
    const workbench = surface.filter(
      (i) => i.inboxBucket === 'deferred'
    ).length;
    const archive = surface.filter((i) =>
      isArchiveBucket(i.inboxBucket)
    ).length;
    return {
      queue: inboxHookCounts?.queue ?? queue,
      workbench: inboxHookCounts?.workbench ?? workbench,
      archive: inboxHookCounts?.archive ?? archive,
    };
  }, [surface, inboxHookCounts]);

  /* ─── navigation helpers ────────────────────────────────────────────────── */

  const setSearch = useCallback(
    (patch: Partial<ReturnType<typeof inboxSearchParams>>) => {
      navigate({
        to: '/inbox',
        search: {
          view: activeTab as 'queue' | 'workbench' | 'archive',
          sort: currentSort,
          severity,
          runType: runTypeParam,
          reversibility: reversibilityParam,
          selectedId,
          ...patch,
        },
        replace: true,
      });
    },
    [
      navigate,
      activeTab,
      currentSort,
      severity,
      runTypeParam,
      reversibilityParam,
      selectedId,
    ]
  );

  /* ─── actions ───────────────────────────────────────────────────────────── */

  const handleCommit = useCallback(
    async (runId: string) => {
      try {
        const result = await commitRun(runId);
        const status =
          result?.structuredContent?.status ?? result?.status ?? null;
        if (status === 'pending_confirmation') {
          const expiresAt =
            result?.structuredContent?.expiresAt ?? result?.expiresAt;
          toast(
            expiresAt
              ? `Confirmation armed for ${runId}. Click Promote again before ${expiresAt}.`
              : `Confirmation armed for ${runId}. Click Promote again to commit.`
          );
          return;
        }
        const committed = result?.structuredContent?.committed ?? 0;
        const failed = result?.structuredContent?.failed ?? 0;
        const rejected = result?.structuredContent?.rejected ?? 0;
        if (failed > 0 || rejected > 0) {
          const parts: string[] = [];
          if (committed > 0) parts.push(`${committed} committed`);
          if (rejected > 0) parts.push(`${rejected} rejected`);
          if (failed > 0) parts.push(`${failed} failed`);
          if (committed === 0) {
            toast.error(`Partial commit (${parts.join(', ')}) — refreshing`);
          } else {
            toast(`Partial commit (${parts.join(', ')}) — refreshing`);
          }
          refresh();
        } else {
          toast(
            `Committed ${committed} item${committed !== 1 ? 's' : ''} from ${runId}`
          );
        }
      } catch (err) {
        toast.error((err as Error).message ?? 'Commit failed');
      }
    },
    [commitRun, refresh]
  );

  const handleReject = useCallback(
    async (runId: string) => {
      try {
        const result = await rejectRun(runId);
        const rawErrors = result?.structuredContent?.errors ?? 0;
        const errorCount = Array.isArray(rawErrors)
          ? rawErrors.length
          : rawErrors;
        if (errorCount > 0) {
          toast.error(
            `Partial rejection: ${errorCount} item${errorCount !== 1 ? 's' : ''} could not be removed — refreshing`
          );
          refresh();
        } else {
          toast(`Rejected run ${runId}`);
        }
      } catch (err) {
        toast.error((err as Error).message ?? 'Reject failed');
      }
    },
    [rejectRun, refresh]
  );

  /* ─── primary content ───────────────────────────────────────────────────── */

  const primaryContent = (
    <>
      {loading && (
        <div className="inbox-state">
          <div className="inbox-spinner" />
          <span>Loading inbox…</span>
        </div>
      )}

      {!loading && error && (
        <div className="inbox-state inbox-state--error" role="alert">
          <strong>Could not reach the API.</strong>
          <span>{error}</span>
          <button type="button" className="btn btn--refresh" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-2 flex flex-col gap-4">
          {/* ── 3-tab bar ──────────────────────────────────────────────── */}
          <TabsRoot
            value={activeTab}
            onValueChange={(v) =>
              setSearch({ view: v as 'queue' | 'workbench' | 'archive' })
            }
          >
            <TabsList className="h-auto gap-1 bg-transparent p-0">
              {(
                [
                  { value: 'queue', label: 'Queue', count: tabCounts.queue },
                  {
                    value: 'workbench',
                    label: 'Workbench',
                    count: tabCounts.workbench,
                  },
                  {
                    value: 'archive',
                    label: 'Archive',
                    count: tabCounts.archive,
                  },
                ] as const
              ).map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/30 data-[state=active]:backdrop-blur-sm data-[state=inactive]:bg-white/5 data-[state=inactive]:text-white/60 data-[state=inactive]:border data-[state=inactive]:border-white/10 hover:data-[state=inactive]:text-white/80 hover:data-[state=inactive]:bg-white/10 transition-colors shadow-none"
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 tabular-nums text-[11px] opacity-70">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </TabsRoot>

          {/* ── Filter + sort toolbar ─────────────────────────────────── */}
          <GlassCard variant="light" glowEffect={false} className="px-3 py-2.5">
            <FilterBar
              sort={currentSort}
              onSort={(v) => setSearch({ sort: v })}
              runType={runTypeParam ?? ''}
              onRunType={(v) =>
                setSearch({
                  runType:
                    (v as 'signals_infer' | 'conversation' | 'manual') ||
                    undefined,
                })
              }
              reversibility={reversibilityParam ?? ''}
              onReversibility={(v) =>
                setSearch({
                  reversibility: (v as 'high' | 'medium' | 'low') || undefined,
                })
              }
              severity={severity ?? ''}
              onSeverity={(v) =>
                setSearch({
                  severity: (v as 'high' | 'medium' | 'low') || undefined,
                })
              }
              loading={loading}
              anyInFlight={anyActionInFlight}
              onRefresh={refresh}
            />
          </GlassCard>

          {/* ── Summary line ──────────────────────────────────────────── */}
          <p className="text-xs text-white/60">
            {visibleItems.length} of {surface.length} item
            {surface.length !== 1 ? 's' : ''}
          </p>

          {visibleItems.length === 0 && (
            <EmptyState
              title="Nothing here"
              description="Try a different tab or clear the active filters."
            />
          )}

          {/* ── Single-column list ────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            {visibleItems.map((item) => {
              const run = runById.get(item.sourceId);
              const note = noteByPath.get(item.sourceId);

              const canPromote =
                item.allowedActions.some((a) =>
                  ['approve', 'reopen', 'override'].includes(a.actionType)
                ) ||
                (run && run.runType !== 'signals_infer');

              const canReject =
                item.allowedActions.some((a) =>
                  ['defer', 'approve'].includes(a.actionType)
                ) ||
                !!run ||
                !!item.sourceId;

              const runActionId = run?.runId ?? item.sourceId;
              const actionInflight =
                !!runActionId &&
                (actionState[runActionId] === 'committing' ||
                  actionState[runActionId] === 'rejecting');

              return (
                <InboxItemCard
                  key={item.id}
                  item={inboxItemToDisplay(item, note, run)}
                  detail={{
                    summary: item.summary ?? undefined,
                    whySurfaced: item.whySurfaced,
                    severity: item.severity,
                    inboxBucket: item.inboxBucket,
                    rejectionReason: item.rejectionReason,
                    runId: run?.runId,
                    runAction: run?.action,
                    sourceId: item.sourceId,
                    reversibility: item.reversibility ?? null,
                  }}
                  onInspect={() =>
                    navigate({
                      to: '/inbox',
                      search: {
                        view: activeTab as 'queue' | 'workbench' | 'archive',
                        sort: currentSort,
                        severity,
                        runType: runTypeParam,
                        reversibility: reversibilityParam,
                        selectedId: item.id,
                      },
                      replace: true,
                    })
                  }
                  onPromote={
                    canPromote && run && run.runType !== 'signals_infer'
                      ? () => handleCommit(run.runId)
                      : undefined
                  }
                  onReject={
                    canReject
                      ? run
                        ? () => handleReject(run.runId)
                        : item.sourceId
                          ? () => handleReject(item.sourceId)
                          : undefined
                      : undefined
                  }
                  convertPanel={
                    run ? (
                      <ConvertPanel
                        runId={run.runId}
                        rawText={`${run.runId}${run.action ? ` — ${run.action}` : ''}${run.templateRef ? ` (${run.templateRef})` : ''}`}
                      />
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <WorkspaceScaffold
      title="Inbox"
      subtitle={`${surface.length} item${surface.length !== 1 ? 's' : ''} · ${visibleItems.length} in view`}
      primaryTitle="Review queue"
      primary={primaryContent}
      asideTitle="Detail"
      aside={null}
    />
  );
}
