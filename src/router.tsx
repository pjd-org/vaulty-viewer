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

export const router = createRouter({
  queryClient:
    typeof window === 'undefined'
      ? createQueryClient()
      : getBrowserQueryClient(),
});

export function getRouter() {
  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
