import { useRouterState } from '@tanstack/react-router';

import { useBootstrapStatus } from './useBootstrapStatus';

const BYPASS_ROUTES = [
  '/login',
  '/onboarding/welcome',
  '/onboarding/profile',
  '/onboarding/review',
  '/genesis',
];

function isBypassPath(pathname: string): boolean {
  return BYPASS_ROUTES.some((route) => pathname.startsWith(route));
}

export interface BootstrapGateResult {
  shouldBlock: boolean;
  redirectTo: string | null;
}

export function useBootstrapGate(): BootstrapGateResult {
  const { status, isActive, loading, error } = useBootstrapStatus();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  // If still loading, don't block — gives API time to respond
  if (loading) {
    return { shouldBlock: false, redirectTo: null };
  }

  // Allow bypass routes even if API fails
  if (isBypassPath(pathname)) {
    return { shouldBlock: false, redirectTo: null };
  }

  // If API errored and we have no status, default to onboarding (user can retry)
  if (error && !status) {
    return { shouldBlock: true, redirectTo: '/onboarding/welcome' };
  }

  // Active — full access
  if (isActive) {
    return { shouldBlock: false, redirectTo: null };
  }

  // Use nextAction route from API, fallback to onboarding
  if (status?.bootstrap?.nextAction?.route) {
    return { shouldBlock: true, redirectTo: status.bootstrap.nextAction.route };
  }

  return { shouldBlock: true, redirectTo: '/onboarding/welcome' };
}
