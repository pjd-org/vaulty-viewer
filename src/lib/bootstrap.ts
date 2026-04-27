import { apiFetch } from '../utils/api';

export type BootstrapStatus = {
  required: boolean;
  locked: boolean;
  reason: 'missing-root-user' | 'root-user-exists';
};

export type BootstrapGenesisInput = {
  email: string;
  password: string;
  displayName?: string;
};

export type BootstrapGenesisResponse =
  | {
      ok: true;
      user: {
        id: string;
        email: string;
        role: 'root';
        emailVerified: true;
        createdByBootstrap: true;
      };
    }
  | {
      ok: false;
      code: 'BOOTSTRAP_LOCKED' | 'BOOTSTRAP_INVALID_INPUT' | string;
      reason?: string;
      message?: string;
    };

export async function getBootstrapStatus(): Promise<BootstrapStatus> {
  const response = await apiFetch('/api/v1/bootstrap/status', { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to load bootstrap status');
  }
  return (await response.json()) as BootstrapStatus;
}

export async function createGenesisRoot(
  input: BootstrapGenesisInput,
): Promise<BootstrapGenesisResponse> {
  const response = await apiFetch('/api/v1/bootstrap/genesis', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const body = (await response.json().catch(() => null)) as
    | BootstrapGenesisResponse
    | null;

  if (response.status === 409) {
    const conflictBody = body as {
      reason?: string;
      message?: string;
    } | null;
    return {
      ok: false,
      code: 'BOOTSTRAP_LOCKED',
      reason: conflictBody?.reason ?? 'root-user-exists',
      message: conflictBody?.message ?? 'Bootstrap is already locked.',
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      code: body && typeof body === 'object' && 'code' in body ? String(body.code) : 'BOOTSTRAP_FAILED',
      reason: body && typeof body === 'object' && 'reason' in body ? String(body.reason) : undefined,
      message: body && typeof body === 'object' && 'message' in body ? String(body.message) : 'Bootstrap failed.',
    };
  }

  return body ?? { ok: false, code: 'BOOTSTRAP_FAILED', message: 'Bootstrap failed.' };
}

export async function resolveBootstrapRedirect(pathname: string) {
  const status = await getBootstrapStatus();
  if (status.required && pathname !== '/bootstrap') {
    return {
      status,
      redirectTo: '/bootstrap',
    };
  }
  if (status.locked && pathname === '/bootstrap') {
    return {
      status,
      redirectTo: '/',
    };
  }
  return {
    status,
    redirectTo: null as string | null,
  };
}
