import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import getApiBase, {
  ForbiddenError,
  UnauthenticatedError,
  apiFetch,
} from '../utils/api';
import { useHydrated } from './useHydrated';
import {
  splitInboxNotes,
  type InboxNote as InboxLogicNote,
} from '../lib/inbox-logic';

export interface InboxNote {
  path: string;
  title?: string;
  status?: string;
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
  runs: InboxRun[];
  counts: {
    queue: number;
    workbench: number;
    archive: number;
  };
  loading: boolean;
  error: string | null;
  apiStatus: 'online' | 'offline' | 'unknown';
  refresh: () => Promise<unknown>;
  commitRun: (runId: string) => Promise<InboxMutationResult>;
  rejectRun: (runId: string) => Promise<InboxMutationResult>;
  actionState: InboxActionState;
  pendingConfirmations: Record<string, InboxPendingConfirmation | undefined>;
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
 *   rejectRun   — (runId) => Promise — reject/delete a run
 *   actionState — { [runId]: 'committing' | 'rejecting' | 'error' }
 */
export function useInbox(): UseInboxResult {
  const [actionState, setActionState] = useState<InboxActionState>({});
  const [pendingConfirmations, setPendingConfirmations] = useState<
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
  runs: InboxRun[];
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
            runs?: InboxRun[];
          };
          notes?: InboxNote[];
          runs?: InboxRun[];
          error?: string;
        };
        const structured = body?.structuredContent;
        const notes = structured?.notes ?? body?.notes;
        const runs = structured?.runs ?? body?.runs;

        // Surface API auth/transport failures instead of silently rendering
        // an empty inbox forever.
        if (
          !Array.isArray(notes) &&
          !Array.isArray(runs) &&
          typeof body?.error === 'string'
        ) {
          throw new Error(body.error);
        }

        return {
          notes: Array.isArray(notes) ? notes : [],
          runs: Array.isArray(runs) ? runs : [],
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

  const rejectMutation = useMutation({
    mutationFn: async (
      runId: string
    ): Promise<InboxMutationResult> => {
      const res = await apiFetch(
        `/api/v1/inbox/${encodeURIComponent(runId)}`,
        {
          method: 'DELETE',
        }
      );
      // Parse body before mutating state — same reason as commitRun above.
      const body = (await res.json().catch(() => ({}))) as InboxMutationResult;
      if (!res.ok) {
        throw new Error(body?.message ?? `Reject failed: ${res.status}`);
      }
      return body;
    },
    onSuccess: async (
      body: InboxMutationResult,
      runId: string
    ) => {
      void body;
      clearPendingConfirmation(runId);
      // Prune actionState: same reason as commitRun above.
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
    onError: (errorObj: unknown, runId: string) => {
      void errorObj;
      setActionState((prev) => ({ ...prev, [runId]: 'error' }));
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

  const rejectRun = useCallback(
    async (runId: string): Promise<InboxMutationResult> => {
      clearPendingConfirmation(runId);
      setActionState((prev) => ({ ...prev, [runId]: 'rejecting' }));
      return rejectMutation.mutateAsync(runId);
    },
    [clearPendingConfirmation, rejectMutation]
  );

  const notes = inboxQuery.data?.notes || [];
  const runs = inboxQuery.data?.runs || [];

  const { workbenchNotes, archiveNotes } = splitInboxNotes(
    notes as InboxLogicNote[]
  );

  const counts = {
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
    workbenchNotes,
    archiveNotes,
    counts,
    loading,
    error,
    apiStatus,
    refresh: () => inboxQuery.refetch(),
    commitRun,
    rejectRun,
    actionState,
    pendingConfirmations,
  };
}

export default useInbox;