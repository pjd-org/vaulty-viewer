import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../src/store/ui';
import {
  invalidateQueriesForDomain,
  type MutationDomain,
} from '../lib/viewer-adapter';
import { apiFetch } from '../../src/utils/api';

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
      setVerificationPhase('pending', actionIdRef.current);
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
      setVerificationPhase('resolved', actionIdRef.current);
      invalidateQueriesForDomain(queryClient, domain, {
        projectId: projectIdRef.current,
      });
    },
    onError: () => {
      setVerificationPhase('failed', actionIdRef.current);
    },
  });
}
