import type { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { createQueryClient, getBrowserQueryClient } from './query-client';

export function createRouter(options?: { queryClient?: QueryClient }) {
  const queryClient =
    options?.queryClient ??
    (typeof window === 'undefined'
      ? createQueryClient()
      : getBrowserQueryClient());

  return createTanStackRouter({
    routeTree,
    context: {
      queryClient,
    },
  });
}

let _router: ReturnType<typeof createRouter> | undefined;

/**
 * Client-only singleton accessor required by @tanstack/start-client-core hydration.
 * Server-side callers must use createRouter() directly to get a per-request instance.
 */
export function getRouter() {
  if (typeof window === 'undefined') {
    throw new Error(
      'getRouter() is client-only. Use createRouter() per request on the server.'
    );
  }
  if (!_router) {
    _router = createRouter();
  }
  return _router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
