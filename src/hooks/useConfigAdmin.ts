import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch, ForbiddenError, UnauthenticatedError } from '../utils/api';

export type ConfigDiffEntry = {
  key: string;
  oldValue?: unknown;
  newValue?: unknown;
  secret?: boolean;
  impact?: { artifacts?: string[]; rebuild?: boolean; restart?: string[] };
};

export type ConfigSnapshot = {
  appEnvFilesEnabled?: boolean;
  config?: Record<string, unknown>;
  fields?: Array<{
    editable?: boolean;
    secret?: boolean;
    key?: string;
    source?: string;
    value?: unknown;
  }>;
  targets?: Array<{ id?: string; kind?: string; path?: string }>;
};

export type ConfigStatus = {
  status: 'ok' | 'degraded';
  serviceUrl: string;
  adminTokenConfigured: boolean;
  snapshot: ConfigSnapshot;
  summary: {
    appEnvFilesEnabled: boolean;
    editableFields: number;
    secretFields: number;
    targetCount: number;
  };
};

export type ConfigPreview = {
  diff: ConfigDiffEntry[];
  valid: boolean;
  validationErrors: string[];
};

export type ConfigApply = ConfigPreview & {
  regeneration?: { path?: string; status?: string; reason?: string };
  target?: string;
  touchedFiles?: string[];
};

export type ConfigMutationRequest = {
  target: string;
  changes: Record<string, string | number | boolean | null>;
};

type ConfigAdminState = {
  status: ConfigStatus | null;
  snapshot: ConfigSnapshot | null;
  preview: ConfigPreview | null;
  applyResult: ConfigApply | null;
  loading: boolean;
  error: string | null;
  previewMutation: (request: ConfigMutationRequest) => Promise<ConfigPreview>;
  applyMutation: (request: ConfigMutationRequest) => Promise<ConfigApply>;
  regenerate: () => Promise<ConfigApply>;
  refresh: () => Promise<unknown>;
};

export function useConfigAdmin(): ConfigAdminState {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useIdempotencyKey();

  const statusQuery = useQuery({
    queryKey: ['config', 'status'],
    queryFn: fetchConfigStatus,
    staleTime: 5_000,
    retry: 1,
  });

  const previewMutation = useMutation({
    mutationFn: async (request: ConfigMutationRequest) => {
      const res = await apiFetch('/api/v1/config/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      return await parseJsonOrThrow<ConfigPreview>(res, 'preview');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (request: ConfigMutationRequest) => {
      const res = await apiFetch('/api/v1/config/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKeyRef(),
        },
        body: JSON.stringify(request),
      });
      return await parseJsonOrThrow<ConfigApply>(res, 'apply');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/config/regenerate', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKeyRef() },
      });
      return await parseJsonOrThrow<ConfigApply>(res, 'regenerate');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['config'] });
    await statusQuery.refetch();
  }, [queryClient, statusQuery]);

  return {
    status: statusQuery.data ?? null,
    snapshot: statusQuery.data?.snapshot ?? null,
    preview: previewMutation.data ?? null,
    applyResult: applyMutation.data ?? null,
    loading: statusQuery.isLoading,
    error:
      statusQuery.error instanceof Error
        ? statusQuery.error.message
        : previewMutation.error instanceof Error
          ? previewMutation.error.message
          : applyMutation.error instanceof Error
            ? applyMutation.error.message
            : regenerateMutation.error instanceof Error
              ? regenerateMutation.error.message
              : null,
    previewMutation: async (request) => previewMutation.mutateAsync(request),
    applyMutation: async (request) => applyMutation.mutateAsync(request),
    regenerate: async () => regenerateMutation.mutateAsync(),
    refresh,
  };
}

function useIdempotencyKey(): () => string {
  return useCallback(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `cfg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);
}

async function fetchConfigStatus(): Promise<ConfigStatus> {
  const res = await apiFetch('/api/v1/config/status');
  return await parseJsonOrThrow<ConfigStatus>(res, 'status');
}

async function parseJsonOrThrow<T>(res: Response, context: string): Promise<T> {
  if (res.status === 401) throw new UnauthenticatedError(`Config ${context}: 401`);
  if (res.status === 403) throw new ForbiddenError(`Config ${context}: 403`);
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const problem = body as { detail?: string; message?: string };
    throw new Error(problem.detail || problem.message || `HTTP ${res.status}`);
  }
  return body as T;
}
