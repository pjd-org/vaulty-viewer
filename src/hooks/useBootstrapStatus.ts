import { useQuery } from '@tanstack/react-query';
import { getBootstrapStatus, type BootstrapStatus } from '../lib/bootstrap';

export interface UseBootstrapStatusResult {
  status: BootstrapStatus | null;
  isActive: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

export function useBootstrapStatus(): UseBootstrapStatusResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bootstrap', 'status'],
    queryFn: getBootstrapStatus,
    staleTime: 5000, // 5 seconds
    retry: 1,
  });

  return {
    status: data ?? null,
    isActive: Boolean(data?.locked),
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export default useBootstrapStatus;
