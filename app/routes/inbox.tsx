import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useInbox } from '../../src/hooks/useInbox';
import {
  type InboxView,
  type InboxNote,
  type InboxFilterState,
  filterWorkbenchNotes,
  defaultInboxView,
} from '../../src/lib/inbox-logic';

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

interface RunCardProps {
  run: Run;
  onCommit: (runId: string) => Promise<void>;
  onReject: (runId: string) => Promise<void>;
  runState?: string;
  awaitingConfirmation?: boolean;
}

interface ToastMsg {
  msg: string;
  isError: boolean;
}

const NOTE_PAGE_SIZE = 24;

/* ─── helpers ────────────────────────────────────────────────────────────── */

function runTypeBadge(runType?: string) {
  const map: Record<string, { label: string; cls: string }> = {
    signals_infer: { label: 'signals · infer', cls: 'badge badge--signals' },
    conversation: { label: 'conversation', cls: 'badge badge--conversation' },
    manual: { label: 'manual', cls: 'badge badge--manual' },
    daily: { label: 'daily', cls: 'badge badge--daily' },
  };
  const def = map[runType || ''] ?? {
    label: runType ?? 'unknown',
    cls: 'badge badge--default',
  };
  return <span className={def.cls}>{def.label}</span>;
}

function stripMarkdownExtension(path: string) {
  return path.endsWith('.md') ? path.slice(0, -3) : path;
}

function noteStatusKey(note: InboxNote) {
  return (note.status || 'unknown').toLowerCase();
}

function confidenceBar(confidence?: number | null) {
  if (confidence == null) return null;
  const pct = Math.min(100, Math.max(0, Math.round(Number(confidence) * 100)));
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="confidence">
      <div
        className="confidence__bar"
        style={{ width: `${pct}%`, background: color }}
      />
      <span className="confidence__label">{pct}%</span>
    </div>
  );
}

function DomainFields({ fields }: { fields?: Record<string, unknown> }) {
  const entries = Object.entries(fields ?? {}).filter(([, v]) => v != null);
  if (entries.length === 0) return <span className="empty-fields">—</span>;
  return (
    <dl className="domain-fields">
      {entries.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="domain-fields__key">{k}</dt>
          <dd className="domain-fields__val">
            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/* ─── InboxNoteCard ───────────────────────────────────────────────────────── */

function InboxNoteCard({ note, muted = false }: { note: InboxNote; muted?: boolean }) {
  const hasError = Boolean((note as Record<string, unknown>).error);
  const title = note.title || note.path.split('/').pop() || note.path;
  const tags = (note.tags || []).slice(0, 4);

  return (
    <div
      className={[
        'run-card',
        muted && 'run-card--muted',
        hasError && 'run-card--read-error',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="run-card__header">
        <div className="run-card__title">
          <span className="run-card__id">{title}</span>
          {note.status && <span className="badge badge--default">{note.status}</span>}
          {hasError && (
            <span className="badge badge--error" title={String((note as Record<string, unknown>).error)}>
              ⚠ read error
            </span>
          )}
        </div>
        <div className="run-card__meta">
          <span className="run-card__template" title={note.path}>
            {note.path}
          </span>
        </div>
        <div className="run-card__actions">
          <Link
            className="btn btn--refresh"
            to="/note"
            search={{ p: stripMarkdownExtension(note.path) }}
          >
            Open
          </Link>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="inbox-note-card__tags">
          {tags.map((tag) => (
            <span key={tag} className="inbox-note-card__tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── RunCard ─────────────────────────────────────────────────────────────── */

const RunCard = memo(function RunCard({
  run,
  onCommit,
  onReject,
  runState,
  awaitingConfirmation = false,
}: RunCardProps) {
  const [expanded, setExpanded] = useState(false);
  const state = runState;
  const busy = state === 'committing' || state === 'rejecting';
  const isError = state === 'error';
  const isSignal = run.runType === 'signals_infer';
  const hasReadError = Boolean(run.error);

  return (
    <div
      className={[
        'run-card',
        isError && 'run-card--error',
        hasReadError && 'run-card--read-error',
      ]
        .filter(Boolean)
        .join(' ')}
      data-run-id={run.runId}
    >
      {/* header */}
      <div className="run-card__header">
        <div className="run-card__title">
          <button
            type="button"
            className="run-card__expand"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '▾' : '▸'}
          </button>
          <span className="run-card__id">{run.runId}</span>
          {runTypeBadge(run.runType)}
          {run.action && (
            <span className="badge badge--action">{run.action}</span>
          )}
          {awaitingConfirmation && (
            <span className="badge badge--manual">
              confirm required
            </span>
          )}
          {hasReadError && (
            <span className="badge badge--error" title={run.error}>
              ⚠ read error
            </span>
          )}
          {isSignal && (
            <span
              className="badge badge--gated"
              title="Requires human approval — cannot be auto-committed"
            >
              🔒 gated
            </span>
          )}
        </div>

        <div className="run-card__meta">
          <span className="run-card__count">
            {run.itemCount} item{run.itemCount !== 1 ? 's' : ''}
          </span>
          {run.confidence != null && confidenceBar(run.confidence)}
          {run.templateRef && (
            <span className="run-card__template" title={run.templateRef}>
              {run.templateRef.split('/').pop()}
            </span>
          )}
        </div>

        <div className="run-card__actions">
          <>
            <button
              type="button"
              className="btn btn--commit"
              disabled={busy || isSignal}
              title={
                isSignal
                  ? 'signals_infer runs require explicit human approval'
                  : awaitingConfirmation
                    ? 'Click again to confirm promotion'
                    : 'Commit this run'
              }
              onClick={() => onCommit(run.runId)}
            >
              {state === 'committing'
                ? 'Committing…'
                : awaitingConfirmation
                  ? '✓ Confirm Promote'
                  : '✓ Commit'}
            </button>
            <button
              type="button"
              className="btn btn--reject"
              disabled={busy}
              onClick={() => onReject(run.runId)}
            >
              {state === 'rejecting' ? 'Rejecting…' : '✕ Reject'}
            </button>
          </>
          {isError && (
            <span
              className="run-card__error-label"
              title="Action failed — check console"
            >
              ⚠ error
            </span>
          )}
        </div>
      </div>

      {/* expanded items */}
      {expanded && (
        <div className="run-card__items">
          {run.items.map((item, idx) => (
            <div key={item.path ?? idx} className="item-row">
              <div className="item-row__path">
                {item.targetPath ?? item.path}
              </div>
              <div className="item-row__fields">
                <DomainFields fields={item.domainFields} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* signals_infer note */}
      {isSignal && (
        <div className="run-card__signal-note">
          This run was inferred from wearable signals. It cannot be committed
          here — use the human-state approval flow to review and approve it.
        </div>
      )}
    </div>
  );
});

/* ─── View sub-components ─────────────────────────────────────────────────── */

interface InboxCountsBadge {
  queue: number;
  workbench: number;
  archive: number;
}

function InboxViewSwitcher({
  view,
  counts,
  onChange,
}: {
  view: InboxView;
  counts: InboxCountsBadge;
  onChange: (v: InboxView) => void;
}) {
  const tabs: { id: InboxView; label: string; count: number }[] = [
    { id: 'queue', label: 'Queue', count: counts.queue },
    { id: 'workbench', label: 'Workbench', count: counts.workbench },
    { id: 'archive', label: 'Archive', count: counts.archive },
  ];
  return (
    <nav className="inbox-view-switcher" aria-label="Inbox view">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`inbox-view-tab ${view === tab.id ? 'inbox-view-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={view === tab.id ? 'page' : undefined}
        >
          {tab.label}
          <span className="inbox-view-tab__count">{tab.count}</span>
        </button>
      ))}
    </nav>
  );
}

function QueuePanel({
  runs,
  actionState,
  pendingConfirmations,
  onCommit,
  onReject,
}: {
  runs: Run[];
  actionState: Record<string, string>;
  pendingConfirmations: Record<string, unknown>;
  onCommit: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [filterType, setFilterType] = useState('all');
  const runTypes = ['all', ...new Set(runs.map((r) => r.runType ?? 'unknown'))];
  const runTypeCounts = runs.reduce<Record<string, number>>(
    (acc, r) => {
      const t = r.runType ?? 'unknown';
      acc[t] = (acc[t] ?? 0) + 1;
      acc.all = (acc.all ?? 0) + 1;
      return acc;
    },
    { all: 0 }
  );
  const visibleRuns =
    filterType === 'all' ? runs : runs.filter((r) => r.runType === filterType);

  if (runs.length === 0) {
    return (
      <div className="inbox-lane">
        <div className="inbox-state inbox-state--empty inbox-state--panel">
          <span className="inbox-empty-icon">✅</span>
          <strong>Queue is clear</strong>
          <span>No staged proposals waiting. Continue in Workbench →</span>
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-lane">
      {runs.length > 1 && (
        <div className="inbox-filters">
          {runTypes.map((t) => (
            <button
              key={t}
              type="button"
              className={`inbox-filter ${filterType === t ? 'inbox-filter--active' : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t} ({runTypeCounts[t] ?? 0})
            </button>
          ))}
        </div>
      )}
      {visibleRuns.length === 0 ? (
        <div className="inbox-state inbox-state--empty">
          <span className="inbox-empty-icon">🔍</span>
          <strong>No runs match this filter</strong>
          <button type="button" className="btn-link" onClick={() => setFilterType('all')}>
            Show all
          </button>
        </div>
      ) : (
        visibleRuns.map((run) => (
          <RunCard
            key={run.runId}
            run={run as Run}
            onCommit={onCommit}
            onReject={onReject}
            runState={actionState[run.runId]}
            awaitingConfirmation={Boolean(pendingConfirmations[run.runId])}
          />
        ))
      )}
    </div>
  );
}

function WorkbenchPanel({ notes }: { notes: InboxNote[] }) {
  const [filter, setFilter] = useState<InboxFilterState>({ query: '', status: 'all' });
  const [noteLimit, setNoteLimit] = useState(NOTE_PAGE_SIZE);

  const statusOptions = useMemo(
    () => ['all', ...new Set(notes.map(noteStatusKey))],
    [notes]
  );

  const filtered = useMemo(
    () => filterWorkbenchNotes(notes, filter),
    [notes, filter]
  );

  useEffect(() => {
    setNoteLimit(NOTE_PAGE_SIZE);
  }, [filter]);

  const visible = filtered.slice(0, noteLimit);
  const hasMore = filtered.length > visible.length;

  if (notes.length === 0) {
    return (
      <div className="inbox-lane">
        <div className="inbox-state inbox-state--empty inbox-state--panel">
          <span className="inbox-empty-icon">📋</span>
          <strong>No draft or active inbox notes</strong>
          <span>New notes will appear here when they arrive.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-lane">
      <div className="inbox-note-controls">
        <label className="inbox-note-search">
          <span>Search</span>
          <input
            type="search"
            value={filter.query}
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
            placeholder="title or path"
          />
        </label>
        <div className="inbox-filters">
          {statusOptions.map((s) => (
            <button
              key={s}
              type="button"
              className={`inbox-filter ${filter.status === s ? 'inbox-filter--active' : ''}`}
              onClick={() => setFilter((f) => ({ ...f, status: s }))}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="inbox-state inbox-state--empty inbox-state--panel">
          <span className="inbox-empty-icon">🔎</span>
          <strong>No notes match</strong>
          <button
            type="button"
            className="btn-link"
            onClick={() => setFilter({ query: '', status: 'all' })}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          {visible.map((note) => (
            <InboxNoteCard key={note.path} note={note} />
          ))}
          {hasMore && (
            <div className="inbox-list__footer">
              <button
                type="button"
                className="btn btn--refresh"
                onClick={() => setNoteLimit((n) => n + NOTE_PAGE_SIZE)}
              >
                Show {Math.min(NOTE_PAGE_SIZE, filtered.length - visible.length)} more
              </button>
              <span className="inbox-list__meta">
                Showing {visible.length} of {filtered.length}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ArchivePanel({ notes }: { notes: InboxNote[] }) {
  const [query, setQuery] = useState('');
  const [noteLimit, setNoteLimit] = useState(NOTE_PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.path.toLowerCase().includes(q)
    );
  }, [notes, query]);

  useEffect(() => {
    setNoteLimit(NOTE_PAGE_SIZE);
  }, [query]);

  const visible = filtered.slice(0, noteLimit);
  const hasMore = filtered.length > visible.length;

  if (notes.length === 0) {
    return (
      <div className="inbox-lane">
        <div className="inbox-state inbox-state--empty inbox-state--panel">
          <span className="inbox-empty-icon">🗄️</span>
          <strong>No rejected notes</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-lane inbox-lane--archive">
      <p className="inbox-archive-note">
        {notes.length} rejected note{notes.length !== 1 ? 's' : ''} — reference only.
      </p>
      <label className="inbox-note-search">
        <span>Search</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="title or path"
        />
      </label>
      {visible.map((note) => (
        <InboxNoteCard key={note.path} note={note} muted />
      ))}
      {hasMore && (
        <div className="inbox-list__footer">
          <button
            type="button"
            className="btn btn--refresh"
            onClick={() => setNoteLimit((n) => n + NOTE_PAGE_SIZE)}
          >
            Show {Math.min(NOTE_PAGE_SIZE, filtered.length - visible.length)} more
          </button>
          <span className="inbox-list__meta">
            Showing {visible.length} of {filtered.length}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Route ───────────────────────────────────────────────────────────────── */

export const Route = createFileRoute('/inbox')({
  validateSearch: (search: Record<string, unknown>) => ({
    view: (['queue', 'workbench', 'archive'].includes(search.view as string)
      ? search.view
      : undefined) as InboxView | undefined,
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
    <main className="page inbox-page">
      {toastMsg && (
        <div
          className={`inbox-toast ${toastMsg.isError ? 'inbox-toast--error' : 'inbox-toast--ok'}`}
        >
          {toastMsg.msg}
        </div>
      )}

      <header className="inbox-header">
        <div className="inbox-header__left">
          <h1 className="inbox-header__title">Inbox</h1>
          <p className="inbox-header__sub">
            Review staged proposals, triage workbench notes, or browse the rejected archive.
          </p>
        </div>
        <div className="inbox-header__right">
          <span className={`api-badge api-badge--${apiStatus}`}>
            {apiStatus === 'online'
              ? 'API online'
              : apiStatus === 'offline'
                ? 'API offline'
                : 'API'}
          </span>
          <button
            type="button"
            className="btn btn--refresh"
            onClick={refresh}
            disabled={loading || anyActionInFlight}
          >
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </header>

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
            counts={counts}
            onChange={setView}
          />

          {activeView === 'queue' && (
            <QueuePanel
              runs={runs as Run[]}
              actionState={actionState}
              pendingConfirmations={pendingConfirmations}
              onCommit={handleCommit}
              onReject={handleReject}
            />
          )}

          {activeView === 'workbench' && (
            <WorkbenchPanel notes={workbenchNotes as InboxNote[]} />
          )}

          {activeView === 'archive' && (
            <ArchivePanel notes={archiveNotes as InboxNote[]} />
          )}
        </>
      )}
    </main>
  );
}

