import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../src/store/ui';
import {
  invalidateQueriesForDomain,
  type MutationDomain,
  type VerificationOutcome,
} from '../lib/viewer-adapter';
import { apiFetch } from '../../src/utils/api';

/** Shared React Query key for in-flight and settled verification outcomes. */
export const VERIFICATION_OUTCOMES_KEY = ['verification-outcomes'] as const;

/** Max outcomes to keep in the rail before pruning oldest. */
const MAX_OUTCOMES = 5;

interface UseMutationWithVerificationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  domain: MutationDomain;
  actionId: string;
  projectId?: string;
  /** Optional human-readable summary for the verification record. */
  verificationSummary?: string;
}

/**
 * Fire-and-forget: create a verification record on the server.
 * Errors are swallowed — this is observability infrastructure, not
 * a mutation gate. The mutation itself never fails because of this.
 */
function postVerification(opts: {
  actionId: string;
  domain: MutationDomain;
  summary: string;
  surfaceScope?: string;
}): void {
  apiFetch('/api/v1/cod/verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionId: opts.actionId,
      summary: opts.summary,
      surfaceScope: opts.surfaceScope,
    }),
  }).catch(() => {
    // Non-fatal — verification record is best-effort
  });
}

/** Push or update an outcome in the shared verification query cache. */
function upsertOutcome(
  queryClient: ReturnType<typeof useQueryClient>,
  outcome: VerificationOutcome
): void {
  if (typeof queryClient.setQueryData !== 'function') return;
  queryClient.setQueryData<VerificationOutcome[]>(
    VERIFICATION_OUTCOMES_KEY,
    (prev = []) => {
      const withoutExisting = prev.filter((o) => o.id !== outcome.id);
      return [outcome, ...withoutExisting].slice(0, MAX_OUTCOMES);
    }
  );
}

export function useMutationWithVerification<
  TData = unknown,
  TVariables = void,
>({
  mutationFn,
  domain,
  actionId,
  projectId,
  verificationSummary,
}: UseMutationWithVerificationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const setVerificationPhase = useUIStore((s) => s.setVerificationPhase);

  // Keep refs to latest values so mutation callbacks never read stale closures
  const actionIdRef = useRef(actionId);
  actionIdRef.current = actionId;
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;
  const summaryRef = useRef(verificationSummary);
  summaryRef.current = verificationSummary;

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onMutate: async () => {
      const id = `vrf-${actionIdRef.current}-${Date.now()}`;
      setVerificationPhase('pending', id);
      // Seed a pending outcome immediately so the rail shows activity
      upsertOutcome(queryClient, {
        id,
        actionId: actionIdRef.current,
        startedAt: new Date().toISOString(),
        status: 'pending',
        summary: summaryRef.current ?? `Verifying ${actionIdRef.current}…`,
      });
      // Best-effort: persist verification record to the API
      postVerification({
        actionId: actionIdRef.current,
        domain,
        summary:
          summaryRef.current ?? `Mutation started for ${actionIdRef.current}`,
        surfaceScope: projectIdRef.current ? 'project' : undefined,
      });
    },
    onSuccess: () => {
      const id = `vrf-${actionIdRef.current}-settled`;
      setVerificationPhase('resolved', id);
      upsertOutcome(queryClient, {
        id,
        actionId: actionIdRef.current,
        startedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        status: 'success',
        improved: true,
        summary: summaryRef.current
          ? `${summaryRef.current} — completed`
          : `${actionIdRef.current} completed`,
      });
      invalidateQueriesForDomain(queryClient, domain, {
        projectId: projectIdRef.current,
      });
    },
    onError: () => {
      const id = `vrf-${actionIdRef.current}-failed`;
      setVerificationPhase('failed', id);
      upsertOutcome(queryClient, {
        id,
        actionId: actionIdRef.current,
        startedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        status: 'failed',
        followUpNeeded: true,
        summary: summaryRef.current
          ? `${summaryRef.current} — failed`
          : `${actionIdRef.current} failed`,
      });
    },
  });
}
