import React, { useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { apiFetch } from '../../src/utils/api';
import {
  formatNoteLabel,
  getLifecycleContext,
  getNoteCollection,
  renderNoteMarkdown,
  stripMarkdownExtension,
  toApiNotePath,
  toNoteHref,
  toNoteSearchPath,
  type NoteLifecycle,
} from '../../src/lib/note-logic';

const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

interface StatusBadgeProps {
  status: string;
}

interface PriorityBadgeProps {
  priority: number;
}

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: string;
  disabled?: boolean;
}

interface NoteRecord {
  path: string;
  searchPath: string;
  title: string;
  tags: string[];
  collection: string;
  content: string;
  html: string;
  frontmatter: Record<string, unknown>;
  lifecycle: NoteLifecycle;
}

interface RelatedNote {
  path: string;
  score: number;
  reasons?: string[];
}

interface TaskData {
  metrics?: {
    currentMilestone?: number;
    effortRemaining?: number;
    estimatedCompletionMin?: number;
    rewardPotential?: number;
  };
}

const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value : null;

const getNumberValue = (value: unknown) =>
  typeof value === 'number' ? value : null;

const getBooleanValue = (value: unknown) =>
  typeof value === 'boolean' ? value : false;

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusColors: Record<string, string> = {
    completed: 'success',
    'in-progress': 'warning',
    todo: 'info',
    blocked: 'danger',
    backlog: 'muted',
    rejected: 'danger',
  };
  const color = statusColors[status] || 'muted';
  return <span className={`note-status note-status--${color}`}>{status}</span>;
};

const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const level = priority >= 7 ? 'high' : priority >= 4 ? 'medium' : 'low';
  return <span className={`note-priority note-priority--${level}`}>P{priority}</span>;
};

const ActionButton = ({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}: ActionButtonProps) => (
  <button
    className={`note-action note-action--${variant}`}
    onClick={onClick}
    disabled={disabled}
    title={label}
    type="button"
  >
    <span className="note-action__icon">{icon}</span>
    <span className="note-action__label">{label}</span>
  </button>
);

export const Route = createFileRoute('/note')({
  validateSearch: (search: Record<string, unknown>) => ({
    p: (search.p as string) ?? '',
  }),
  component: NoteRoute,
});

function NoteRoute() {
  const { p } = Route.useSearch();
  const navigate = useNavigate();
  const [note, setNote] = useState<NoteRecord | null>(null);
  const [relatedNotes, setRelatedNotes] = useState<RelatedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [reviewDecision, setReviewDecision] = useState('approve');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [pendingPromotionToken, setPendingPromotionToken] = useState('');
  const [pendingPromotionExpiry, setPendingPromotionExpiry] = useState<string | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState<'promote' | 'reject' | 'complete' | null>(null);
  const [lifecycleMessage, setLifecycleMessage] = useState<string | null>(null);
  const [lifecycleError, setLifecycleError] = useState(false);

  useEffect(() => {
    const requestedPath = toNoteSearchPath(p);

    const fetchNote = async () => {
      if (!requestedPath) {
        setError('No note path specified. Use ?p=folder/note-name');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setPendingPromotionToken('');
      setPendingPromotionExpiry(null);
      setLifecycleMessage(null);
      setLifecycleError(false);

      const apiPath = toApiNotePath(requestedPath);
      const encodedPath = encodeURIComponent(apiPath);

      try {
        const response = await apiFetch(`/api/v1/notes/${encodedPath}`);
        if (!response.ok) {
          throw new Error(`Note not found: ${requestedPath}`);
        }

        const result = await response.json();
        const structured = result.structuredContent || {};
        const frontmatter = (structured.frontmatter || {}) as Record<string, unknown>;
        const resolvedPath = getStringValue(structured.path) || apiPath;
        const rawContent = getStringValue(structured.content) || '';
        const lifecycle = getLifecycleContext(resolvedPath, frontmatter);

        setNote({
          path: resolvedPath,
          searchPath: stripMarkdownExtension(resolvedPath),
          title:
            getStringValue(frontmatter.title) ||
            formatNoteLabel(stripMarkdownExtension(resolvedPath).split('/').pop() || ''),
          tags: Array.isArray(frontmatter.tags)
            ? frontmatter.tags.map((tag) => String(tag))
            : [],
          collection: getNoteCollection(resolvedPath),
          content: rawContent,
          html: renderNoteMarkdown(rawContent),
          frontmatter,
          lifecycle,
        });

        if (lifecycle.isTask) {
          try {
            const taskResponse = await apiFetch(`/api/v1/tasks/${encodedPath}`);
            if (taskResponse.ok) {
              const taskResult = await taskResponse.json();
              setTaskData(taskResult.structuredContent || taskResult);
            } else {
              setTaskData(null);
            }
          } catch {
            setTaskData(null);
          }
        } else {
          setTaskData(null);
        }

        try {
          const relatedResponse = await apiFetch(
            `/api/v1/graph/related/${encodedPath}?limit=8`
          );
          if (relatedResponse.ok) {
            const relatedResult = await relatedResponse.json();
            setRelatedNotes(
              (relatedResult?.structuredContent?.related ??
                relatedResult?.related ??
                []) as RelatedNote[]
            );
          } else {
            setRelatedNotes([]);
          }
        } catch {
          setRelatedNotes([]);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void fetchNote();
  }, [p]);

  const handleCopyPath = () => {
    if (!note) return;
    navigator.clipboard.writeText(note.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInObsidian = () => {
    if (!note) return;
    const vaultName = 'vault';
    const obsidianUrl = `obsidian://open?vault=${vaultName}&file=${encodeURIComponent(
      note.searchPath
    )}.md`;
    window.open(obsidianUrl, '_blank');
  };

  const handleShare = async () => {
    if (!note) return;
    const shareUrl = `${window.location.origin}${toNoteHref(note.searchPath)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          url: shareUrl,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReviewSubmit = async () => {
    if (!note) return;
    setReviewSubmitting(true);
    setReviewMessage(null);

    try {
      const body = {
        path: note.path,
        addHistoryNote: `Review (${reviewDecision}): ${reviewComment || 'No comment provided.'}`,
        frontmatterPatch: {
          review_status: reviewDecision,
          review_updated: new Date().toISOString(),
        },
      };
      const res = await apiFetch('/api/v1/tools/obsidian_update_task/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      setNote((current) =>
        current
          ? {
              ...current,
              frontmatter: {
                ...current.frontmatter,
                review_status: reviewDecision,
                review_updated: new Date().toISOString(),
              },
              lifecycle: {
                ...current.lifecycle,
                reviewStatus: reviewDecision,
              },
            }
          : current
      );
      setReviewMessage('Review recorded via Tasker API.');
      setReviewComment('');
    } catch (err) {
      setReviewMessage(`Failed to record review: ${(err as Error).message}`);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handlePromote = async () => {
    if (!note) return;
    setLifecycleBusy('promote');
    setLifecycleMessage(null);
    setLifecycleError(false);

    try {
      const res = await apiFetch('/api/v1/inbox/item/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: note.path,
          token: pendingPromotionToken || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }

      const status = body?.structuredContent?.status ?? body?.status;
      if (status === 'pending_confirmation') {
        const nextToken = body?.structuredContent?.token ?? body?.token;
        setPendingPromotionToken(nextToken || '');
        setPendingPromotionExpiry(
          body?.structuredContent?.expiresAt ?? body?.expiresAt ?? null
        );
        setLifecycleMessage(
          body?.structuredContent?.message ??
            body?.message ??
            'Confirmation armed. Click Promote again to confirm.'
        );
        return;
      }

      setPendingPromotionToken('');
      setPendingPromotionExpiry(null);
      setLifecycleMessage('Promotion complete. Opening the canonical note.');
      const targetPath = note.lifecycle.targetPath;
      if (targetPath) {
        navigate({
          to: '/note',
          search: { p: stripMarkdownExtension(targetPath) },
        });
      }
    } catch (err) {
      setLifecycleError(true);
      setLifecycleMessage((err as Error).message);
    } finally {
      setLifecycleBusy(null);
    }
  };

  const handleReject = async () => {
    if (!note) return;
    setLifecycleBusy('reject');
    setLifecycleMessage(null);
    setLifecycleError(false);

    try {
      const res = await apiFetch('/api/v1/inbox/item/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: note.path }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }

      const quarantinedPath =
        body?.structuredContent?.quarantinedPath ??
        body?.quarantinedPath ??
        null;
      setLifecycleMessage('Moved to rejected queue.');
      if (typeof quarantinedPath === 'string' && quarantinedPath.length > 0) {
        navigate({
          to: '/note',
          search: { p: stripMarkdownExtension(quarantinedPath) },
        });
      }
    } catch (err) {
      setLifecycleError(true);
      setLifecycleMessage((err as Error).message);
    } finally {
      setLifecycleBusy(null);
    }
  };

  const handleCompleteTask = async () => {
    if (!note) return;
    setLifecycleBusy('complete');
    setLifecycleMessage(null);
    setLifecycleError(false);

    try {
      const res = await apiFetch(
        `/api/v1/tasks/${encodeURIComponent(note.path)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }

      setNote((current) =>
        current
          ? {
              ...current,
              frontmatter: {
                ...current.frontmatter,
                status: 'completed',
              },
            }
          : current
      );
      setLifecycleMessage(
        'Task marked completed. Handler-side archive rules will move it out of notes/tasks when the completion flow finishes.'
      );
    } catch (err) {
      setLifecycleError(true);
      setLifecycleMessage((err as Error).message);
    } finally {
      setLifecycleBusy(null);
    }
  };

  if (loading) {
    return (
      <main className="page page--detail note-page">
        <header className="detail__header">
          <Link
            to="/"
            search={{ q: undefined, collection: undefined }}
            className="back-link"
          >
            ← Back to vault
          </Link>
        </header>
        <div className="note-loading">
          <div className="note-loading__spinner"></div>
          <p className="note-loading__text">Loading note…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page page--detail note-page">
        <header className="detail__header">
          <Link
            to="/"
            search={{ q: undefined, collection: undefined }}
            className="back-link"
          >
            ← Back to vault
          </Link>
        </header>
        <div className="note-error">
          <div className="note-error__icon">📄</div>
          <h2>Note Not Found</h2>
          <p>{error}</p>
          <div className="note-error__actions">
            <button
              onClick={() =>
                navigate({
                  to: '/',
                  search: { q: undefined, collection: undefined },
                })
              }
              className="note-action note-action--primary"
              type="button"
            >
              Return to Vault
            </button>
            <button
              onClick={() => window.location.reload()}
              className="note-action"
              type="button"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!note) return null;

  const noteStatus = getStringValue(note.frontmatter.status);
  const notePriority = getNumberValue(note.frontmatter.priority);
  const noteCreated = getStringValue(note.frontmatter.created);
  const noteUpdated = getStringValue(note.frontmatter.updated);
  const noteEstimatedTimeMin = getNumberValue(note.frontmatter.estimatedTimeMin);
  const noteEffortScore = getNumberValue(note.frontmatter.effortScore);
  const noteGoalId = getStringValue(note.frontmatter.goalId);
  const noteSpecPath = getStringValue(note.frontmatter.spec_path);
  const isDelegatable = getBooleanValue(note.frontmatter.delegatable);
  const isGoal =
    note.frontmatter.type === 'goal' || note.collection === 'goals';

  return (
    <main
      className={[
        'page',
        'page--detail',
        'note-page',
        note.lifecycle.isTask && 'note-page--task',
        isGoal && 'note-page--goal',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <nav className="note-breadcrumb">
        <Link
          to="/"
          search={{ q: undefined, collection: undefined }}
          className="note-breadcrumb__item"
        >
          Vault
        </Link>
        <span className="note-breadcrumb__sep">/</span>
        <Link
          to="/"
          search={{ collection: note.collection, q: '' }}
          className="note-breadcrumb__item"
        >
          {formatNoteLabel(note.collection)}
        </Link>
        <span className="note-breadcrumb__sep">/</span>
        <span className="note-breadcrumb__current">{note.title}</span>
      </nav>

      <header className="note-header">
        <div className="note-header__badges">
          <span className={`note-type note-type--${note.collection}`}>
            {note.collection}
          </span>
          {noteStatus && <StatusBadge status={noteStatus} />}
          {notePriority !== null && <PriorityBadge priority={notePriority} />}
          {isDelegatable && (
            <span className="note-badge note-badge--delegatable">delegatable</span>
          )}
          {note.lifecycle.source !== 'canonical' && (
            <span className="note-badge note-badge--queue">
              {note.lifecycle.source} queue
            </span>
          )}
        </div>

        <h1 className="note-header__title">{note.title}</h1>

        <div className="note-meta">
          {noteCreated && (
            <span className="note-meta__item">Created {formatDate(noteCreated)}</span>
          )}
          {noteUpdated && (
            <span className="note-meta__item">Updated {formatDate(noteUpdated)}</span>
          )}
          {noteEstimatedTimeMin !== null && (
            <span className="note-meta__item">~{noteEstimatedTimeMin} min</span>
          )}
          {noteEffortScore !== null && (
            <span className="note-meta__item">Effort {noteEffortScore}/10</span>
          )}
          {noteGoalId && (
            <Link
              to="/note"
              search={{ p: noteGoalId }}
              className="note-meta__item note-meta__link"
            >
              Goal {formatNoteLabel(noteGoalId)}
            </Link>
          )}
        </div>

        {note.tags.length > 0 && (
          <div className="note-tags">
            {note.tags.map((tag) => (
              <Link
                key={tag}
                to="/"
                search={{ q: tag, collection: 'all' }}
                className="note-tag"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="note-layout">
        <section className="note-main">
          {note.lifecycle.isTask && taskData && (
            <div className="note-task-card">
              <div className="note-task-card__header">
                <h3>Task Progress</h3>
                {taskData.metrics?.currentMilestone !== undefined && (
                  <span className="note-task-card__milestone">
                    {taskData.metrics.currentMilestone}% complete
                  </span>
                )}
              </div>
              <div className="note-task-card__progress">
                <div
                  className="note-task-card__bar"
                  style={{
                    width: `${taskData.metrics?.currentMilestone || 0}%`,
                  }}
                />
              </div>
              <div className="note-task-card__stats">
                {taskData.metrics?.effortRemaining !== undefined && (
                  <div className="note-task-card__stat">
                    <span className="note-task-card__stat-value">
                      {taskData.metrics.effortRemaining}
                    </span>
                    <span className="note-task-card__stat-label">Effort Left</span>
                  </div>
                )}
                {taskData.metrics?.estimatedCompletionMin !== undefined && (
                  <div className="note-task-card__stat">
                    <span className="note-task-card__stat-value">
                      {taskData.metrics.estimatedCompletionMin}m
                    </span>
                    <span className="note-task-card__stat-label">Est. Time</span>
                  </div>
                )}
                {taskData.metrics?.rewardPotential !== undefined && (
                  <div className="note-task-card__stat">
                    <span className="note-task-card__stat-value">
                      {(taskData.metrics.rewardPotential * 100).toFixed(0)}%
                    </span>
                    <span className="note-task-card__stat-label">Reward</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <article
            className="note-content"
            dangerouslySetInnerHTML={{ __html: note.html }}
          />
        </section>

        <aside className="note-sidebar">
          <section className="note-panel">
            <div className="note-panel__header">
              <h3>Actions</h3>
              <span className="note-panel__eyebrow">work from the note</span>
            </div>
            <div className="note-actions note-actions--stacked">
              <div className="note-actions__group note-actions__group--stacked">
                {note.lifecycle.canPromote && (
                  <ActionButton
                    icon={pendingPromotionToken ? '✓' : '↑'}
                    label={
                      pendingPromotionToken ? 'Confirm Promote' : 'Promote'
                    }
                    onClick={handlePromote}
                    variant="primary"
                    disabled={lifecycleBusy !== null}
                  />
                )}
                {note.lifecycle.canReject && (
                  <ActionButton
                    icon="✕"
                    label="Reject to Queue"
                    onClick={handleReject}
                    variant="danger"
                    disabled={lifecycleBusy !== null}
                  />
                )}
                {note.lifecycle.canComplete && (
                  <ActionButton
                    icon="✓"
                    label="Complete Task"
                    onClick={handleCompleteTask}
                    variant="accent"
                    disabled={lifecycleBusy !== null}
                  />
                )}
                <ActionButton
                  icon="📋"
                  label={copied ? 'Copied!' : 'Copy Path'}
                  onClick={handleCopyPath}
                  variant={copied ? 'success' : 'default'}
                />
                <ActionButton icon="🔗" label="Share" onClick={handleShare} />
                <ActionButton
                  icon="🗂"
                  label="Open in Obsidian"
                  onClick={handleOpenInObsidian}
                  variant="accent"
                />
                {noteSpecPath && (
                  <ActionButton
                    icon="📖"
                    label="Open Spec"
                    onClick={() =>
                      navigate({
                        to: '/note',
                        search: { p: stripMarkdownExtension(noteSpecPath) },
                      })
                    }
                  />
                )}
              </div>
              {lifecycleMessage && (
                <p
                  className={[
                    'note-panel__message',
                    lifecycleError && 'note-panel__message--error',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {lifecycleMessage}
                </p>
              )}
              {pendingPromotionExpiry && (
                <p className="note-panel__hint">
                  Confirmation expires at {pendingPromotionExpiry}.
                </p>
              )}
              {note.lifecycle.isTask && !note.lifecycle.canComplete && noteStatus === 'completed' && (
                <p className="note-panel__hint">
                  Completed tasks archive through the existing handler flow.
                </p>
              )}
              {!note.lifecycle.isTask && note.lifecycle.source === 'canonical' && (
                <p className="note-panel__hint">
                  Archive and move actions for regular canonical notes are not yet
                  supported in the viewer.
                </p>
              )}
            </div>
          </section>

          {note.lifecycle.canReview && (
            <section className="note-panel note-review">
              <div className="note-panel__header">
                <h3>Review</h3>
                <span className="note-panel__eyebrow">
                  {note.lifecycle.reviewStatus
                    ? `current: ${note.lifecycle.reviewStatus}`
                    : 'task workflow'}
                </span>
              </div>
              <div className="note-review__controls">
                <label className="note-review__option">
                  <input
                    type="radio"
                    name="review-decision"
                    value="approve"
                    checked={reviewDecision === 'approve'}
                    onChange={() => setReviewDecision('approve')}
                  />
                  <span>Approve</span>
                </label>
                <label className="note-review__option">
                  <input
                    type="radio"
                    name="review-decision"
                    value="needs_changes"
                    checked={reviewDecision === 'needs_changes'}
                    onChange={() => setReviewDecision('needs_changes')}
                  />
                  <span>Needs changes</span>
                </label>
              </div>
              <textarea
                className="note-review__comment"
                placeholder="Add a short review comment"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
              />
              <div className="note-review__actions">
                <button
                  className="note-review__submit"
                  onClick={handleReviewSubmit}
                  disabled={reviewSubmitting}
                  type="button"
                >
                  {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                </button>
              </div>
              {reviewMessage && (
                <p className="note-review__message">{reviewMessage}</p>
              )}
            </section>
          )}

          <section className="note-panel">
            <div className="note-panel__header">
              <h3>Context</h3>
              <span className="note-panel__eyebrow">metadata</span>
            </div>
            <dl className="note-sidebar__facts">
              <dt>Path</dt>
              <dd>{note.path}</dd>
              {note.lifecycle.runId && (
                <>
                  <dt>Run</dt>
                  <dd>{note.lifecycle.runId}</dd>
                </>
              )}
              {note.lifecycle.targetPath && (
                <>
                  <dt>Target</dt>
                  <dd>{note.lifecycle.targetPath}</dd>
                </>
              )}
              {note.lifecycle.reviewStatus && (
                <>
                  <dt>Review</dt>
                  <dd>{note.lifecycle.reviewStatus}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="note-panel">
            <div className="note-panel__header">
              <h3>Related Notes</h3>
              <span className="note-panel__eyebrow">graph</span>
            </div>
            {relatedNotes.length === 0 ? (
              <p className="note-panel__hint">No related notes found yet.</p>
            ) : (
              <div className="note-related">
                {relatedNotes.map((related) => (
                  <Link
                    key={related.path}
                    to="/note"
                    search={{ p: stripMarkdownExtension(related.path) }}
                    className="note-related__item"
                  >
                    <span className="note-related__title">
                      {formatNoteLabel(
                        stripMarkdownExtension(related.path).split('/').pop() ||
                          related.path
                      )}
                    </span>
                    <span className="note-related__meta">
                      {stripMarkdownExtension(related.path)}
                    </span>
                    <span className="note-related__score">
                      {Math.round((related.score || 0) * 100)}%
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <footer className="note-footer">
        <div className="note-footer__nav">
          <Link
            to="/"
            search={{ q: undefined, collection: undefined }}
            className="note-footer__link"
          >
            ← Back to Vault
          </Link>
          {note.collection === 'tasks' && (
            <Link to="/goals" className="note-footer__link">
              View Goals →
            </Link>
          )}
        </div>
        <div className="note-footer__info">
          <span className="note-footer__path">{note.path}</span>
        </div>
      </footer>
    </main>
  );
}
