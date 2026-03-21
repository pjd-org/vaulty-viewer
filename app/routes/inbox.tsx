import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useInbox } from '../../src/hooks/useInbox';

/* ─── types ───────────────────────────────────────────────────────────────── */

interface InboxNote {
  path: string;
  title?: string;
  status?: string;
  tags?: string[];
  frontmatter?: Record<string, unknown>;
  error?: string;
}

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

type InboxNoteSource = 'inbox' | 'rejected' | 'extracted' | 'other';

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

function getNoteSource(path: string): InboxNoteSource {
  if (path.startsWith('inbox/rejected/')) return 'rejected';
  if (path.startsWith('inbox/extracted/')) return 'extracted';
  if (path.startsWith('inbox/')) return 'inbox';
  return 'other';
}

function getSourceBadgeClass(source: InboxNoteSource) {
  const map: Record<InboxNoteSource, string> = {
    inbox: 'badge badge--source-inbox',
    rejected: 'badge badge--source-rejected',
    extracted: 'badge badge--source-extracted',
    other: 'badge badge--default',
  };
  return map[source];
}

function sourceLabel(source: InboxNoteSource) {
  const map: Record<InboxNoteSource, string> = {
    inbox: 'regular',
    rejected: 'rejected',
    extracted: 'extracted',
    other: 'other',
  };
  return map[source];
}

function stripMarkdownExtension(path: string) {
  return path.endsWith('.md') ? path.slice(0, -3) : path;
}

function noteStatusKey(note: InboxNote) {
  return (note.status || 'unknown').toLowerCase();
}

function noteSortWeight(note: InboxNote) {
  const status = noteStatusKey(note);
  const source = getNoteSource(note.path);
  const statusWeight: Record<string, number> = {
    active: 0,
    todo: 1,
    draft: 2,
    stable: 4,
    unknown: 5,
  };
  const sourceWeight: Record<InboxNoteSource, number> = {
    inbox: 0,
    extracted: 1,
    rejected: 2,
    other: 3,
  };
  return (statusWeight[status] ?? 3) * 10 + sourceWeight[source];
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

function InboxNoteCard({ note }: { note: InboxNote }) {
  const hasError = Boolean(note.error);
  const title = note.title || note.path.split('/').pop() || note.path;
  const source = getNoteSource(note.path);
  const tags = (note.tags || []).slice(0, 4);

  return (
    <div
      className={['run-card', hasError && 'run-card--read-error']
        .filter(Boolean)
        .join(' ')}
    >
      <div className="run-card__header">
        <div className="run-card__title">
          <span className="run-card__id">{title}</span>
          {note.status && <span className="badge badge--default">{note.status}</span>}
          <span className={getSourceBadgeClass(source)}>{sourceLabel(source)}</span>
          {hasError && (
            <span className="badge badge--error" title={note.error}>
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

/* ─── InboxPage ───────────────────────────────────────────────────────────── */

export const Route = createFileRoute('/inbox')({
  component: InboxRoute,
})

function InboxRoute() {
  const {
    notes,
    runs,
    loading,
    error,
    apiStatus,
    refresh,
    commitRun,
    rejectRun,
    actionState,
    pendingConfirmations,
  } = useInbox();

  const [toastMsg, setToastMsg] = useState<ToastMsg | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [noteQuery, setNoteQuery] = useState('');
  const [noteSourceFilter, setNoteSourceFilter] = useState<'all' | InboxNoteSource>('all');
  const [noteStatusFilter, setNoteStatusFilter] = useState('all');
  const [noteLimit, setNoteLimit] = useState(NOTE_PAGE_SIZE);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // True while ANY run has an in-flight action. Blocks Refresh so a concurrent
  // fetchInbox cannot wipe actionState mid-request and re-enable buttons.
  const anyActionInFlight = Object.values(actionState).some(
    (s) => s === 'committing' || s === 'rejecting'
  );

  // Stable reference — safe to include in useCallback dep arrays.
  const toast = useCallback((msg: string, isError = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg({ msg, isError });
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 4000);
  }, []); // setToastMsg is a stable setter; toastTimerRef is a ref — no deps needed

  // Clear timer on unmount to avoid setState on an unmounted component.
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
          // Some items did not commit — failed validation or rejected for low confidence.
          // The run directory may still contain quarantined files; refresh so the user
          // sees the current state rather than a silently vanished partial run.
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
          // At least one item could not be deleted. The run is partially rejected;
          // refresh so the remaining items are visible rather than hiding the run.
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

  /* filter tabs */
  const runTypes = ['all', ...new Set(runs.map((r) => r.runType ?? 'unknown'))];
  const visibleRuns =
    filterType === 'all' ? runs : runs.filter((r) => r.runType === filterType);

  const counts = runs.reduce<Record<string, number>>(
    (acc, r) => {
      const t = r.runType ?? 'unknown';
      acc[t] = (acc[t] ?? 0) + 1;
      acc.all = (acc.all ?? 0) + 1;
      return acc;
    },
    { all: 0 }
  );

  const typedNotes = notes as InboxNote[];

  const noteSourceCounts = typedNotes.reduce<Record<string, number>>(
    (acc, note) => {
      const source = getNoteSource(note.path);
      acc[source] = (acc[source] ?? 0) + 1;
      acc.all = (acc.all ?? 0) + 1;
      return acc;
    },
    { all: 0 }
  );

  const noteStatusCounts = typedNotes.reduce<Record<string, number>>(
    (acc, note) => {
      const status = noteStatusKey(note);
      acc[status] = (acc[status] ?? 0) + 1;
      acc.all = (acc.all ?? 0) + 1;
      return acc;
    },
    { all: 0 }
  );

  const noteSourceOptions = useMemo(
    () => ['all', ...new Set(typedNotes.map((note) => getNoteSource(note.path)))],
    [typedNotes]
  );

  const noteStatusOptions = useMemo(
    () => ['all', ...new Set(typedNotes.map((note) => noteStatusKey(note)))],
    [typedNotes]
  );

  const filteredNotes = useMemo(() => {
    const needle = noteQuery.trim().toLowerCase();
    return [...typedNotes]
      .filter((note) => {
        const source = getNoteSource(note.path);
        const status = noteStatusKey(note);
        if (noteSourceFilter !== 'all' && source !== noteSourceFilter) return false;
        if (noteStatusFilter !== 'all' && status !== noteStatusFilter) return false;
        if (!needle) return true;
        const haystack = [
          note.title,
          note.path,
          note.status,
          ...(note.tags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => {
        const weightDelta = noteSortWeight(a) - noteSortWeight(b);
        if (weightDelta !== 0) return weightDelta;
        return (a.title || a.path).localeCompare(b.title || b.path);
      });
  }, [noteQuery, noteSourceFilter, noteStatusFilter, typedNotes]);

  useEffect(() => {
    setNoteLimit(NOTE_PAGE_SIZE);
  }, [noteQuery, noteSourceFilter, noteStatusFilter]);

  const visibleNotes = filteredNotes.slice(0, noteLimit);
  const hasMoreNotes = filteredNotes.length > visibleNotes.length;
  const activeNoteCount = noteStatusCounts.active ?? 0;
  const draftNoteCount = noteStatusCounts.draft ?? 0;
  const stableNoteCount = noteStatusCounts.stable ?? 0;
  const rejectedNoteCount = noteSourceCounts.rejected ?? 0;
  const regularInboxCount = noteSourceCounts.inbox ?? 0;

  return (
    <main className="page inbox-page">
      {/* toast */}
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
            Triage staged promotions first, then browse the note backlog without drowning in it
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

      <section className="inbox-summary-grid">
        <div className="inbox-summary-card">
          <span className="inbox-summary-card__label">Staged proposals</span>
          <strong className="inbox-summary-card__value">{runs.length}</strong>
          <span className="inbox-summary-card__meta">ready to promote or reject</span>
        </div>
        <div className="inbox-summary-card">
          <span className="inbox-summary-card__label">Regular inbox notes</span>
          <strong className="inbox-summary-card__value">{regularInboxCount}</strong>
          <span className="inbox-summary-card__meta">plain notes under /inbox</span>
        </div>
        <div className="inbox-summary-card">
          <span className="inbox-summary-card__label">Draft / active</span>
          <strong className="inbox-summary-card__value">{draftNoteCount + activeNoteCount}</strong>
          <span className="inbox-summary-card__meta">
            {draftNoteCount} draft, {activeNoteCount} active
          </span>
        </div>
        <div className="inbox-summary-card">
          <span className="inbox-summary-card__label">Rejected backlog</span>
          <strong className="inbox-summary-card__value">{rejectedNoteCount}</strong>
          <span className="inbox-summary-card__meta">historical rejects and dead ends</span>
        </div>
      </section>

      {/* states */}
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

      {!loading && !error && notes.length === 0 && runs.length === 0 && (
        <div className="inbox-state inbox-state--empty">
          <span className="inbox-empty-icon">📭</span>
          <strong>Inbox is empty</strong>
          <span>No inbox notes or staged extraction proposals found.</span>
        </div>
      )}

      {!loading && !error && (
        <section className="inbox-list">
          <header className="inbox-section-header">
            <div>
              <h2>Staged proposals</h2>
              <p className="inbox-section-header__sub">
                Commit or reject extraction runs. This is the actual work queue.
              </p>
            </div>
            <span>{visibleRuns.length}</span>
          </header>

          {runs.length > 0 && (
            <div className="inbox-filters">
              {runTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`inbox-filter ${filterType === t ? 'inbox-filter--active' : ''}`}
                  onClick={() => setFilterType(t)}
                >
                  {t} ({counts[t] ?? 0})
                </button>
              ))}
            </div>
          )}

          {runs.length === 0 && (
            <div className="inbox-state inbox-state--empty inbox-state--panel">
              <span className="inbox-empty-icon">✅</span>
              <strong>No staged proposals waiting</strong>
              <span>
                The queue is clear. What remains below is note inventory: drafts,
                regular inbox notes, extracted artifacts, and rejected items.
              </span>
              <div className="inbox-empty-actions">
                <button
                  type="button"
                  className="btn btn--refresh"
                  onClick={() => setNoteStatusFilter('draft')}
                >
                  Show drafts ({draftNoteCount})
                </button>
                <button
                  type="button"
                  className="btn btn--refresh"
                  onClick={() => setNoteStatusFilter('active')}
                >
                  Show active ({activeNoteCount})
                </button>
                <button
                  type="button"
                  className="btn btn--refresh"
                  onClick={() => setNoteSourceFilter('rejected')}
                >
                  Show rejected ({rejectedNoteCount})
                </button>
              </div>
            </div>
          )}

          {runs.length > 0 && visibleRuns.length === 0 && (
            <div className="inbox-state inbox-state--empty">
              <span className="inbox-empty-icon">🔍</span>
              <strong>No runs match this filter</strong>
              <span>
                Try selecting a different type or{' '}
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setFilterType('all')}
                >
                  show all
                </button>
                .
              </span>
            </div>
          )}

          {visibleRuns.map((run) => (
            <RunCard
              key={run.runId}
              run={run as Run}
              onCommit={handleCommit}
              onReject={handleReject}
              runState={actionState[run.runId]}
              awaitingConfirmation={Boolean(pendingConfirmations[run.runId])}
            />
          ))}
        </section>
      )}

      {!loading && !error && notes.length > 0 && (
        <section className="inbox-list">
          <header className="inbox-section-header">
            <div>
              <h2>Inbox notes</h2>
              <p className="inbox-section-header__sub">
                Search and filter raw inbox inventory instead of scanning hundreds of entries.
              </p>
            </div>
            <span>
              {filteredNotes.length} / {notes.length}
            </span>
          </header>

          <div className="inbox-note-controls">
            <label className="inbox-note-search">
              <span>Search</span>
              <input
                type="search"
                value={noteQuery}
                onChange={(event) => setNoteQuery(event.target.value)}
                placeholder="title, path, status, tag"
              />
            </label>

            <div className="inbox-note-filter-groups">
              <div className="inbox-filters">
                {noteSourceOptions.map((source) => (
                  <button
                    key={source}
                    type="button"
                    className={`inbox-filter ${noteSourceFilter === source ? 'inbox-filter--active' : ''}`}
                    onClick={() =>
                      setNoteSourceFilter(source as 'all' | InboxNoteSource)
                    }
                  >
                    {source} ({noteSourceCounts[source] ?? 0})
                  </button>
                ))}
              </div>

              <div className="inbox-filters">
                {noteStatusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`inbox-filter ${noteStatusFilter === status ? 'inbox-filter--active' : ''}`}
                    onClick={() => setNoteStatusFilter(status)}
                  >
                    {status} ({noteStatusCounts[status] ?? 0})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredNotes.length === 0 && (
            <div className="inbox-state inbox-state--empty inbox-state--panel">
              <span className="inbox-empty-icon">🔎</span>
              <strong>No inbox notes match these filters</strong>
              <span>Reset the search or pick a broader source/status filter.</span>
            </div>
          )}

          {visibleNotes.map((note) => (
            <InboxNoteCard key={note.path} note={note as InboxNote} />
          ))}

          {hasMoreNotes && (
            <div className="inbox-list__footer">
              <button
                type="button"
                className="btn btn--refresh"
                onClick={() => setNoteLimit((current) => current + NOTE_PAGE_SIZE)}
              >
                Show {Math.min(NOTE_PAGE_SIZE, filteredNotes.length - visibleNotes.length)} more
              </button>
              <span className="inbox-list__meta">
                Showing {visibleNotes.length} of {filteredNotes.length} notes
              </span>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
