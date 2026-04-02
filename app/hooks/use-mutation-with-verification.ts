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

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onMutate: async () => {
      setVerificationPhase('pending', actionId);
    },
    onSuccess: () => {
      setVerificationPhase('resolved', actionId);
      invalidateQueriesForDomain(queryClient, domain, { projectId });
    },
    onError: () => {
      setVerificationPhase('failed', actionId);
    },
  });
}
