import React, { useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import sanitizeHtml from 'sanitize-html';
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
import { toNoteHeaderDisplay } from '../lib/display';
import { SoftPanel } from '../components/layout';
import { PrimaryButton, SecondaryButton } from '../components/ui';
import { NoteHeader, NoteMetaRail, NoteBodyRenderer } from '../components/note';

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
  const [pendingPromotionExpiry, setPendingPromotionExpiry] = useState<
    string | null
  >(null);
  const [lifecycleBusy, setLifecycleBusy] = useState<
    'promote' | 'reject' | 'complete' | null
  >(null);
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
      setLifecycleMessage(
        'Promote confirmation expired. Click Promote again to re-arm it.'
      );
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
        const frontmatter = (structured.frontmatter || {}) as Record<
          string,
          unknown
        >;
        const resolvedPath = getStringValue(structured.path) || apiPath;
        const rawContent = getStringValue(structured.content) || '';
        const lifecycle = getLifecycleContext(resolvedPath, frontmatter);

        setNote({
          path: resolvedPath,
          searchPath: stripMarkdownExtension(resolvedPath),
          title:
            getStringValue(frontmatter.title) ||
            formatNoteLabel(
              stripMarkdownExtension(resolvedPath).split('/').pop() || ''
            ),
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

  // Derived values (safe to compute before render; guarded where needed)
  const noteSpecPath = note ? getStringValue(note.frontmatter.spec_path) : null;
  const noteStatus = note ? getStringValue(note.frontmatter.status) : null;
  const noteEstimatedTimeMin = note
    ? getNumberValue(note.frontmatter.estimatedTimeMin)
    : null;
  const noteEffortScore = note
    ? getNumberValue(note.frontmatter.effortScore)
    : null;
  const noteGoalId = note ? getStringValue(note.frontmatter.goalId) : null;
  const isDelegatable = note
    ? getBooleanValue(note.frontmatter.delegatable)
    : false;

  // Sanitize options preserved from original
  const sanitizeOptions = {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'code', 'pre', 'kbd', 'mark', 'details', 'summary',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      code: ['class'],
      pre: ['class'],
      '*': ['class', 'id'],
    },
  } as const;

  return (
    <main className="px-4 sm:px-6 pb-12 pt-6 max-w-[1440px] mx-auto space-y-6">
      {/* Back nav */}
      <nav>
        <Link
          to="/"
          search={{ q: undefined, collection: undefined }}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Back to vault
        </Link>
      </nav>

      {/* Header */}
      {note && (
        <NoteHeader
          display={toNoteHeaderDisplay({
            title: note.title,
            type: getStringValue(note.frontmatter.type),
            status: noteStatus,
            path: note.path,
          })}
          extraActions={
            <>
              {note.lifecycle.canPromote && (
                <PrimaryButton
                  onClick={handlePromote}
                  disabled={lifecycleBusy !== null}
                >
                  {pendingPromotionToken ? 'Confirm Promote' : 'Promote'}
                </PrimaryButton>
              )}
              {note.lifecycle.canReject && (
                <SecondaryButton
                  onClick={handleReject}
                  disabled={lifecycleBusy !== null}
                  className="text-red-600 hover:bg-red-50"
                >
                  Reject
                </SecondaryButton>
              )}
              {note.lifecycle.canComplete && (
                <SecondaryButton
                  onClick={handleCompleteTask}
                  disabled={lifecycleBusy !== null}
                >
                  Complete &amp; Archive
                </SecondaryButton>
              )}
              <SecondaryButton onClick={handleCopyPath}>
                {copied ? 'Copied!' : 'Copy Path'}
              </SecondaryButton>
              <SecondaryButton onClick={() => void handleShare()}>
                Share
              </SecondaryButton>
              <SecondaryButton onClick={handleOpenInObsidian}>
                Open in Obsidian
              </SecondaryButton>
              {noteSpecPath && (
                <SecondaryButton
                  onClick={() =>
                    navigate({
                      to: '/note',
                      search: { p: stripMarkdownExtension(noteSpecPath) },
                    })
                  }
                >
                  Open Spec
                </SecondaryButton>
              )}
            </>
          }
        />
      )}

      {/* Lifecycle feedback */}
      {lifecycleMessage && (
        <p
          className={`text-sm px-1 ${lifecycleError ? 'text-red-500' : 'text-slate-500'}`}
        >
          {lifecycleMessage}
        </p>
      )}
      {pendingPromotionExpiry && (
        <p className="text-xs text-slate-400 px-1">
          Promotion window expires at {pendingPromotionExpiry}.
        </p>
      )}

      {/* Body + Rail */}
      <div className="grid grid-cols-12 gap-6">
        {/* Content */}
        <div className="col-span-12 lg:col-span-8">
          <SoftPanel>
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin mb-3" />
                <p className="text-sm text-slate-400">Loading note…</p>
              </div>
            )}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="text-3xl mb-3">📄</span>
                <h2 className="text-lg font-semibold text-slate-800 mb-1">
                  Note not found
                </h2>
                <p className="text-sm text-slate-500 mb-4">{error}</p>
                <div className="flex gap-3">
                  <PrimaryButton
                    onClick={() =>
                      navigate({
                        to: '/',
                        search: { q: undefined, collection: undefined },
                      })
                    }
                  >
                    Return to Vault
                  </PrimaryButton>
                  <SecondaryButton onClick={() => window.location.reload()}>
                    Try Again
                  </SecondaryButton>
                </div>
              </div>
            )}
            {!loading && !error && note && (
              <>
                {/* Task progress */}
                {note.lifecycle.isTask && taskData?.metrics && (
                  <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-slate-700">
                        Task Progress
                      </span>
                      {taskData.metrics.currentMilestone !== undefined && (
                        <span className="text-xs text-blue-600 font-medium">
                          {taskData.metrics.currentMilestone}% complete
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{
                          width: `${taskData.metrics.currentMilestone ?? 0}%`,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {taskData.metrics.effortRemaining !== undefined && (
                        <div>
                          <p className="text-base font-bold text-slate-800">
                            {taskData.metrics.effortRemaining}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Effort Left
                          </p>
                        </div>
                      )}
                      {taskData.metrics.estimatedCompletionMin !== undefined && (
                        <div>
                          <p className="text-base font-bold text-slate-800">
                            {taskData.metrics.estimatedCompletionMin}m
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Est. Time
                          </p>
                        </div>
                      )}
                      {taskData.metrics.rewardPotential !== undefined && (
                        <div>
                          <p className="text-base font-bold text-slate-800">
                            {(taskData.metrics.rewardPotential * 100).toFixed(0)}%
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Reward
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Inline meta (time / effort / goal) */}
                {(noteEstimatedTimeMin !== null ||
                  noteEffortScore !== null ||
                  noteGoalId ||
                  isDelegatable) && (
                  <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-500">
                    {noteEstimatedTimeMin !== null && (
                      <span>~{noteEstimatedTimeMin} min</span>
                    )}
                    {noteEffortScore !== null && (
                      <span>Effort {noteEffortScore}/10</span>
                    )}
                    {noteGoalId && (
                      <Link
                        to="/note"
                        search={{ p: noteGoalId }}
                        className="text-blue-500 hover:opacity-80 transition-opacity"
                      >
                        Goal → {formatNoteLabel(noteGoalId)}
                      </Link>
                    )}
                    {isDelegatable && (
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                        delegatable
                      </span>
                    )}
                  </div>
                )}

                <NoteBodyRenderer
                  html={sanitizeHtml(note.html, sanitizeOptions)}
                />
              </>
            )}
          </SoftPanel>
        </div>

        {/* Meta rail */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {note && (
            <>
              <NoteMetaRail
                frontmatter={note.frontmatter}
                lifecycle={note.lifecycle}
                relatedNotes={relatedNotes}
                path={note.path}
              />

              {/* Task review */}
              {note.lifecycle.canReview && (
                <SoftPanel title="Task Review">
                  <div className="text-xs text-slate-400 mb-3">
                    {note.lifecycle.reviewStatus
                      ? `Current: ${note.lifecycle.reviewStatus}`
                      : 'No review yet'}
                  </div>
                  <div className="flex gap-3 mb-3 flex-wrap">
                    {['approve', 'needs_changes'].map((val) => (
                      <label
                        key={val}
                        className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700"
                      >
                        <input
                          type="radio"
                          name="review-decision"
                          value={val}
                          checked={reviewDecision === val}
                          onChange={() => setReviewDecision(val)}
                          className="accent-blue-500"
                        />
                        {val === 'approve' ? 'Approve' : 'Needs changes'}
                      </label>
                    ))}
                  </div>
                  <textarea
                    className="w-full bg-slate-50 text-slate-700 text-xs rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-blue-300 resize-none"
                    placeholder="Add a short review comment"
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                  <PrimaryButton
                    onClick={() => void handleReviewSubmit()}
                    disabled={reviewSubmitting || lifecycleBusy !== null}
                    className="mt-2 w-full"
                  >
                    {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                  </PrimaryButton>
                  {reviewMessage && (
                    <p className="text-xs text-slate-400 mt-2">{reviewMessage}</p>
                  )}
                </SoftPanel>
              )}

              {/* Informational notes */}
              {note.lifecycle.isTask &&
                !note.lifecycle.canComplete &&
                noteStatus === 'completed' && (
                  <p className="text-xs text-slate-400 px-1">
                    Completed tasks archive through the existing handler flow.
                  </p>
                )}
              {!note.lifecycle.isTask &&
                note.lifecycle.source === 'canonical' && (
                  <p className="text-xs text-slate-400 px-1">
                    Archive actions for canonical notes are not yet supported.
                  </p>
                )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-4">
          <Link
            to="/"
            search={{ q: undefined, collection: undefined }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Back to Vault
          </Link>
          {note?.collection === 'tasks' && (
            <Link
              to="/goals"
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              View Goals →
            </Link>
          )}
        </div>
      </footer>
    </main>
  );
}
