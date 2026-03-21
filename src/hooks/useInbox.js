import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import getApiBase, { apiFetch } from '../utils/api';

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
export function useInbox() {
  const [actionState, setActionState] = useState({});
  const [pendingConfirmations, setPendingConfirmations] = useState({});
  const queryClient = useQueryClient();
  const base = getApiBase();
  const queryEnabled = typeof window !== 'undefined';
  const queryKey = ['inbox', base];

  const clearPendingConfirmation = useCallback((runId) => {
    setPendingConfirmations((prev) => {
      if (!prev[runId]) return prev;
      const next = { ...prev };
      delete next[runId];
      return next;
    });
  }, []);

  const readCommitField = useCallback((body, field) => {
    if (!body || typeof body !== 'object') return undefined;
    const structured = body?.structuredContent;
    if (structured && typeof structured === 'object' && field in structured) {
      return structured[field];
    }
    return body[field];
  }, []);

  const inboxQuery = useQuery({
    queryKey,
    enabled: queryEnabled,
    staleTime: 10_000,
    retry: 1,
    queryFn: async () => {
      const res = await apiFetch('/api/v1/inbox');
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      const body = await res.json();
      return {
        notes: body?.structuredContent?.notes ?? body?.notes ?? [],
        runs: body?.structuredContent?.runs ?? body?.runs ?? [],
      };
    },
  });

  const commitMutation = useMutation({
    mutationFn: async ({ runId, token }) => {
      const commitToken =
        typeof token === 'string' && token.trim().length > 0
          ? token.trim()
          : '';
      const init = {
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
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `Commit failed: ${res.status}`);
      }
      const status = readCommitField(body, 'status');
      const returnedToken = readCommitField(body, 'token');
      if (status === 'pending_confirmation' && !returnedToken) {
        throw new Error(
          readCommitField(body, 'message') ?? 'Promotion confirmation failed'
        );
      }
      return body;
    },
    onSuccess: async (body, variables) => {
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
            token: readCommitField(body, 'token'),
            expiresAt: readCommitField(body, 'expiresAt'),
            message: readCommitField(body, 'message'),
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

      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          runs: (current.runs || []).filter((r) => r.runId !== runId),
        };
      });

      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
    onError: (errorObj, variables) => {
      void errorObj;
      if (variables?.token) {
        clearPendingConfirmation(variables.runId);
      }
      setActionState((prev) => ({ ...prev, [variables.runId]: 'error' }));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (runId) => {
      const res = await apiFetch(
        `/api/v1/inbox/${encodeURIComponent(runId)}`,
        {
          method: 'DELETE',
        }
      );
      // Parse body before mutating state — same reason as commitRun above.
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `Reject failed: ${res.status}`);
      }
      return body;
    },
    onSuccess: async (body, runId) => {
      void body;
      clearPendingConfirmation(runId);
      // Prune actionState: same reason as commitRun above.
      setActionState((prev) => {
        const next = { ...prev };
        delete next[runId];
        return next;
      });

      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          runs: (current.runs || []).filter((r) => r.runId !== runId),
        };
      });

      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
    onError: (errorObj, runId) => {
      void errorObj;
      setActionState((prev) => ({ ...prev, [runId]: 'error' }));
    },
  });

  const commitRun = useCallback(
    async (runId) => {
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
    async (runId) => {
      clearPendingConfirmation(runId);
      setActionState((prev) => ({ ...prev, [runId]: 'rejecting' }));
      return rejectMutation.mutateAsync(runId);
    },
    [clearPendingConfirmation, rejectMutation]
  );

  const notes = inboxQuery.data?.notes || [];
  const runs = inboxQuery.data?.runs || [];
  const loading = queryEnabled ? inboxQuery.isFetching : false;
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
