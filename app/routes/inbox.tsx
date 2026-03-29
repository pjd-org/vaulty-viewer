import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useInbox } from '../../src/hooks/useInbox';
import { type InboxView, type InboxNote, defaultInboxView } from '../../src/lib/inbox-logic';
import { readEnumSearchParam } from '../../src/lib/routes/search-params';
import { toInboxItemDisplay } from '../lib/display';
import { InboxItemCard, InboxViewSwitcher } from '../components/inbox';
import { EmptyState } from '../components/ui';
import { PageFrame } from '../components/layout';
import { useInboxConverterMutation, type InboxConvertResult } from '../lib/queries/agents';

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

interface ToastMsg {
  msg: string;
  isError: boolean;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

function stripMarkdownExtension(path: string) {
  return path.endsWith('.md') ? path.slice(0, -3) : path;
}

function runToOriginSource(runType?: string): string {
  if (runType === 'signals_infer') return 'agent';
  if (runType === 'conversation') return 'llm';
  return runType ?? 'manual';
}

/* ─── Inline converter panel ─────────────────────────────────────────────── */

function ConvertPanel({ runId, rawText }: { runId: string; rawText: string }) {
  const { mutate, data, isPending, error, reset } = useInboxConverterMutation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (!data && !isPending && !error) {
    return (
      <button
        type="button"
        className="text-xs text-slate-700 hover:text-slate-900 font-medium px-2 py-1 rounded-lg hover:bg-white/50 transition-colors"
        onClick={() => mutate(rawText)}
      >
        ✦ Convert to task
      </button>
    );
  }

  if (isPending) {
    return <span className="text-xs text-slate-400 px-2 py-1">Converting…</span>;
  }

  if (error) {
    return (
      <span className="text-xs text-red-500 px-2 py-1">
        Failed —{' '}
        <button type="button" className="underline" onClick={() => { reset(); mutate(rawText); }}>
          retry
        </button>
      </span>
    );
  }

  if (data) {
    return (
      <div className="mt-2 genie-surface genie-surface--utility rounded-xl px-3 py-2 space-y-1">
        <p className="text-xs font-semibold text-slate-800">{data.title}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span>{data.duration}</span>
          <span>·</span>
          <span className="capitalize">{data.effort}</span>
          <span>·</span>
          <span className="capitalize">{data.type}</span>
          {data.project && <><span>·</span><span>{data.project}</span></>}
        </div>
        <button
          type="button"
          className="text-xs text-slate-500 hover:text-slate-800 mt-1"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return null;
}

/* ─── Route ───────────────────────────────────────────────────────────────── */

export const Route = createFileRoute('/inbox')({
  validateSearch: (search: Record<string, unknown>) => ({
    view: readEnumSearchParam(search.view, ['queue', 'workbench', 'archive'] as const) as InboxView | undefined,
  }),
  component: InboxRoute,
});

function InboxRoute() {
  const {
    runs,
    workbenchNotes,
    archiveNotes,
    counts,
    loading,
    error,
    apiStatus,
    refresh,
    commitRun,
    rejectRun,
    actionState,
    pendingConfirmations,
  } = useInbox();

  const { view: viewParam } = Route.useSearch();
  const navigate = useNavigate();

  const [toastMsg, setToastMsg] = useState<ToastMsg | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const anyActionInFlight = Object.values(actionState).some(
    (s) => s === 'committing' || s === 'rejecting'
  );

  // Determine active view: URL param → smart default → 'workbench'
  const activeView: InboxView =
    viewParam ?? (loading ? 'queue' : defaultInboxView(counts.queue));

  const setView = useCallback(
    (v: InboxView) => {
      navigate({ to: '/inbox', search: { view: v }, replace: true });
    },
    [navigate]
  );

  const toast = useCallback((msg: string, isError = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg({ msg, isError });
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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
              ? `Confirmation armed for ${runId}. Click Commit again before ${expiresAt}.`
              : `Confirmation armed for ${runId}. Click Commit again to promote.`
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
          toast(
            `Partial commit (${parts.join(', ')}) — refreshing`,
            committed === 0
          );
          refresh();
        } else {
          toast(
            `Committed ${committed} item${committed !== 1 ? 's' : ''} from ${runId}`
          );
        }
      } catch (err) {
        toast((err as Error).message ?? 'Commit failed', true);
      }
    },
    [commitRun, refresh, toast]
  );

  const handleReject = useCallback(
    async (runId: string) => {
      try {
        const result = await rejectRun(runId);
        const rawErrors = result?.structuredContent?.errors ?? 0;
        const errorCount = Array.isArray(rawErrors) ? rawErrors.length : rawErrors;
        if (errorCount > 0) {
          toast(
            `Partial rejection: ${errorCount} item${errorCount !== 1 ? 's' : ''} could not be removed — refreshing`,
            true
          );
          refresh();
        } else {
          toast(`Rejected run ${runId}`);
        }
      } catch (err) {
        toast((err as Error).message ?? 'Reject failed', true);
      }
    },
    [rejectRun, refresh, toast]
  );

  return (
    <main className="inbox-page p-6 space-y-6">
      {toastMsg && (
        <div
          className={`inbox-toast ${toastMsg.isError ? 'inbox-toast--error' : 'inbox-toast--ok'}`}
          role="status"
          aria-live="polite"
        >
          {toastMsg.msg}
        </div>
      )}

      <PageFrame
        title="Inbox"
        subtitle="Review staged proposals, triage workbench notes, or browse the rejected archive."
        actions={
          <>
            <span className={`api-badge api-badge--${apiStatus}`}>
              {apiStatus === 'online' ? 'API online' : apiStatus === 'offline' ? 'API offline' : 'API'}
            </span>
            <button
              type="button"
              className="btn-secondary rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white/80 disabled:opacity-60"
              onClick={refresh}
              disabled={loading || anyActionInFlight}
            >
              {loading ? 'Loading…' : '↻ Refresh'}
            </button>
          </>
        }
      >
        {loading && (
          <div className="inbox-state">
            <div className="inbox-spinner" />
            <span>Loading inbox…</span>
          </div>
        )}

        {!loading && error && (
          <div className="inbox-state inbox-state--error">
            <strong>Could not reach the API.</strong>
            <span>{error}</span>
            <button type="button" className="btn btn--refresh" onClick={refresh}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <InboxViewSwitcher
              view={activeView}
              onChange={setView}
              counts={counts}
            />

            <div className="mt-6 space-y-3">
              {activeView === 'queue' && (runs as Run[]).length === 0 && (
                <EmptyState
                  title="Queue is clear"
                  description="No staged proposals waiting. Continue in Workbench →"
                />
              )}
              {activeView === 'queue' && (runs as Run[]).map((run) => (
                <div key={run.runId} className="space-y-1">
                  <InboxItemCard
                    item={toInboxItemDisplay({
                      title: run.runId,
                      _source: runToOriginSource(run.runType),
                      _run_id: run.runId,
                      description: `${run.itemCount} item${run.itemCount !== 1 ? 's' : ''}${run.action ? ` · ${run.action}` : ''}`,
                      status: (run.error || run.runType === 'signals_infer') ? 'blocked' : undefined,
                    })}
                    onInspect={() => {
                      const p = run.items[0]?.targetPath ?? run.items[0]?.path;
                      if (p) navigate({ to: '/note', search: { p: stripMarkdownExtension(p) } });
                    }}
                    onPromote={run.runType !== 'signals_infer' ? () => handleCommit(run.runId) : undefined}
                    onReject={() => handleReject(run.runId)}
                  />
                  <ConvertPanel
                    runId={run.runId}
                    rawText={`${run.runId}${run.action ? ` — ${run.action}` : ''}${run.templateRef ? ` (${run.templateRef})` : ''}`}
                  />
                </div>
              ))}

              {activeView === 'workbench' && (workbenchNotes as InboxNote[]).length === 0 && (
                <EmptyState
                  title="No draft or active inbox notes"
                  description="New notes will appear here when they arrive."
                />
              )}
              {activeView === 'workbench' && (workbenchNotes as InboxNote[]).map((note) => (
                <InboxItemCard
                  key={note.path}
                  item={toInboxItemDisplay({
                    title: note.title || note.path.split('/').pop() || note.path,
                    _source: note.source === 'extracted' ? 'agent' : 'manual',
                    _run_id: undefined,
                    description: undefined,
                    createdAt: (note.frontmatter?.created ?? note.frontmatter?.createdAt ?? null) as string | null | undefined,
                    status: note.status ?? undefined,
                  })}
                  onInspect={() => navigate({ to: '/note', search: { p: stripMarkdownExtension(note.path) } })}
                />
              ))}

              {activeView === 'archive' && (archiveNotes as InboxNote[]).length === 0 && (
                <EmptyState title="No rejected notes" description="The archive is empty." />
              )}
              {activeView === 'archive' && (archiveNotes as InboxNote[]).map((note) => (
                <InboxItemCard
                  key={note.path}
                  item={toInboxItemDisplay({
                    title: note.title || note.path.split('/').pop() || note.path,
                    _source: note.source === 'extracted' ? 'agent' : 'manual',
                    _run_id: undefined,
                    description: undefined,
                    createdAt: (note.frontmatter?.created ?? note.frontmatter?.createdAt ?? null) as string | null | undefined,
                    status: note.status ?? undefined,
                  })}
                  onInspect={() => navigate({ to: '/note', search: { p: stripMarkdownExtension(note.path) } })}
                />
              ))}
            </div>
          </>
        )}
      </PageFrame>
    </main>
  );
}
