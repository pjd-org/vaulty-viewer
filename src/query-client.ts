import {
  QueryClient,
  QueryCache,
  type DehydratedState,
} from '@tanstack/react-query';
import { buildAuthTransitionPath } from './lib/auth-transition';
import { UnauthenticatedError } from './utils/api';

declare global {
  interface Window {
    __VIEWER_DEHYDRATED_STATE__?: DehydratedState;
  }
}

/**
 * Global 401 redirect: any query that throws UnauthenticatedError will
 * hard-navigate to /login. Individual routes may also handle UnauthenticatedError
 * inline (e.g. to short-circuit rendering), but this covers every route
 * automatically so no route can silently swallow a 401.
 */
function makeQueryCache() {
  return new QueryCache({
    onError(error) {
      if (
        error instanceof UnauthenticatedError &&
        typeof window !== 'undefined'
      ) {
        window.location.replace(
          buildAuthTransitionPath(
            `${window.location.pathname}${window.location.search}`
          )
        );
      }
    },
  });
}

function getDefaultOptions() {
  return {
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Never retry a 401 — the user must re-authenticate.
        retry: (failureCount: number, error: unknown) => {
          if (error instanceof UnauthenticatedError) return false;
          return failureCount < 2;
        },
      },
    },
  };
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: makeQueryCache(),
    ...getDefaultOptions(),
  });
}

let browserQueryClient: QueryClient | null = null;
let browserDehydratedStateForRender: DehydratedState | undefined;

export function getBrowserQueryClient() {
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}

export function setBrowserDehydratedStateForRender(
  state: DehydratedState | undefined
) {
  browserDehydratedStateForRender = state;
}

export function getBrowserDehydratedStateForRender() {
  return browserDehydratedStateForRender;
}

export function serializeDehydratedQueryState(state: DehydratedState) {
  return JSON.stringify(state).replace(/</g, '\\u003c');
}

export function readDehydratedQueryState() {
  if (typeof window === 'undefined') return undefined;
  const state = window.__VIEWER_DEHYDRATED_STATE__;
  delete window.__VIEWER_DEHYDRATED_STATE__;
  return state;
}

export const queryClient =
  typeof window === 'undefined' ? createQueryClient() : getBrowserQueryClient();
