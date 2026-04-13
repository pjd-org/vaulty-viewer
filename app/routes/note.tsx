import React, { useEffect, useReducer, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import sanitizeHtml from 'sanitize-html';
import { apiFetch, UnauthenticatedError } from '../../src/utils/api';
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
import { PageContainer, SoftPanel } from '../components/layout';
import { PrimaryButton, SecondaryButton } from '../components/ui';
import { NoteHeader, NoteMetaRail, NoteBodyRenderer } from '../components/note';

const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
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

// ---------------------------------------------------------------------------
// State reducers
// ---------------------------------------------------------------------------

type NoteState = {
  note: NoteRecord | null;
  relatedNotes: RelatedNote[];
  loading: boolean;
  error: string | null;
  taskData: TaskData | null;
};
type NoteAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_ERROR'; error: string }
  | {
      type: 'LOAD_DONE';
      note: NoteRecord;
      taskData: TaskData | null;
      relatedNotes: RelatedNote[];
    }
  | { type: 'NOTE_UPDATED'; note: NoteRecord };
function noteReducer(state: NoteState, action: NoteAction): NoteState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'LOAD_DONE':
      return {
        loading: false,
        error: null,
        note: action.note,
        taskData: action.taskData,
        relatedNotes: action.relatedNotes,
      };
    case 'NOTE_UPDATED':
      return { ...state, note: action.note };
  }
}

type LifecycleState = {
  pendingPromotionToken: string;
  pendingPromotionExpiry: string | null;
  busy: 'promote' | 'reject' | 'complete' | null;
  message: string | null;
  isError: boolean;
};
type LifecycleAction =
  | { type: 'RESET' }
  | { type: 'BUSY'; op: 'promote' | 'reject' | 'complete' }
  | { type: 'MESSAGE'; message: string; isError?: boolean }
  | { type: 'DONE' }
  | { type: 'ERROR'; message: string }
  | {
      type: 'PROMOTION_PENDING';
      token: string;
      expiresAt: string | null;
      message: string;
    }
  | { type: 'PROMOTION_CLEAR' }
  | { type: 'PROMOTION_EXPIRED' };
function lifecycleReducer(
  state: LifecycleState,
  action: LifecycleAction
): LifecycleState {
  switch (action.type) {
    case 'RESET':
      return {
        pendingPromotionToken: '',
        pendingPromotionExpiry: null,
        busy: null,
        message: null,
        isError: false,
      };
    case 'BUSY':
      return { ...state, busy: action.op, message: null, isError: false };
    case 'MESSAGE':
      return {
        ...state,
        message: action.message,
        isError: action.isError ?? false,
      };
    case 'DONE':
      return { ...state, busy: null };
    case 'ERROR':
      return { ...state, busy: null, isError: true, message: action.message };
    case 'PROMOTION_PENDING':
      return {
        ...state,
        pendingPromotionToken: action.token,
        pendingPromotionExpiry: action.expiresAt,
        message: action.message,
        isError: false,
      };
    case 'PROMOTION_CLEAR':
      return {
        ...state,
        pendingPromotionToken: '',
        pendingPromotionExpiry: null,
      };
    case 'PROMOTION_EXPIRED':
      return {
        ...state,
        pendingPromotionToken: '',
        pendingPromotionExpiry: null,
        message:
          'Promote confirmation expired. Click Promote again to re-arm it.',
        isError: false,
      };
  }
}

type ReviewState = {
  decision: string;
  comment: string;
  submitting: boolean;
  message: string | null;
};
type ReviewAction =
  | { type: 'SET_DECISION'; decision: string }
  | { type: 'SET_COMMENT'; comment: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_DONE'; message: string }
  | { type: 'SUBMIT_FAIL'; message: string };
function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case 'SET_DECISION':
      return { ...state, decision: action.decision };
    case 'SET_COMMENT':
      return { ...state, comment: action.comment };
    case 'SUBMIT_START':
      return { ...state, submitting: true, message: null };
    case 'SUBMIT_DONE':
      return {
        ...state,
        submitting: false,
        comment: '',
        message: action.message,
      };
    case 'SUBMIT_FAIL':
      return { ...state, submitting: false, message: action.message };
  }
}

function NoteRoute() {
  const { p } = Route.useSearch();
  const navigate = useNavigate();
  const redirectToLogin = React.useCallback(() => {
    void navigate({ to: '/login' });
  }, [navigate]);
  const throwIfUnauthorized = React.useCallback(
    (response: Response, context: string) => {
      if (response.status === 401) {
        throw new UnauthenticatedError(context);
      }
    },
    []
  );

  const [{ note, relatedNotes, loading, error, taskData }, dispatchNote] =
    useReducer(noteReducer, {
      note: null,
      relatedNotes: [],
      loading: true,
      error: null,
      taskData: null,
    });
  const [lc, dispatchLc] = useReducer(lifecycleReducer, {
    pendingPromotionToken: '',
    pendingPromotionExpiry: null,
    busy: null,
    message: null,
    isError: false,
  });
  const [review, dispatchReview] = useReducer(reviewReducer, {
    decision: 'approve',
    comment: '',
    submitting: false,
    message: null,
  });
  const [copied, setCopied] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  useEffect(() => {
    if (!lc.pendingPromotionExpiry) return undefined;

    const expiresAtMs = Date.parse(lc.pendingPromotionExpiry);
    if (!Number.isFinite(expiresAtMs)) return undefined;

    const delayMs = Math.max(expiresAtMs - Date.now(), 0);
    const timer = window.setTimeout(() => {
      dispatchLc({ type: 'PROMOTION_EXPIRED' });
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [lc.pendingPromotionExpiry]);

  useEffect(() => {
    const requestedPath = toNoteSearchPath(p);

    const fetchNote = async () => {
      if (!requestedPath) {
        dispatchNote({
          type: 'LOAD_ERROR',
          error: 'No note path specified. Use ?p=folder/note-name',
        });
        return;
      }

      dispatchNote({ type: 'LOAD_START' });
      dispatchLc({ type: 'RESET' });

      const apiPath = toApiNotePath(requestedPath);
      const encodedPath = encodeURIComponent(apiPath);

      try {
        const response = await apiFetch(`/api/v1/notes/${encodedPath}`);
        throwIfUnauthorized(response, `Note not found: ${requestedPath}`);
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

        const loadedNote: NoteRecord = {
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
        };

        let loadedTaskData: TaskData | null = null;
        if (lifecycle.isTask) {
          try {
            const taskResponse = await apiFetch(`/api/v1/tasks/${encodedPath}`);
            throwIfUnauthorized(
              taskResponse,
              `Task not found: ${requestedPath}`
            );
            if (taskResponse.ok) {
              const taskResult = await taskResponse.json();
              loadedTaskData = taskResult.structuredContent || taskResult;
            }
          } catch (err) {
            if (err instanceof UnauthenticatedError) throw err;
            loadedTaskData = null;
          }
        }

        let loadedRelated: RelatedNote[] = [];
        try {
          const relatedResponse = await apiFetch(
            `/api/v1/graph/related/${encodedPath}?limit=8`
          );
          throwIfUnauthorized(
            relatedResponse,
            `Related notes unavailable: ${requestedPath}`
          );
          if (relatedResponse.ok) {
            const relatedResult = await relatedResponse.json();
            loadedRelated = (relatedResult?.structuredContent?.related ??
              relatedResult?.related ??
              []) as RelatedNote[];
          }
        } catch (err) {
          if (err instanceof UnauthenticatedError) throw err;
          loadedRelated = [];
        }

        dispatchNote({
          type: 'LOAD_DONE',
          note: loadedNote,
          taskData: loadedTaskData,
          relatedNotes: loadedRelated,
        });
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          redirectToLogin();
          return;
        }
        dispatchNote({ type: 'LOAD_ERROR', error: (err as Error).message });
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
    dispatchReview({ type: 'SUBMIT_START' });

    try {
      const body = {
        path: note.path,
        addHistoryNote: `Review (${review.decision}): ${review.comment || 'No comment provided.'}`,
        frontmatterPatch: {
          review_status: review.decision,
          review_updated: new Date().toISOString(),
        },
      };
      const res = await apiFetch('/api/v1/tools/obsidian_update_task/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        throw new UnauthenticatedError('Failed to record review: 401');
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const nextFrontmatter = {
        ...note.frontmatter,
        review_status: review.decision,
        review_updated: new Date().toISOString(),
      };
      dispatchNote({
        type: 'NOTE_UPDATED',
        note: {
          ...note,
          frontmatter: nextFrontmatter,
          lifecycle: getLifecycleContext(note.path, nextFrontmatter),
        },
      });
      dispatchReview({
        type: 'SUBMIT_DONE',
        message: 'Review recorded via Tasker API.',
      });
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        redirectToLogin();
        return;
      }
      dispatchReview({
        type: 'SUBMIT_FAIL',
        message: `Failed to record review: ${(err as Error).message}`,
      });
    }
  };

  const handlePromote = async () => {
    if (!note) return;
    if (!note.lifecycle.runId) {
      dispatchLc({
        type: 'MESSAGE',
        message: 'Missing run id for this staged note.',
        isError: true,
      });
      return;
    }
    dispatchLc({ type: 'BUSY', op: 'promote' });

    try {
      const res = await apiFetch(
        `/api/v1/inbox/${encodeURIComponent(note.lifecycle.runId)}/commit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: lc.pendingPromotionToken || undefined,
          }),
        }
      );
      if (res.status === 401) {
        throw new UnauthenticatedError('Failed to promote note: 401');
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }

      const status = body?.structuredContent?.status ?? body?.status;
      if (status === 'pending_confirmation') {
        dispatchLc({
          type: 'PROMOTION_PENDING',
          token: body?.structuredContent?.token ?? body?.token ?? '',
          expiresAt:
            body?.structuredContent?.expiresAt ?? body?.expiresAt ?? null,
          message:
            body?.structuredContent?.message ??
            body?.message ??
            'Confirmation armed. Click Promote again to confirm.',
        });
        return;
      }

      dispatchLc({ type: 'PROMOTION_CLEAR' });
      dispatchLc({
        type: 'MESSAGE',
        message: 'Promotion complete. Opening the canonical note.',
      });
      const targetPath = note.lifecycle.targetPath;
      if (targetPath) {
        navigate({
          to: '/note',
          search: { p: stripMarkdownExtension(targetPath) },
        });
      }
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        redirectToLogin();
        return;
      }
      dispatchLc({ type: 'ERROR', message: (err as Error).message });
    } finally {
      dispatchLc({ type: 'DONE' });
    }
  };

  const handleReject = async () => {
    if (!note) return;
    if (!note.lifecycle.runId) {
      dispatchLc({
        type: 'MESSAGE',
        message: 'Missing run id for this staged note.',
        isError: true,
      });
      return;
    }
    dispatchLc({ type: 'BUSY', op: 'reject' });

    try {
      const res = await apiFetch(
        `/api/v1/inbox/${encodeURIComponent(note.lifecycle.runId)}`,
        {
          method: 'DELETE',
        }
      );
      if (res.status === 401) {
        throw new UnauthenticatedError('Failed to reject note: 401');
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }

      const quarantinedPath =
        body?.structuredContent?.quarantinedPath ??
        body?.quarantinedPath ??
        null;
      dispatchLc({ type: 'MESSAGE', message: 'Moved to rejected queue.' });
      if (typeof quarantinedPath === 'string' && quarantinedPath.length > 0) {
        navigate({
          to: '/note',
          search: { p: stripMarkdownExtension(quarantinedPath) },
        });
      }
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        redirectToLogin();
        return;
      }
      dispatchLc({ type: 'ERROR', message: (err as Error).message });
    } finally {
      dispatchLc({ type: 'DONE' });
    }
  };

  const handleCompleteTask = async () => {
    if (!note) return;
    dispatchLc({ type: 'BUSY', op: 'complete' });

    try {
      const res = await apiFetch(
        `/api/v1/tasks/${encodeURIComponent(note.path)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }
      );
      if (res.status === 401) {
        throw new UnauthenticatedError('Failed to complete task: 401');
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }

      const updatedPath =
        getStringValue(body?.structuredContent?.path) ||
        getStringValue(body?.path) ||
        null;

      const nextPath = updatedPath || note.path;
      const nextFrontmatter = { ...note.frontmatter, status: 'completed' };
      dispatchNote({
        type: 'NOTE_UPDATED',
        note: {
          ...note,
          frontmatter: nextFrontmatter,
          path: nextPath,
          searchPath: stripMarkdownExtension(nextPath),
          lifecycle: getLifecycleContext(nextPath, nextFrontmatter),
        },
      });

      if (updatedPath && updatedPath !== note.path) {
        dispatchLc({
          type: 'MESSAGE',
          message:
            'Task completed and archived. Opening the updated note location.',
        });
        navigate({
          to: '/note',
          search: { p: stripMarkdownExtension(updatedPath) },
        });
        return;
      }
      dispatchLc({
        type: 'MESSAGE',
        message:
          'Task completed. Handler-side archive rules will move it out of notes/tasks when the completion flow finishes.',
      });
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        redirectToLogin();
        return;
      }
      dispatchLc({ type: 'ERROR', message: (err as Error).message });
    } finally {
      dispatchLc({ type: 'DONE' });
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
      'code',
      'pre',
      'kbd',
      'mark',
      'details',
      'summary',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      code: ['class'],
      pre: ['class'],
      '*': ['class', 'id'],
    },
  } as const;

  return (
    <PageContainer className="max-w-[1500px] pb-12">
      {/* Back nav */}
      <nav>
        <Link
          to="/"
          search={{ q: undefined, collection: undefined }}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← Back to vault
        </Link>
      </nav>

      {note && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-100/80" />
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-800 truncate">
                  {note.title}
                </span>
                <span className="hidden sm:inline text-xs text-slate-500 truncate">
                  {note.path}
                </span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {[
                { label: 'Huey', short: 'H' },
                { label: 'Automation', short: 'A' },
                { label: 'COD', short: 'C' },
                { label: 'Info', short: 'i' },
                { label: 'Settings', short: 'S' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  aria-label={item.label}
                  className="h-9 w-9 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  {item.short}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {note && (
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-sky-50 via-cyan-50 to-indigo-50 p-4 md:p-5">
          <NoteHeader
            display={toNoteHeaderDisplay({
              title: note.title,
              type: getStringValue(note.frontmatter.type),
              status: noteStatus,
              path: note.path,
            })}
            extraActions={
              <div className="flex flex-wrap items-center gap-2">
                {note.lifecycle.canPromote && (
                  <PrimaryButton
                    onClick={handlePromote}
                    disabled={lc.busy !== null}
                  >
                    {lc.pendingPromotionToken ? 'Confirm Promote' : 'Promote'}
                  </PrimaryButton>
                )}
                {note.lifecycle.canReject &&
                  (confirmReject ? (
                    <>
                      <span className="text-xs text-red-600 font-medium">
                        Reject note?
                      </span>
                      <SecondaryButton
                        onClick={() => {
                          handleReject();
                          setConfirmReject(false);
                        }}
                        disabled={lc.busy !== null}
                        className="text-danger hover:bg-red-50"
                      >
                        Confirm
                      </SecondaryButton>
                      <SecondaryButton
                        onClick={() => setConfirmReject(false)}
                        disabled={lc.busy !== null}
                      >
                        Cancel
                      </SecondaryButton>
                    </>
                  ) : (
                    <SecondaryButton
                      onClick={() => setConfirmReject(true)}
                      disabled={lc.busy !== null}
                      className="text-danger hover:bg-red-50"
                    >
                      Reject
                    </SecondaryButton>
                  ))}
                {note.lifecycle.canComplete && (
                  <SecondaryButton
                    onClick={handleCompleteTask}
                    disabled={lc.busy !== null}
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
              </div>
            }
          />
        </div>
      )}

      {/* Lifecycle feedback */}
      {lc.message && (
        <p
          className={`text-sm px-1 ${lc.isError ? 'text-red-600' : 'text-slate-600'}`}
        >
          {lc.message}
        </p>
      )}
      {lc.pendingPromotionExpiry && (
        <p className="text-xs text-slate-500 px-1">
          Promotion window expires at {lc.pendingPromotionExpiry}.
        </p>
      )}

      {/* Body + Rail */}
      <div className="grid grid-cols-12 gap-6">
        {/* Content */}
        <div className="col-span-12 xl:col-span-8">
          <SoftPanel>
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-sky-500 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Loading note…</p>
              </div>
            )}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-16">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Note not found
                </h2>
                <p className="text-sm text-slate-600 mb-4">{error}</p>
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
                        <span className="text-xs text-sky-700 font-medium">
                          {taskData.metrics.currentMilestone}% complete
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                      <div
                        className="bg-sky-500 h-full rounded-full transition-[width]"
                        style={{
                          width: `${taskData.metrics.currentMilestone ?? 0}%`,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {taskData.metrics.effortRemaining !== undefined && (
                        <div>
                          <p className="text-base font-bold text-slate-900">
                            {taskData.metrics.effortRemaining}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">
                            Effort Left
                          </p>
                        </div>
                      )}
                      {taskData.metrics.estimatedCompletionMin !==
                        undefined && (
                        <div>
                          <p className="text-base font-bold text-slate-900">
                            {taskData.metrics.estimatedCompletionMin}m
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">
                            Est. Time
                          </p>
                        </div>
                      )}
                      {taskData.metrics.rewardPotential !== undefined && (
                        <div>
                          <p className="text-base font-bold text-slate-900">
                            {(taskData.metrics.rewardPotential * 100).toFixed(
                              0
                            )}
                            %
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">
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
                  <div className="flex flex-wrap gap-2 mb-4 text-xs text-slate-600">
                    {noteEstimatedTimeMin !== null && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                        ~{noteEstimatedTimeMin} min
                      </span>
                    )}
                    {noteEffortScore !== null && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                        Effort {noteEffortScore}/10
                      </span>
                    )}
                    {noteGoalId && (
                      <Link
                        to="/note"
                        search={{ p: noteGoalId }}
                        className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700 hover:opacity-80 transition-opacity"
                      >
                        Goal → {formatNoteLabel(noteGoalId)}
                      </Link>
                    )}
                    {isDelegatable && (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-violet-700">
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
          <div className="xl:sticky xl:top-4 h-fit space-y-4">
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
                    <div className="text-xs text-slate-500 mb-3">
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
                            checked={review.decision === val}
                            onChange={() =>
                              dispatchReview({
                                type: 'SET_DECISION',
                                decision: val,
                              })
                            }
                            className="accent-sky-500"
                          />
                          {val === 'approve' ? 'Approve' : 'Needs changes'}
                        </label>
                      ))}
                    </div>
                    <textarea
                      className="w-full bg-slate-50 text-slate-700 text-xs rounded-xl p-2.5 border border-slate-200 focus:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 resize-none"
                      placeholder="Add a short review comment"
                      rows={3}
                      value={review.comment}
                      onChange={(e) =>
                        dispatchReview({
                          type: 'SET_COMMENT',
                          comment: e.target.value,
                        })
                      }
                    />
                    <PrimaryButton
                      onClick={() => void handleReviewSubmit()}
                      disabled={review.submitting || lc.busy !== null}
                      className="mt-2 w-full"
                    >
                      {review.submitting ? 'Submitting…' : 'Submit review'}
                    </PrimaryButton>
                    {review.message && (
                      <p className="text-xs text-slate-500 mt-2">
                        {review.message}
                      </p>
                    )}
                  </SoftPanel>
                )}

                {/* Informational notes */}
                {note.lifecycle.isTask &&
                  !note.lifecycle.canComplete &&
                  noteStatus === 'completed' && (
                    <p className="text-xs text-slate-500 px-1">
                      Completed tasks archive through the existing handler flow.
                    </p>
                  )}
                {!note.lifecycle.isTask &&
                  note.lifecycle.source === 'canonical' && (
                    <p className="text-xs text-slate-500 px-1">
                      Archive actions for canonical notes are not yet supported.
                    </p>
                  )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-200/70 flex items-center justify-between">
        <div className="flex gap-4">
          <Link
            to="/"
            search={{ q: undefined, collection: undefined }}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Back to Vault
          </Link>
          {note?.collection === 'tasks' && (
            <Link
              to="/goals"
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              View Goals →
            </Link>
          )}
        </div>
      </footer>
    </PageContainer>
  );
}
