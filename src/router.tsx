import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { queryClient } from './query-client'

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    context: {
      queryClient,
    },
  })
}

export const router = createRouter()

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
