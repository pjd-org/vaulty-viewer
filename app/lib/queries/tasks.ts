import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllTasks, fetchNextActions, updateTaskStatus } from '../api/tasks';

export function useAllTasks() {
  return useQuery({ queryKey: ['tasks'], queryFn: fetchAllTasks, staleTime: 1000 * 60, retry: 1 });
}

export function useNextActions() {
  return useQuery({ queryKey: ['nextActions'], queryFn: fetchNextActions, staleTime: 1000 * 60, retry: 1 });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ path, status }: { path: string; status: string }) => updateTaskStatus(path, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
