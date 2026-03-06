import React, { useState } from 'react';
import { useInbox } from '../hooks/useInbox';

/* ─── helpers ────────────────────────────────────────────────────────────── */

function runTypeBadge(runType) {
  const map = {
    signals_infer: { label: 'signals · infer', cls: 'badge badge--signals' },
    conversation: { label: 'conversation', cls: 'badge badge--conversation' },
    manual: { label: 'manual', cls: 'badge badge--manual' },
    daily: { label: 'daily', cls: 'badge badge--daily' },
  };
  const def = map[runType] ?? {
    label: runType ?? 'unknown',
    cls: 'badge badge--default',
  };
  return <span className={def.cls}>{def.label}</span>;
}

function confidenceBar(confidence) {
  if (confidence == null) return null;
  const pct = Math.round(Number(confidence) * 100);
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

function DomainFields({ fields }) {
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

/* ─── RunCard ─────────────────────────────────────────────────────────────── */

function RunCard({ run, onCommit, onReject, actionState }) {
  const [expanded, setExpanded] = useState(false);
  const state = actionState[run.runId];
  const busy = state === 'committing' || state === 'rejecting';
  const isDone = state === 'done';
  const isError = state === 'error';
  const isSignal = run.runType === 'signals_infer';

  return (
    <div
      className={`run-card ${isDone ? 'run-card--done' : ''} ${isError ? 'run-card--error' : ''}`}
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
          {!isDone && (
            <>
              <button
                type="button"
                className="btn btn--commit"
                disabled={busy || isSignal}
                title={
                  isSignal
                    ? 'signals_infer runs require explicit human approval'
                    : 'Commit this run'
                }
                onClick={() => onCommit(run.runId)}
              >
                {state === 'committing' ? 'Committing…' : '✓ Commit'}
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
          )}
          {isDone && <span className="run-card__done-label">✓ done</span>}
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
}

/* ─── InboxPage ───────────────────────────────────────────────────────────── */

export function Head() {
  return (
    <>
      <title>Inbox — Vaulty Viewer</title>
      <meta
        name="description"
        content="Review and approve staged extraction proposals."
      />
    </>
  );
}

export default function InboxPage() {
  const {
    runs,
    loading,
    error,
    apiStatus,
    refresh,
    commitRun,
    rejectRun,
    actionState,
  } = useInbox();

  const [toastMsg, setToastMsg] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const toast = (msg, isError = false) => {
    setToastMsg({ msg, isError });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCommit = async (runId) => {
    try {
      const result = await commitRun(runId);
      const committed = result?.structuredContent?.committed ?? 0;
      toast(
        `Committed ${committed} item${committed !== 1 ? 's' : ''} from ${runId}`
      );
    } catch (err) {
      toast(err.message ?? 'Commit failed', true);
    }
  };

  const handleReject = async (runId) => {
    try {
      await rejectRun(runId);
      toast(`Rejected run ${runId}`);
    } catch (err) {
      toast(err.message ?? 'Reject failed', true);
    }
  };

  /* filter tabs */
  const runTypes = ['all', ...new Set(runs.map((r) => r.runType ?? 'unknown'))];
  const visibleRuns =
    filterType === 'all' ? runs : runs.filter((r) => r.runType === filterType);

  const counts = runs.reduce(
    (acc, r) => {
      const t = r.runType ?? 'unknown';
      acc[t] = (acc[t] ?? 0) + 1;
      acc.all = (acc.all ?? 0) + 1;
      return acc;
    },
    { all: 0 }
  );

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
            Staged extraction proposals awaiting review
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
            disabled={loading}
          >
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {/* filter tabs */}
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

      {/* states */}
      {loading && (
        <div className="inbox-state">
          <div className="inbox-spinner" />
          <span>Loading staged runs…</span>
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

      {!loading && !error && runs.length === 0 && (
        <div className="inbox-state inbox-state--empty">
          <span className="inbox-empty-icon">📭</span>
          <strong>Inbox is empty</strong>
          <span>No staged extraction proposals found.</span>
        </div>
      )}

      {!loading && !error && runs.length > 0 && visibleRuns.length === 0 && (
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

      {!loading && !error && visibleRuns.length > 0 && (
        <section className="inbox-list">
          {visibleRuns.map((run) => (
            <RunCard
              key={run.runId}
              run={run}
              onCommit={handleCommit}
              onReject={handleReject}
              actionState={actionState}
            />
          ))}
        </section>
      )}
    </main>
  );
}
