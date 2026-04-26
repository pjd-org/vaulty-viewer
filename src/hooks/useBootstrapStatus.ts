import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

export type BootstrapStatus = 'new' | 'draft' | 'review' | 'preflight_running' | 'preflight_failed' | 'preflight_passed' | 'genesis_queued' | 'genesis_running' | 'genesis_failed' | 'active' | 'reset_required';

export interface BootstrapViewerState {
  navMode: 'full' | 'bootstrap';
  firstRunBanner: boolean;
}

export interface BootstrapStatusResponse {
  bootstrap: {
    state: BootstrapStatus;
    activeGenesisJobId: string | null;
    preflightReportId: string | null;
    nextAction: {
      route: string;
      cta: string;
      description: string;
    };
    updatedAt: string;
  };
  viewer: BootstrapViewerState;
}

export interface UseBootstrapStatusResult {
  status: BootstrapStatusResponse | null;
  isActive: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

export function useBootstrapStatus(): UseBootstrapStatusResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bootstrap', 'status'],
    queryFn: async (): Promise<BootstrapStatusResponse> => {
      const response = await apiFetch('/bootstrap/status', { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Bootstrap status failed: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5000, // 5 seconds
    retry: 1,
  });

  return {
    status: data ?? null,
    isActive: data?.bootstrap?.state === 'active',
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export default useBootstrapStatus;