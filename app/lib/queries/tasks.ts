import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllTasks, fetchNextActions, updateTaskStatus } from '../api/tasks';

export function useAllTasks() {
  return useQuery(['tasks'], fetchAllTasks, { staleTime: 1000 * 60, retry: 1 });
}

export function useNextActions() {
  return useQuery(['nextActions'], fetchNextActions, { staleTime: 1000 * 60, retry: 1 });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation(({ path, status }: { path: string; status: string }) => updateTaskStatus(path, status), {
    onSuccess: () => qc.invalidateQueries(['tasks']),
  });
}
