import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllTasks,
  fetchNextActions,
  updateTaskStatus,
} from '../api/tasks';
import {
  getActionsSurfaceQueryOptions,
  getHomeSurfaceQueryOptions,
  getProjectSurfaceQueryOptions,
} from '../viewer-adapter';
import { useUIStore } from '../../../src/store/ui';

export function getAllTasksQueryOptions() {
  return {
    queryKey: ['tasks'] as const,
    queryFn: fetchAllTasks,
    staleTime: 1000 * 60,
    retry: 1,
  };
}

export function useAllTasks() {
  return useQuery(getAllTasksQueryOptions());
}

export function useNextActions() {
  return useQuery({
    queryKey: ['nextActions'],
    queryFn: fetchNextActions,
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  const setVerificationPhase = useUIStore.getState().setVerificationPhase;
  return useMutation({
    mutationFn: ({ path, status }: { path: string; status: string }) =>
      updateTaskStatus(path, status),
    onMutate: async (variables) => {
      setVerificationPhase('pending', variables.path);
    },
    onSuccess: async (_result, variables) => {
      const tasks = qc.getQueryData<
        Array<{ path?: string; projectId?: string }>
      >(getAllTasksQueryOptions().queryKey);
      const projectId = tasks?.find(
        (task) => task.path === variables.path
      )?.projectId;
      setVerificationPhase('resolved', variables.path);

      await Promise.all([
        qc.invalidateQueries({ queryKey: getAllTasksQueryOptions().queryKey }),
        qc.invalidateQueries({ queryKey: ['nextActions'] }),
        qc.invalidateQueries({
          queryKey: getHomeSurfaceQueryOptions().queryKey,
        }),
        qc.invalidateQueries({
          queryKey: getActionsSurfaceQueryOptions().queryKey,
        }),
        projectId
          ? qc.invalidateQueries({
              queryKey: getProjectSurfaceQueryOptions(projectId).queryKey,
            })
          : Promise.resolve(),
      ]);
    },
    onError: (_error, variables) => {
      setVerificationPhase('failed', variables.path);
    },
  });
}
