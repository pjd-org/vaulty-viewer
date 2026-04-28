import { apiFetch } from '../utils/api';

export type BootstrapStatus = {
  state:
    | 'root_user_required'
    | 'new'
    | 'draft'
    | 'review'
    | 'preflight_failed'
    | 'preflight_passed'
    | 'genesis_queued'
    | 'genesis_running'
    | 'genesis_failed'
    | 'reset_required'
    | 'active';
  phase: 'bootstrap' | 'onboarding' | 'active';
  nextRoute: string;
  lock: {
    active: boolean;
    reason: string | null;
    scope: 'all' | null;
  };
  compat?: {
    required: boolean;
    locked: boolean;
    reason: 'missing-root-user' | 'root-user-exists';
  };
  required: boolean;
  locked: boolean;
  reason: 'missing-root-user' | 'root-user-exists';
  rootUser: {
    exists: boolean;
  };
  draft: {
    displayName?: string;
    workspaceName?: string;
    role?: string;
    workspaceIntent?: string;
    focusAreas?: string[];
    modules?: Record<string, boolean>;
    draftVersion: number;
    etag: string;
    updatedAt: string;
  } | null;
  genesisJob: GenesisJob | null;
  reset?: {
    reason: string;
    requestedAt: string;
    requestedBy: string;
    status: 'pending' | 'completed';
    completedAt?: string;
  } | null;
};

export type BootstrapRootUserInput = {
  email: string;
  password: string;
  displayName?: string;
};

export type BootstrapRootUserResponse = {
  state: 'new';
  nextRoute: '/onboarding/welcome';
  rootUserId: string;
  authSessionEstablished: false;
};

export type BootstrapDraft = {
  displayName?: string;
  workspaceName?: string;
  role?: 'owner' | string;
  workspaceIntent?: string;
  focusAreas?: string[];
  modules?: Record<string, boolean>;
};

export type BootstrapDraftResponse = {
  draft: BootstrapStatus['draft'];
  status: BootstrapStatus;
};

export type BootstrapReviewReport = {
  summary: string;
  planHash: string;
  readyForGenesis: boolean;
  checks: Array<{
    name: string;
    ok: boolean;
    detail: string;
  }>;
};

export type BootstrapPreflightRecord = {
  reportId: string;
  planHash: string;
  idempotencyKey: string;
  draftEtag: string;
  checkedAt: string;
  report: BootstrapReviewReport;
};

export type BootstrapReviewResponse = BootstrapStatus & {
  draft: NonNullable<BootstrapStatus['draft']>;
  review: BootstrapReviewReport;
  preflight: BootstrapPreflightRecord | null;
  reset?: BootstrapStatus['reset'];
};

export type GenesisJob = {
  jobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  phase:
    | 'genesis_queued'
    | 'claiming_request'
    | 'revalidating_plan'
    | 'running_genesis_init'
    | 'verifying_event_law'
    | 'finalised'
    | 'failed';
  percent: number;
  message: string;
  result: null | {
    bootstrapState: 'active';
    redirectTo: '/';
  };
  error: null | {
    code: string;
    detail: string;
    instance: string;
    retryable?: boolean;
    status: number;
    title: string;
    type: string;
    [key: string]: unknown;
  };
  reportId: string;
  planHash: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type BootstrapGenesisRequest = {
  reportId: string;
  planHash: string;
};

export type BootstrapGenesisResponse = {
  jobId: string;
  state: 'genesis_queued';
  pollUrl: string;
};

export async function getBootstrapStatus(): Promise<BootstrapStatus> {
  const response = await apiFetch('/api/v1/bootstrap/status', { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to load bootstrap status');
  }
  return (await response.json()) as BootstrapStatus;
}

export async function createBootstrapRootUser(
  input: BootstrapRootUserInput,
  idempotencyKey: string,
): Promise<BootstrapRootUserResponse> {
  const response = await apiFetch('/api/v1/bootstrap/root-user', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      (body && typeof body === 'object' && 'detail' in body && String(body.detail)) ||
        'Bootstrap failed.'
    );
  }

  return (await response.json()) as BootstrapRootUserResponse;
}

export async function createGenesisRoot(
  input: BootstrapRootUserInput,
  idempotencyKey = cryptoRandomId(),
): Promise<BootstrapRootUserResponse> {
  return createBootstrapRootUser(input, idempotencyKey);
}

export async function putBootstrapDraft(
  draft: BootstrapDraft,
  etag?: string | null,
): Promise<BootstrapDraftResponse> {
  const response = await apiFetch('/api/v1/bootstrap/draft', {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...(etag ? { 'if-match': etag } : {}),
    },
    body: JSON.stringify(draft),
  });
  if (!response.ok) {
    throw new Error('Failed to save bootstrap draft');
  }
  return (await response.json()) as BootstrapDraftResponse;
}

export async function patchBootstrapDraft(
  draft: Partial<BootstrapDraft>,
  etag: string,
): Promise<BootstrapDraftResponse> {
  const response = await apiFetch('/api/v1/bootstrap/draft', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'if-match': etag,
    },
    body: JSON.stringify(draft),
  });
  if (!response.ok) {
    throw new Error('Failed to update bootstrap draft');
  }
  return (await response.json()) as BootstrapDraftResponse;
}

export async function getBootstrapReview(): Promise<BootstrapReviewResponse> {
  const response = await apiFetch('/api/v1/bootstrap/review', { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to load bootstrap review');
  }
  return (await response.json()) as BootstrapReviewResponse;
}

export async function runBootstrapPreflight(
  etag: string,
  idempotencyKey: string,
): Promise<BootstrapReviewResponse> {
  const response = await apiFetch('/api/v1/bootstrap/preflight', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'if-match': etag,
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      (body && typeof body === 'object' && 'detail' in body && String(body.detail)) ||
        'Failed to run bootstrap preflight.'
    );
  }
  return (await response.json()) as BootstrapReviewResponse;
}

export async function startBootstrapGenesis(
  input: BootstrapGenesisRequest,
  idempotencyKey: string,
): Promise<BootstrapGenesisResponse> {
  const response = await apiFetch('/api/v1/bootstrap/genesis', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      (body && typeof body === 'object' && 'detail' in body && String(body.detail)) ||
        'Failed to start genesis.'
    );
  }
  return (await response.json()) as BootstrapGenesisResponse;
}

export async function getBootstrapGenesisJob(jobId: string): Promise<GenesisJob> {
  const response = await apiFetch(`/api/v1/bootstrap/jobs/${jobId}`, { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to load genesis job');
  }
  return (await response.json()) as GenesisJob;
}

export async function resolveBootstrapRedirect(pathname: string) {
  const status = await getBootstrapStatus();
  if (status.nextRoute && pathname !== status.nextRoute) {
    return {
      status,
      redirectTo: status.nextRoute,
    };
  }

  if (status.required && pathname !== '/bootstrap') {
    return { status, redirectTo: '/bootstrap' };
  }
  if (status.locked && pathname === '/bootstrap') {
    return { status, redirectTo: '/' };
  }
  return {
    status,
    redirectTo: null as string | null,
  };
}

function cryptoRandomId(): string {
  return `idem_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
