import React from 'react';

import { getBootstrapStatus, type BootstrapStatus } from '../lib/bootstrap';

const BYPASS_ROUTES = ['/onboarding/welcome', '/onboarding/profile', '/onboarding/review'];

function isBypassPath(pathname: string): boolean {
  return BYPASS_ROUTES.some((route) => pathname.startsWith(route));
}

function isBootstrapSurfacePath(pathname: string): boolean {
  return (
    pathname === '/bootstrap' ||
    pathname.startsWith('/onboarding/') ||
    pathname.startsWith('/preflight') ||
    pathname.startsWith('/genesis')
  );
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

  if (status?.nextRoute && isBootstrapSurfacePath(pathname) && pathname !== status.nextRoute) {
    return { shouldBlock: true, redirectTo: status.nextRoute };
  }

  if (status?.required && isBootstrapSurfacePath(pathname) && pathname !== '/bootstrap') {
    return { shouldBlock: true, redirectTo: '/bootstrap' };
  }

  // Allow bypass routes even if API fails.
  if (isBypassPath(pathname)) {
    return { shouldBlock: false, redirectTo: null };
  }

  // If API errored and we have no status, default to bootstrap.
  if (error && !status) {
    if (!isBootstrapSurfacePath(pathname)) {
      return { shouldBlock: false, redirectTo: null };
    }
    return {
      shouldBlock: pathname !== '/bootstrap',
      redirectTo: pathname !== '/bootstrap' ? '/bootstrap' : null,
    };
  }

  return { shouldBlock: false, redirectTo: null };
}
