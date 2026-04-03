import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../src/store/ui';
import {
  invalidateQueriesForDomain,
  type MutationDomain,
} from '../lib/viewer-adapter';

interface UseMutationWithVerificationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  domain: MutationDomain;
  actionId: string;
  projectId?: string;
}

export function useMutationWithVerification<
  TData = unknown,
  TVariables = void,
>({
  mutationFn,
  domain,
  actionId,
  projectId,
}: UseMutationWithVerificationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const setVerificationPhase = useUIStore((s) => s.setVerificationPhase);

  // Keep refs to latest values so mutation callbacks never read stale closures
  const actionIdRef = useRef(actionId);
  actionIdRef.current = actionId;
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onMutate: async () => {
      setVerificationPhase('pending', actionIdRef.current);
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
