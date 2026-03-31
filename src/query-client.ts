import { QueryClient, type DehydratedState } from '@tanstack/react-query'

declare global {
  interface Window {
    __VIEWER_DEHYDRATED_STATE__?: DehydratedState
  }
}

function getDefaultOptions() {
  return {
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
  }
}

export function createQueryClient() {
  return new QueryClient(getDefaultOptions())
}

let browserQueryClient: QueryClient | null = null

export function getBrowserQueryClient() {
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient()
  }
  return browserQueryClient
}

export function serializeDehydratedQueryState(state: DehydratedState) {
  return JSON.stringify(state).replace(/</g, '\\u003c')
}

export function readDehydratedQueryState() {
  if (typeof window === 'undefined') return undefined
  const state = window.__VIEWER_DEHYDRATED_STATE__
  delete window.__VIEWER_DEHYDRATED_STATE__
  return state
}

export const queryClient =
  typeof window === 'undefined' ? createQueryClient() : getBrowserQueryClient()
