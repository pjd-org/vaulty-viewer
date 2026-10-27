import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import getApiBase, {
  ForbiddenError,
  UnauthenticatedError,
  apiFetch,
} from '../utils/api';
import { useHydrated } from './useHydrated';
import { isConfirmedItemPromotion } from '../lib/note-path';
import {
  splitInboxNotes,
  type InboxNote as InboxLogicNote,
} from '../lib/inbox-logic';

export interface InboxNote {
  path: string;
  title?: string;
  status?: InboxLogicNote['status'];
  frontmatter?: Record<string, unknown>;
  tags?: string[];
  error?: string;
}

export interface InboxRunItem {
  path?: string;
  targetPath?: string;
  domainFields?: Record<string, unknown>;
}

export interface InboxRun {
  runId: string;
  runType?: string;
  action?: string;
  itemCount: number;
  confidence?: number;
  templateRef?: string;
  items: InboxRunItem[];
  error?: string;
}

export interface InboxPendingConfirmation {
  token?: string;
  expiresAt?: string;
  message?: string;
}

/**
 * A staged draft returned by the authorized inbox endpoint.
 *
 * `reviewable` and `blockedReason` come from the server: the Viewer must not
 * re-derive promotion eligibility from editable frontmatter.
 */
export interface StagedDraft {
  path: string;
  runId: string;
  title: string | null;
  status: string | null;
  targetPath: string | null;
  runType: string | null;
  ownerIds: string[];
  reviewable: boolean;
  blockedReason: string | null;
}

export type InboxActionState = Record<
  string,
  'committing' | 'rejecting' | 'error' | undefined
>;

export interface InboxMutationResult {
  status?: 'pending_confirmation' | 'committed';
  token?: string;
  expiresAt?: string;
  message?: string;
  mode?: string;
  structuredContent?: {
    status?: 'pending_confirmation' | 'committed';
    token?: string;
    expiresAt?: string;
    message?: string;
    committed?: number;
    failed?: number;
    rejected?: number;
    errors?: number | string[];
  };
  [key: string]: unknown;
}

export interface UseInboxResult {
  notes: InboxNote[];
  workbenchNotes: InboxNote[];
  archiveNotes: InboxNote[];
  /** Staged drafts this principal is authorized to see. */
  stagedDrafts: StagedDraft[];
  /** False when the API could not establish staged review authority. */
  stagedVisible: boolean;
  runs: InboxRun[];
  signals: Array<Record<string, unknown>>;
  counts: {
    signals: number;
    queue: number;
    workbench: number;
    archive: number;
  };
  loading: boolean;
  error: string | null;
  apiStatus: 'online' | 'offline' | 'unknown';
  refresh: () => Promise<unknown>;
  commitRun: (runId: string) => Promise<InboxMutationResult>;
  commitItem: (path: string) => Promise<InboxMutationResult>;
  rejectRun: (runId: string) => Promise<InboxMutationResult>;
  actionState: InboxActionState;
  pendingConfirmations: Record<string, InboxPendingConfirmation | undefined>;
  pendingItemConfirmations: Record<string, InboxPendingConfirmation | undefined>;
}

/**
 * Hook to manage the combined inbox view.
 *
 * Returns:
 *   notes       — array of regular inbox notes from GET /api/v1/inbox
 *   runs        — array of staged run objects from GET /api/v1/inbox
 *   loading     — initial load in progress
 *   error       — last fetch error message or null
 *   apiStatus   — 'online' | 'offline' | 'unknown'
 *   refresh     — re-fetch the inbox
 *   commitRun   — (runId) => Promise — commit a run
 *   rejectRun   — (runId) => Promise — always refuses; Reject is disabled, nothing is deleted
 *   actionState — { [runId]: 'committing' | 'rejecting' | 'error' }
 */
export function useInbox(): UseInboxResult {
  const [actionState, setActionState] = useState<InboxActionState>({});
  const [pendingConfirmations, setPendingConfirmations] = useState<
    Record<string, InboxPendingConfirmation | undefined>
  >({});
  const [pendingItemConfirmations, setPendingItemConfirmations] = useState<
    Record<string, InboxPendingConfirmation | undefined>
  >({});
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const base = getApiBase();
  const queryEnabled = hydrated;
  const queryKey = ['inbox', base];

  const clearPendingConfirmation = useCallback((runId: string) => {
    setPendingConfirmations((prev) => {
      if (!prev[runId]) return prev;
      const next = { ...prev };
      delete next[runId];
      return next;
    });
  }, []);

  const readCommitField = useCallback(
    (body: unknown, field: string): unknown => {
      if (!body || typeof body !== 'object') return undefined;
      const structured = (body as { structuredContent?: unknown })
        ?.structuredContent;
      if (structured && typeof structured === 'object' && field in structured) {
        return (structured as Record<string, unknown>)[field];
      }
      return (body as Record<string, unknown>)[field];
    },
    []
  );

  interface InboxQueryData {
  notes: InboxNote[];
  staged: StagedDraft[];
  stagedVisible: boolean;
  runs: InboxRun[];
  signals: Array<Record<string, unknown>>;
}

  const inboxQuery = useQuery<InboxQueryData>({
    queryKey,
    enabled: queryEnabled,
    staleTime: 10_000,
    retry: 1,
    queryFn: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);

      try {
        const res = await apiFetch('/api/v1/inbox', {
          signal: controller.signal,
        });
        if (res.status === 401) {
          throw new UnauthenticatedError('Failed to fetch inbox: 401');
        }
        if (res.status === 403) {
          throw new ForbiddenError('Failed to fetch inbox: 403');
        }
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const body = (await res.json().catch(() => ({}))) as {
          structuredContent?: {
            notes?: InboxNote[];
            staged?: StagedDraft[];
            stagedVisible?: boolean;
            runs?: InboxRun[];
            signals?: Array<Record<string, unknown>>;
          };
          notes?: InboxNote[];
          staged?: StagedDraft[];
          stagedVisible?: boolean;
          runs?: InboxRun[];
          signals?: Array<Record<string, unknown>>;
          error?: string;
        };
        const structured = body?.structuredContent;
        const notes = structured?.notes ?? body?.notes;
        const staged = structured?.staged ?? body?.staged ?? [];
        const stagedVisible = structured?.stagedVisible ?? body?.stagedVisible ?? false;
        const runs = structured?.runs ?? body?.runs;
        const signals = structured?.signals ?? body?.signals;

        // Surface API auth/transport failures instead of silently rendering
        // an empty inbox forever. A response missing any of the contract's
        // arrays is unavailable, not an empty inbox.
        if (typeof body?.error === 'string' && !Array.isArray(notes)) {
          throw new Error(body.error);
        }
        if (
          !Array.isArray(notes) ||
          !Array.isArray(runs) ||
          !Array.isArray(signals)
        ) {
          throw new Error('Inbox response unavailable: incomplete payload');
        }

        return {
          notes,
          staged: Array.isArray(staged) ? staged : [],
          stagedVisible,
          runs,
          signals,
        };
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('Inbox request timed out');
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  });

  const commitMutation = useMutation({
    mutationFn: async ({
      runId,
      token,
    }: {
      runId: string;
      token?: string;
    }): Promise<InboxMutationResult> => {
      const commitToken =
        typeof token === 'string' && token.trim().length > 0
          ? token.trim()
          : '';
      const init: RequestInit = {
        method: 'POST',
        ...(commitToken
          ? {
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: commitToken }),
            }
          : {}),
      };
      const res = await apiFetch(
        `/api/v1/inbox/${encodeURIComponent(runId)}/commit`,
        init
      );
      // Parse body before mutating state — if JSON is malformed the error
      // is caught below and state stays consistent (never 'done' + missing run).
      const body = (await res.json().catch(() => ({}))) as InboxMutationResult;
      if (!res.ok) {
        throw new Error(body?.message ?? `Commit failed: ${res.status}`);
      }
      const status = readCommitField(body, 'status');
      const returnedToken = readCommitField(body, 'token');
      if (status === 'pending_confirmation' && !returnedToken) {
        throw new Error(
          (readCommitField(body, 'message') as string) ??
            'Promotion confirmation failed'
        );
      }
      if (status !== 'pending_confirmation') {
        const committed = readCommitField(body, 'committed');
        const failed = readCommitField(body, 'failed');
        if (
          status !== 'committed' ||
          typeof committed !== 'number' ||
          committed < 1 ||
          (typeof failed === 'number' && failed > 0)
        ) {
          throw new Error('Promotion not confirmed: no successful run receipt.');
        }
      }
      return body;
    },
    onSuccess: async (
      body: InboxMutationResult,
      variables: { runId: string; token?: string }
    ) => {
      const runId = variables.runId;
      const status = readCommitField(body, 'status');

      if (status === 'pending_confirmation') {
        setActionState((prev) => {
          const next = { ...prev };
          delete next[runId];
          return next;
        });
        setPendingConfirmations((prev) => ({
          ...prev,
          [runId]: {
            token: readCommitField(body, 'token') as string | undefined,
            expiresAt: readCommitField(body, 'expiresAt') as
              | string
              | undefined,
            message: readCommitField(body, 'message') as
              | string
              | undefined,
          },
        }));
        return;
      }

      clearPendingConfirmation(runId);
      // Prune actionState: remove the runId entirely so if the run reappears
      // after a refresh it starts with a clean slate rather than showing a
      // stale 'done' or 'error' badge.
      setActionState((prev) => {
        const next = { ...prev };
        delete next[runId];
        return next;
      });

      queryClient.setQueryData<InboxQueryData>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          runs: (current.runs || []).filter((r) => r.runId !== runId),
        };
      });

      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
    onError: (
      errorObj: unknown,
      variables: { runId: string; token?: string }
    ) => {
      void errorObj;
      if (variables?.token) {
        clearPendingConfirmation(variables.runId);
      }
      setActionState((prev) => ({
        ...prev,
        [variables.runId]: 'error',
      }));
    },
  });

  const commitItemMutation = useMutation({
    mutationFn: async ({
      path: stagedPath,
      token,
    }: {
      path: string;
      token?: string;
    }): Promise<InboxMutationResult> => {
      const commitToken =
        typeof token === 'string' && token.trim().length > 0 ? token.trim() : '';
      const res = await apiFetch('/api/v1/inbox/item/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: stagedPath,
          ...(commitToken ? { token: commitToken } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as InboxMutationResult;
      if (!res.ok) {
        throw new Error(
          body?.message ?? `Item promotion failed: ${res.status}`
        );
      }
      const status = readCommitField(body, 'status');
      if (status === 'pending_confirmation') {
        if (!readCommitField(body, 'token')) {
          throw new Error('Promotion confirmation failed: no token issued.');
        }
        return body;
      }
      if (!isConfirmedItemPromotion(body, stagedPath)) {
        throw new Error(
          'Promotion not confirmed: no successful receipt for this item.'
        );
      }
      return body;
    },
    onSuccess: async (
      body: InboxMutationResult,
      variables: { path: string; token?: string }
    ) => {
      const stagedPath = variables.path;
      const status = readCommitField(body, 'status');
      if (status === 'pending_confirmation') {
        setActionState((prev) => {
          const next = { ...prev };
          delete next[stagedPath];
          return next;
        });
        setPendingItemConfirmations((prev) => ({
          ...prev,
          [stagedPath]: {
            token: readCommitField(body, 'token') as string | undefined,
            expiresAt: readCommitField(body, 'expiresAt') as string | undefined,
            message: readCommitField(body, 'message') as string | undefined,
          },
        }));
        return;
      }

      setPendingItemConfirmations((prev) => {
        if (!prev[stagedPath]) return prev;
        const next = { ...prev };
        delete next[stagedPath];
        return next;
      });
      setActionState((prev) => {
        const next = { ...prev };
        delete next[stagedPath];
        return next;
      });

      queryClient.setQueryData<InboxQueryData>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          staged: current.staged.filter((draft) => draft.path !== stagedPath),
        };
      });

      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
    onError: (errorObj: unknown, variables: { path: string; token?: string }) => {
      void errorObj;
      if (variables?.token) {
        setPendingItemConfirmations((prev) => {
          const next = { ...prev };
          delete next[variables.path];
          return next;
        });
      }
      setActionState((prev) => ({ ...prev, [variables.path]: 'error' }));
    },
  });

  const commitRun = useCallback(
    async (runId: string): Promise<InboxMutationResult> => {
      const pending = pendingConfirmations[runId];
      const expiresAtMs =
        typeof pending?.expiresAt === 'string'
          ? Date.parse(pending.expiresAt)
          : Number.NaN;
      const token =
        pending?.token &&
        (!Number.isFinite(expiresAtMs) || expiresAtMs > Date.now())
          ? pending.token
          : undefined;

      if (pending?.token && !token) {
        clearPendingConfirmation(runId);
      }

      setActionState((prev) => ({ ...prev, [runId]: 'committing' }));
      return commitMutation.mutateAsync({ runId, token });
    },
    [clearPendingConfirmation, commitMutation, pendingConfirmations]
  );

  const commitItem = useCallback(
    async (stagedPath: string): Promise<InboxMutationResult> => {
      const pending = pendingItemConfirmations[stagedPath];
      const expiresAtMs =
        typeof pending?.expiresAt === 'string'
          ? Date.parse(pending.expiresAt)
          : Number.NaN;
      const token =
        pending?.token &&
        (!Number.isFinite(expiresAtMs) || expiresAtMs > Date.now())
          ? pending.token
          : undefined;
      setActionState((prev) => ({ ...prev, [stagedPath]: 'committing' }));
      return commitItemMutation.mutateAsync({ path: stagedPath, token });
    },
    [commitItemMutation, pendingItemConfirmations]
  );

  const rejectRun = useCallback(
    async (_runId: string): Promise<InboxMutationResult> => {
      throw new Error('Reject is disabled; staged evidence is kept and nothing is deleted.');
    },
    []
  );

  const notes = inboxQuery.data?.notes || [];
  const stagedDrafts = inboxQuery.data?.staged || [];
  const stagedVisible = inboxQuery.data?.stagedVisible ?? false;
  const runs = inboxQuery.data?.runs || [];
  const signals = inboxQuery.data?.signals || [];

  const { workbenchNotes, archiveNotes } = splitInboxNotes(
    notes as InboxLogicNote[]
  );

  const counts = {
    signals: signals.length,
    queue: runs.length,
    workbench: workbenchNotes.length,
    archive: archiveNotes.length,
  };

  const loading =
    !hydrated ||
    ((!inboxQuery.data || !Array.isArray(inboxQuery.data.notes)) &&
      inboxQuery.isFetching);
  const error = inboxQuery.error
    ? inboxQuery.error instanceof Error
      ? inboxQuery.error.message
      : String(inboxQuery.error)
    : null;
  const apiStatus = inboxQuery.isError
    ? 'offline'
    : inboxQuery.isSuccess
      ? 'online'
      : 'unknown';

  return {
    notes,
    runs,
    signals,
    stagedDrafts,
    stagedVisible,
    workbenchNotes,
    archiveNotes,
    counts,
    loading,
    error,
    apiStatus,
    refresh: () => inboxQuery.refetch(),
    commitRun,
    commitItem,
    rejectRun,
    actionState,
    pendingConfirmations,
    pendingItemConfirmations,
  };
}

export default useInbox;