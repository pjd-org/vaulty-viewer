import React from 'react';

import { getBootstrapStatus, type BootstrapStatus } from '../lib/bootstrap';

const BYPASS_ROUTES = ['/login', '/onboarding/welcome', '/onboarding/profile', '/onboarding/review'];

function isBypassPath(pathname: string): boolean {
  return BYPASS_ROUTES.some((route) => pathname.startsWith(route));
}

export interface BootstrapGateResult {
  shouldBlock: boolean;
  redirectTo: string | null;
}

export function useBootstrapGate(pathname: string): BootstrapGateResult {
  const [status, setStatus] = React.useState<BootstrapStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBootstrapStatus()
      .then((nextStatus) => {
        if (cancelled) return;
        setStatus(nextStatus);
        setError(null);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setStatus(null);
        setError(nextError instanceof Error ? nextError.message : 'Failed to load bootstrap status');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // If still loading, don't block — gives API time to respond
  if (loading) {
    return { shouldBlock: false, redirectTo: null };
  }

  if (status?.locked && pathname === '/bootstrap') {
    return { shouldBlock: true, redirectTo: '/' };
  }

  if (status?.required && pathname !== '/bootstrap') {
    return { shouldBlock: true, redirectTo: '/bootstrap' };
  }

  // Allow bypass routes even if API fails.
  if (isBypassPath(pathname)) {
    return { shouldBlock: false, redirectTo: null };
  }

  // If API errored and we have no status, default to bootstrap.
  if (error && !status) {
    return {
      shouldBlock: pathname !== '/bootstrap',
      redirectTo: pathname !== '/bootstrap' ? '/bootstrap' : null,
    };
  }

  // Active — full access.
  if (status?.locked) {
    return { shouldBlock: false, redirectTo: null };
  }

  return { shouldBlock: false, redirectTo: null };
}
