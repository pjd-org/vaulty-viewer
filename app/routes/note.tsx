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

const statusColors: Record<string, string> = {
  completed: 'bg-secondary/10 text-secondary',
  'in-progress': 'bg-primary/10 text-primary',
  todo: 'bg-surface-container-high text-on-surface-variant',
  blocked: 'bg-error/10 text-error',
  backlog: 'bg-surface-container-high text-on-surface-variant',
  rejected: 'bg-error/10 text-error',
};

const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={`font-manrope text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[status] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
    {status}
  </span>
);

const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const cls = priority >= 7 ? 'bg-error/10 text-error' : priority >= 4 ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant';
  return <span className={`font-manrope text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${cls}`}>P{priority}</span>;
};

const variantClass: Record<string, string> = {
  primary: 'bg-primary text-white hover:opacity-90',
  danger: 'bg-error/10 text-error hover:bg-error/20 border border-error/20',
  accent: 'bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/20',
  success: 'bg-secondary/10 text-secondary',
  default: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/20',
};

const ActionButton = ({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}: ActionButtonProps) => (
  <button
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-manrope text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variantClass[variant] ?? variantClass.default}`}
    onClick={onClick}
    disabled={disabled}
    title={label}
    type="button"
  >
    <span>{icon}</span>
    <span>{label}</span>
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
    if (!pendingPromotionExpiry) return undefined;

    const expiresAtMs = Date.parse(pendingPromotionExpiry);
    if (!Number.isFinite(expiresAtMs)) return undefined;

    const delayMs = Math.max(expiresAtMs - Date.now(), 0);
    const timer = window.setTimeout(() => {
      setPendingPromotionToken('');
      setPendingPromotionExpiry(null);
      setLifecycleMessage('Promote confirmation expired. Click Promote again to re-arm it.');
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [pendingPromotionExpiry]);

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

      setNote((current) => {
        if (!current) return current;
        const nextFrontmatter = {
          ...current.frontmatter,
          review_status: reviewDecision,
          review_updated: new Date().toISOString(),
        };
        return {
          ...current,
          frontmatter: nextFrontmatter,
          lifecycle: getLifecycleContext(current.path, nextFrontmatter),
        };
      });
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
    if (!note.lifecycle.runId) {
      setLifecycleError(true);
      setLifecycleMessage('Missing run id for this staged note.');
      return;
    }
    setLifecycleBusy('promote');
    setLifecycleMessage(null);
    setLifecycleError(false);

    try {
      const res = await apiFetch(
        `/api/v1/inbox/${encodeURIComponent(note.lifecycle.runId)}/commit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: pendingPromotionToken || undefined,
          }),
        }
      );
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
    if (!note.lifecycle.runId) {
      setLifecycleError(true);
      setLifecycleMessage('Missing run id for this staged note.');
      return;
    }
    setLifecycleBusy('reject');
    setLifecycleMessage(null);
    setLifecycleError(false);

    try {
      const res = await apiFetch(
        `/api/v1/inbox/${encodeURIComponent(note.lifecycle.runId)}`,
        {
          method: 'DELETE',
        }
      );
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

      const updatedPath =
        getStringValue(body?.structuredContent?.path) ||
        getStringValue(body?.path) ||
        null;
      setNote((current) => {
        if (!current) return current;
        const nextPath = updatedPath || current.path;
        const nextFrontmatter = {
          ...current.frontmatter,
          status: 'completed',
        };
        return {
          ...current,
          frontmatter: nextFrontmatter,
          path: nextPath,
          searchPath: stripMarkdownExtension(nextPath),
          lifecycle: getLifecycleContext(nextPath, nextFrontmatter),
        };
      });
      if (updatedPath && updatedPath !== note.path) {
        setLifecycleMessage(
          'Task completed and archived. Opening the updated note location.'
        );
        navigate({
          to: '/note',
          search: { p: stripMarkdownExtension(updatedPath) },
        });
        return;
      }
      setLifecycleMessage(
        'Task completed. Handler-side archive rules will move it out of notes/tasks when the completion flow finishes.'
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
      <main className="px-6 pb-12 pt-6 max-w-[900px] mx-auto">
        <Link to="/" search={{ q: undefined, collection: undefined }} className="inline-flex items-center gap-1 font-manrope text-xs text-on-surface-variant hover:text-on-surface transition-colors mb-6">
          ← Back to vault
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4" />
          <p className="font-manrope text-sm">Loading note…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-6 pb-12 pt-6 max-w-[900px] mx-auto">
        <Link to="/" search={{ q: undefined, collection: undefined }} className="inline-flex items-center gap-1 font-manrope text-xs text-on-surface-variant hover:text-on-surface transition-colors mb-6">
          ← Back to vault
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <span className="text-4xl mb-4">📄</span>
          <h2 className="font-space-grotesk text-xl font-bold text-on-surface mb-2">Note Not Found</h2>
          <p className="font-manrope text-sm text-on-surface-variant mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate({ to: '/', search: { q: undefined, collection: undefined } })}
              className="px-4 py-2 bg-primary text-white rounded-lg font-manrope text-xs font-bold hover:opacity-90 transition-opacity"
              type="button"
            >
              Return to Vault
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-manrope text-xs border border-outline-variant/20 hover:bg-surface-container-highest transition-colors"
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
    <main className="px-6 pb-12 pt-6 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-manrope text-[11px] text-on-surface-variant mb-6">
        <Link to="/" search={{ q: undefined, collection: undefined }} className="hover:text-on-surface transition-colors">
          Vault
        </Link>
        <span className="opacity-40">/</span>
        <Link to="/" search={{ collection: note.collection, q: '' }} className="hover:text-on-surface transition-colors">
          {formatNoteLabel(note.collection)}
        </Link>
        <span className="opacity-40">/</span>
        <span className="text-on-surface truncate max-w-xs">{note.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="font-manrope text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-primary/10 text-primary rounded">
            {note.collection}
          </span>
          {noteStatus && <StatusBadge status={noteStatus} />}
          {notePriority !== null && <PriorityBadge priority={notePriority} />}
          {isDelegatable && (
            <span className="font-manrope text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-secondary/10 text-secondary rounded">
              delegatable
            </span>
          )}
          {note.lifecycle.source !== 'canonical' && (
            <span className="font-manrope text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded">
              {note.lifecycle.source} queue
            </span>
          )}
        </div>

        <h1 className="font-space-grotesk text-3xl font-extrabold tracking-tight text-on-surface leading-tight mb-3">
          {note.title}
        </h1>

        <div className="flex items-center gap-4 flex-wrap font-manrope text-[11px] text-on-surface-variant">
          {noteCreated && <span>Created {formatDate(noteCreated)}</span>}
          {noteUpdated && <span>Updated {formatDate(noteUpdated)}</span>}
          {noteEstimatedTimeMin !== null && <span>~{noteEstimatedTimeMin} min</span>}
          {noteEffortScore !== null && <span>Effort {noteEffortScore}/10</span>}
          {noteGoalId && (
            <Link to="/note" search={{ p: noteGoalId }} className="text-primary hover:opacity-80 transition-opacity">
              Goal {formatNoteLabel(noteGoalId)}
            </Link>
          )}
        </div>

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {note.tags.map((tag) => (
              <Link
                key={tag}
                to="/"
                search={{ q: tag, collection: 'all' }}
                className="font-manrope text-[10px] px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded hover:bg-primary/10 hover:text-primary transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Main content */}
        <section className="flex-1 min-w-0">
          {/* Task progress card */}
          {note.lifecycle.isTask && taskData && (
            <div className="bg-surface-container rounded-xl p-5 mb-6 border border-outline-variant/10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-space-grotesk font-bold text-sm text-on-surface">Task Progress</h3>
                {taskData.metrics?.currentMilestone !== undefined && (
                  <span className="font-manrope text-[10px] uppercase tracking-widest text-primary font-bold">
                    {taskData.metrics.currentMilestone}% complete
                  </span>
                )}
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden mb-4">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${taskData.metrics?.currentMilestone || 0}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {taskData.metrics?.effortRemaining !== undefined && (
                  <div className="text-center">
                    <p className="font-space-grotesk font-bold text-lg text-on-surface">{taskData.metrics.effortRemaining}</p>
                    <p className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">Effort Left</p>
                  </div>
                )}
                {taskData.metrics?.estimatedCompletionMin !== undefined && (
                  <div className="text-center">
                    <p className="font-space-grotesk font-bold text-lg text-on-surface">{taskData.metrics.estimatedCompletionMin}m</p>
                    <p className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">Est. Time</p>
                  </div>
                )}
                {taskData.metrics?.rewardPotential !== undefined && (
                  <div className="text-center">
                    <p className="font-space-grotesk font-bold text-lg text-on-surface">{(taskData.metrics.rewardPotential * 100).toFixed(0)}%</p>
                    <p className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">Reward</p>
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

        {/* Sidebar */}
        <aside className="lg:w-72 shrink-0 flex flex-col gap-4 lg:sticky lg:top-6">

          {/* Actions */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-space-grotesk font-bold text-sm text-on-surface">Actions</h3>
              <span className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">work from note</span>
            </div>
            <div className="flex flex-col gap-2">
              {note.lifecycle.canPromote && (
                <ActionButton
                  icon={pendingPromotionToken ? '✓' : '↑'}
                  label={pendingPromotionToken ? 'Confirm Promote' : 'Promote'}
                  onClick={handlePromote}
                  variant="primary"
                  disabled={lifecycleBusy !== null}
                />
              )}
              {note.lifecycle.canReject && (
                <ActionButton icon="✕" label="Reject to Queue" onClick={handleReject} variant="danger" disabled={lifecycleBusy !== null} />
              )}
              {note.lifecycle.canComplete && (
                <ActionButton icon="✓" label="Complete & Archive" onClick={handleCompleteTask} variant="accent" disabled={lifecycleBusy !== null} />
              )}
              <ActionButton icon="📋" label={copied ? 'Copied!' : 'Copy Path'} onClick={handleCopyPath} variant={copied ? 'success' : 'default'} />
              <ActionButton icon="🔗" label="Share" onClick={handleShare} />
              <ActionButton icon="🗂" label="Open in Obsidian" onClick={handleOpenInObsidian} variant="accent" />
              {noteSpecPath && (
                <ActionButton
                  icon="📖"
                  label="Open Spec"
                  onClick={() => navigate({ to: '/note', search: { p: stripMarkdownExtension(noteSpecPath) } })}
                />
              )}
            </div>
            {note.lifecycle.canReview && (
              <div className="mt-4 pt-4 border-t border-outline-variant/10">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-space-grotesk font-bold text-xs text-on-surface">Task Review</h4>
                  <span className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {note.lifecycle.reviewStatus ? `current: ${note.lifecycle.reviewStatus}` : 'task workflow'}
                  </span>
                </div>
                <div className="flex gap-3 mb-3 flex-wrap">
                  {['approve', 'needs_changes'].map((val) => (
                    <label key={val} className="flex items-center gap-1.5 cursor-pointer font-manrope text-xs text-on-surface">
                      <input
                        type="radio"
                        name="review-decision"
                        value={val}
                        checked={reviewDecision === val}
                        onChange={() => setReviewDecision(val)}
                        className="accent-primary"
                      />
                      {val === 'approve' ? 'Approve' : 'Needs changes'}
                    </label>
                  ))}
                </div>
                <textarea
                  className="w-full bg-surface-container-high text-on-surface font-manrope text-xs rounded-lg p-2.5 border border-outline-variant/20 focus:outline-none focus:border-primary/40 resize-none"
                  placeholder="Add a short review comment"
                  rows={3}
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                />
                  <button
                    className="mt-2 w-full px-3 py-1.5 bg-primary text-white rounded-lg font-manrope text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
                    onClick={handleReviewSubmit}
                    disabled={reviewSubmitting || lifecycleBusy !== null}
                    type="button"
                  >
                    {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                  </button>
                {reviewMessage && (
                  <p className="font-manrope text-xs text-on-surface-variant mt-2">{reviewMessage}</p>
                )}
              </div>
            )}
            {lifecycleMessage && (
              <p className={`font-manrope text-xs mt-3 ${lifecycleError ? 'text-error' : 'text-on-surface-variant'}`}>
                {lifecycleMessage}
              </p>
            )}
            {pendingPromotionExpiry && (
              <p className="font-manrope text-[10px] text-on-surface-variant mt-1">
                Expires at {pendingPromotionExpiry}.
              </p>
            )}
            {note.lifecycle.isTask && !note.lifecycle.canComplete && noteStatus === 'completed' && (
              <p className="font-manrope text-[10px] text-on-surface-variant mt-1">
                Completed tasks archive through the existing handler flow.
              </p>
            )}
              {!note.lifecycle.isTask && note.lifecycle.source === 'canonical' && (
                <p className="font-manrope text-[10px] text-on-surface-variant mt-1">
                  Archive actions for canonical notes are not yet supported.
                </p>
              )}
            </div>

          {/* Context */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-space-grotesk font-bold text-sm text-on-surface">Context</h3>
              <span className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">metadata</span>
            </div>
            <dl className="space-y-2">
              {[
                ['Path', note.path],
                note.lifecycle.runId ? ['Run', note.lifecycle.runId] : null,
                note.lifecycle.targetPath ? ['Target', note.lifecycle.targetPath] : null,
                note.lifecycle.reviewStatus ? ['Review', note.lifecycle.reviewStatus] : null,
              ].filter((x): x is [string, string] => x !== null).map(([dt, dd]) => (
                <div key={dt as string}>
                  <dt className="font-manrope text-[9px] uppercase tracking-widest text-on-surface-variant">{dt as string}</dt>
                  <dd className="font-manrope text-[11px] text-on-surface break-all">{dd as string}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Related notes */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-space-grotesk font-bold text-sm text-on-surface">Related Notes</h3>
              <span className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">graph</span>
            </div>
            {relatedNotes.length === 0 ? (
              <p className="font-manrope text-xs text-on-surface-variant">No related notes found yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {relatedNotes.map((related) => (
                  <Link
                    key={related.path}
                    to="/note"
                    search={{ p: stripMarkdownExtension(related.path) }}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 hover:border-primary/20 transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="font-manrope text-xs font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                        {formatNoteLabel(stripMarkdownExtension(related.path).split('/').pop() || related.path)}
                      </p>
                      <p className="font-manrope text-[10px] text-on-surface-variant truncate">
                        {stripMarkdownExtension(related.path)}
                      </p>
                    </div>
                    <span className="font-manrope text-[10px] text-primary shrink-0">
                      {Math.round((related.score || 0) * 100)}%
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="mt-10 pt-6 border-t border-outline-variant/20 flex items-center justify-between">
        <div className="flex gap-6">
          <Link
            to="/"
            search={{ q: undefined, collection: undefined }}
            className="font-manrope text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            ← Back to Vault
          </Link>
          {note.collection === 'tasks' && (
            <Link to="/goals" className="font-manrope text-xs text-on-surface-variant hover:text-on-surface transition-colors">
              View Goals →
            </Link>
          )}
        </div>
        <span className="font-manrope text-[10px] text-on-surface-variant truncate max-w-xs">{note.path}</span>
      </footer>
    </main>
  );
}
