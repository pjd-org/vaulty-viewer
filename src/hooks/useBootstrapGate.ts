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
  loading: boolean;
  shouldBlock: boolean;
  redirectTo: string | null;
  status: BootstrapStatus | null;
  error: string | null;
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
    return {
      loading: true,
      shouldBlock: false,
      redirectTo: null,
      status: null,
      error: null,
    };
  }

  if (status?.nextRoute && isBootstrapSurfacePath(pathname) && pathname !== status.nextRoute) {
    return {
      loading: false,
      shouldBlock: true,
      redirectTo: status.nextRoute,
      status,
      error,
    };
  }

  if (status?.required && isBootstrapSurfacePath(pathname) && pathname !== '/bootstrap') {
    return {
      loading: false,
      shouldBlock: true,
      redirectTo: '/bootstrap',
      status,
      error,
    };
  }

  // Allow bypass routes even if API fails.
  if (isBypassPath(pathname)) {
    return {
      loading: false,
      shouldBlock: false,
      redirectTo: null,
      status,
      error,
    };
  }

  // If API errored and we have no status, default to bootstrap.
  if (error && !status) {
    if (!isBootstrapSurfacePath(pathname)) {
      return {
        loading: false,
        shouldBlock: false,
        redirectTo: null,
        status,
        error,
      };
    }
    return {
      loading: false,
      shouldBlock: pathname !== '/bootstrap',
      redirectTo: pathname !== '/bootstrap' ? '/bootstrap' : null,
      status,
      error,
    };
  }

  return {
    loading: false,
    shouldBlock: false,
    redirectTo: null,
    status,
    error,
  };
}
