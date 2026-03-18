import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import getApiBase from '../utils/api';

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
  const queryClient = useQueryClient();
  const base = getApiBase();
  const queryEnabled = typeof window !== 'undefined' && base !== null;
  const queryKey = ['inbox', base];

  const inboxQuery = useQuery({
    queryKey,
    enabled: queryEnabled,
    staleTime: 10_000,
    retry: 1,
    queryFn: async () => {
      const res = await fetch(`${base}/api/v1/inbox`);
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
    mutationFn: async (runId) => {
      const res = await fetch(
        `${base}/api/v1/inbox/${encodeURIComponent(runId)}/commit`,
        {
          method: 'POST',
        }
      );
      // Parse body before mutating state — if JSON is malformed the error
      // is caught below and state stays consistent (never 'done' + missing run).
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `Commit failed: ${res.status}`);
      }
      return body;
    },
    onSuccess: async (body, runId) => {
      void body;
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
    onError: (errorObj, runId) => {
      void errorObj;
      setActionState((prev) => ({ ...prev, [runId]: 'error' }));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (runId) => {
      const res = await fetch(
        `${base}/api/v1/inbox/${encodeURIComponent(runId)}`,
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
      setActionState((prev) => ({ ...prev, [runId]: 'committing' }));
      return commitMutation.mutateAsync(runId);
    },
    [commitMutation]
  );

  const rejectRun = useCallback(
    async (runId) => {
      setActionState((prev) => ({ ...prev, [runId]: 'rejecting' }));
      return rejectMutation.mutateAsync(runId);
    },
    [rejectMutation]
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
  };
}

export default useInbox;
