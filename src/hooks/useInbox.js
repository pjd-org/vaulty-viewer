import { useState, useEffect, useCallback } from 'react';
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
  const [notes, setNotes] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('unknown');
  const [actionState, setActionState] = useState({});

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    setApiStatus('unknown');
    setActionState({});

    const base = getApiBase();
    try {
      const res = await fetch(`${base}/api/v1/inbox`);
      if (!res.ok) {
        setApiStatus('offline');
        setError(`API returned ${res.status}`);
        return;
      }
      const body = await res.json();
      const fetchedNotes = body?.structuredContent?.notes ?? body?.notes ?? [];
      const fetched = body?.structuredContent?.runs ?? body?.runs ?? [];
      setNotes(fetchedNotes);
      setRuns(fetched);
      setApiStatus('online');
    } catch (err) {
      setApiStatus('offline');
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const commitRun = useCallback(async (runId) => {
    setActionState((prev) => ({ ...prev, [runId]: 'committing' }));
    const base = getApiBase();
    try {
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
      // Prune actionState: remove the runId entirely so if the run reappears
      // after a refresh it starts with a clean slate rather than showing a
      // stale 'done' or 'error' badge.
      setActionState((prev) => {
        const next = { ...prev };
        delete next[runId];
        return next;
      });
      // Remove committed run from list
      setRuns((prev) => prev.filter((r) => r.runId !== runId));
      return body;
    } catch (err) {
      setActionState((prev) => ({ ...prev, [runId]: 'error' }));
      throw err;
    }
  }, []);

  const rejectRun = useCallback(async (runId) => {
    setActionState((prev) => ({ ...prev, [runId]: 'rejecting' }));
    const base = getApiBase();
    try {
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
      // Prune actionState: same reason as commitRun above.
      setActionState((prev) => {
        const next = { ...prev };
        delete next[runId];
        return next;
      });
      // Remove rejected run from list
      setRuns((prev) => prev.filter((r) => r.runId !== runId));
      return body;
    } catch (err) {
      setActionState((prev) => ({ ...prev, [runId]: 'error' }));
      throw err;
    }
  }, []);

  return {
    notes,
    runs,
    loading,
    error,
    apiStatus,
    refresh: fetchInbox,
    commitRun,
    rejectRun,
    actionState,
  };
}

export default useInbox;
