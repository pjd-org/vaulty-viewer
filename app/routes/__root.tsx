import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { ModalProvider } from 'react-easy-modals';
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  lazyRouteComponent,
  useRouter,
  useRouterState,
} from '@tanstack/react-router';
import {
  QueryClient,
  QueryClientProvider,
  dehydrate,
  type DehydratedState,
} from '@tanstack/react-query';
import {
  TopCommandBar,
  PageFrame,
} from '../components/layout';
import { RouteLoadingState } from '../components/ui';
import { Toaster } from '../components/ui/sonner';
import {
  getBrowserDehydratedStateForRender,
  serializeDehydratedQueryState,
} from '../../src/query-client';
import { useBootstrapGate } from '../../src/hooks/useBootstrapGate';
import { normalizeReturnTo } from '../../src/lib/auth-transition';
import {
  NAV_OVERLAY_EVENT,
  type NavOverlay,
  type NavOverlayDetail,
} from '../../src/lib/nav-overlays';
import { isShellHiddenPath } from '../../src/lib/routes/v3-routing';
import { useUIStore, THEME_STORAGE_KEY } from '../../src/store/ui';
import appCss from '../../src/styles.css?url';

const SHELL_V3 = import.meta.env.VITE_SHELL_V3 === 'true';
const RUNTIME_API_URL =
  typeof process !== 'undefined' ? process.env.VAULT_API_URL?.trim() ?? '' : '';
const RUNTIME_TENSURA_URL =
  typeof process !== 'undefined'
    ? process.env.TENSURA_BASE_URL?.trim() ?? ''
    : '';

type PreloadableComponent = React.ComponentType & {
  preload?: () => Promise<void>;
};

const loadVerificationRailHost = () =>
  import('../components/layout/VerificationRailHost');

const loadViewerSidebar = () =>
  import('../components/layout/ViewerSidebar').then((module) => ({
    default: module.ViewerSidebar,
  }));

const loadCommandHost = () => import('../components/shell/CommandHost');

const LazyVerificationRailHost = lazyRouteComponent(
  loadVerificationRailHost,
  'VerificationRailHost'
) as PreloadableComponent;

const LazyViewerSidebar = React.lazy(loadViewerSidebar);

const LazyCommandHost = SHELL_V3
  ? (lazyRouteComponent(
      loadCommandHost,
      'CommandHost'
    ) as PreloadableComponent)
  : null;

const AvatarOverlay = React.lazy(() =>
  import('../components/overlays/AvatarOverlay').then((module) => ({
    default: module.AvatarOverlay,
  }))
);

const CODStatusOverlay = React.lazy(() =>
  import('../components/overlays/CODStatusOverlay').then((module) => ({
    default: module.CODStatusOverlay,
  }))
);

// Module-level constant: runs before first paint to prevent dark-mode flash.
// Built from THEME_STORAGE_KEY so the localStorage key can't silently diverge.
// try/catch guards against SecurityError (sandboxed iframes, iOS private browsing).
// window.matchMedia guard covers old WebViews / jsdom configs where it may be undefined.
// Must be a plain string — no JSX expressions, no template literals with backticks
// inside the script body (breaks minifiers). Single quotes only.
const THEME_SCRIPT = [
  '(function(){try{',
  `var t=localStorage.getItem('${THEME_STORAGE_KEY}');`,
  "if(t==='dark')",
  "document.documentElement.classList.add('dark');",
  '}catch(e){}})();',
].join('');

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: 'Vaulty Viewer' },
      ],
      links: [{ rel: 'stylesheet', href: appCss }],
    }),
    component: RootComponent,
    errorComponent: RootError,
    notFoundComponent: RootNotFound,
  }
);

function RootComponent() {
  const router = useRouter();
  const queryClient = router.options.context.queryClient;
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const search = useRouterState({
    select: (state) => state.location.search,
  });
  const [navOverlay, setNavOverlay] = React.useState<NavOverlay | null>(null);
  const hideShell = isShellHiddenPath(pathname);
  const routeHasOwnOverlay =
    pathname === '/avatar' || pathname === '/cod-status';
  const searchParams = React.useMemo(() => new URLSearchParams(search), [search]);
  const authTransitionRequested = searchParams.get('auth') === 'required';
  const loginReturnTo = normalizeReturnTo(
    searchParams.get('return_to') ?? pathname
  );

  const theme = useUIStore((s) => s.theme);
  const bootstrapGate = useBootstrapGate(pathname);

  React.useEffect(() => {
    if (bootstrapGate.redirectTo) {
      void router.navigate({ to: bootstrapGate.redirectTo, replace: true });
      return;
    }

    if (authTransitionRequested) {
      void router.navigate({
        to: `/login?return_to=${encodeURIComponent(loginReturnTo)}`,
        replace: true,
      });
    }
  }, [authTransitionRequested, bootstrapGate.redirectTo, loginReturnTo, router]);

  React.useEffect(() => {
    const root = document.documentElement;
    const applyDark = (dark: boolean) => {
      if (dark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };
    if (theme === 'dark') {
      applyDark(true);
      return () => applyDark(false);
    }
    if (theme === 'light') {
      applyDark(false);
      // No cleanup: this branch never adds .dark, so there is nothing to undo.
      return;
    }
    // system — mirror OS preference.
    // Guard: window.matchMedia may be undefined in old WebViews.
    // An uncaught throw here would not be caught by React error boundaries
    // (useEffect errors propagate to window.onerror).
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => applyDark(e.matches);
    mq.addEventListener('change', handler);
    // Only remove the listener on cleanup — do NOT touch .dark here.
    // Removing .dark in cleanup causes a flicker when transitioning system→dark
    // because cleanup runs before the new effect adds .dark back.
    return () => {
      mq.removeEventListener('change', handler);
    };
  }, [theme]);

  const closeNavOverlay = React.useCallback(() => {
    setNavOverlay(null);
  }, []);

  React.useEffect(() => {
    setNavOverlay(null);
  }, [pathname]);

  React.useEffect(() => {
    if (hideShell) return;

    const onOverlayEvent = (event: Event) => {
      const detail = (event as CustomEvent<NavOverlayDetail>).detail;
      setNavOverlay(detail?.type ?? null);
    };

    window.addEventListener(NAV_OVERLAY_EVENT, onOverlayEvent as EventListener);
    return () =>
      window.removeEventListener(
        NAV_OVERLAY_EVENT,
        onOverlayEvent as EventListener
      );
  }, [hideShell]);

  const dehydratedState =
    typeof window === 'undefined'
      ? dehydrate(queryClient)
      : getBrowserDehydratedStateForRender();

  return (
    <MotionConfig reducedMotion="user">
      <RootDocument dehydratedState={dehydratedState}>
        <QueryClientProvider client={queryClient}>
          <ModalProvider>
            {bootstrapGate.loading || bootstrapGate.redirectTo || authTransitionRequested ? (
              <BootstrapTransitionScreen
                pathname={pathname}
                error={bootstrapGate.error}
                authTransitionRequested={authTransitionRequested}
              />
            ) : (
              <div className="min-h-screen">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-[var(--surf-elevated)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--text-primary)] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--vault-accent)]"
              >
                Skip to content
              </a>
              {hideShell ? (
                <Outlet />
              ) : (
                <React.Suspense
                  fallback={
                    <ViewerSidebarFallback>
                      <div id="main-content" className="min-h-screen pb-10">
                        <TopCommandBar />
                        <Outlet />
                      </div>
                    </ViewerSidebarFallback>
                  }
                >
                  <LazyViewerSidebar>
                    <div id="main-content" className="min-h-screen pb-10">
                      <TopCommandBar />
                      <Outlet />
                    </div>
                  </LazyViewerSidebar>
                </React.Suspense>
              )}
              {!hideShell && (
                <React.Suspense fallback={null}>
                  <LazyVerificationRailHost />
                </React.Suspense>
              )}
              {!routeHasOwnOverlay && navOverlay === 'avatar' && (
                <React.Suspense fallback={null}>
                  <AvatarOverlay onRequestClose={closeNavOverlay} />
                </React.Suspense>
              )}
              {!routeHasOwnOverlay && navOverlay === 'cod' && (
                <React.Suspense fallback={null}>
                  <CODStatusOverlay onRequestClose={closeNavOverlay} />
                </React.Suspense>
              )}
              {LazyCommandHost && (
                <React.Suspense fallback={null}>
                  <LazyCommandHost />
                </React.Suspense>
              )}
              </div>
            )}
          </ModalProvider>
        </QueryClientProvider>
        <Toaster />
      </RootDocument>
    </MotionConfig>
  );
}

function BootstrapTransitionScreen({
  pathname,
  error,
  authTransitionRequested,
}: {
  pathname: string;
  error: string | null;
  authTransitionRequested: boolean;
}) {
  const isBootstrapPath =
    pathname === '/bootstrap' ||
    pathname.startsWith('/onboarding/') ||
    pathname.startsWith('/preflight') ||
    pathname.startsWith('/genesis');
  const title = authTransitionRequested
    ? 'Preparing sign-in'
    : isBootstrapPath
      ? 'Loading bootstrap state'
      : 'Preparing access';
  const subtitle = error
    ? 'Loading the safest route while the bootstrap state resolves.'
    : authTransitionRequested
      ? 'Loading the handoff before sign-in.'
      : isBootstrapPath
      ? 'Checking setup before this surface opens.'
      : 'Checking setup and auth before this surface opens.';

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <PageFrame
          title={title}
          subtitle={subtitle}
          statusLine="Transition"
          nextAction="This will redirect automatically."
        >
          <div className="rounded-[28px] border border-border bg-[var(--surf-elevated)] p-6 shadow-sm">
            <RouteLoadingState
              label={
                authTransitionRequested
                  ? 'Preparing sign-in…'
                  : isBootstrapPath
                    ? 'Checking bootstrap…'
                    : 'Checking access…'
              }
              rows={5}
            />
          </div>
        </PageFrame>
      </div>
    </main>
  );
}


function RootDocument({
  children,
  dehydratedState,
}: {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}) {
  const hydrationScript = dehydratedState
    ? `window.__VIEWER_DEHYDRATED_STATE__=${serializeDehydratedQueryState(dehydratedState)};`
    : '';
  const viewerConfig = {
    ...(RUNTIME_API_URL ? { apiUrl: RUNTIME_API_URL } : {}),
    ...(RUNTIME_TENSURA_URL ? { tensuraUrl: RUNTIME_TENSURA_URL } : {}),
  };
  const viewerConfigScript =
    Object.keys(viewerConfig).length > 0
      ? `window.VIEWER_CONFIG=${JSON.stringify(viewerConfig).replace(
          /</g,
          '\\u003c'
        )};`
      : '';

  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <head>
        <HeadContent />
        <meta name="theme-color" content="var(--background)" />
        {viewerConfigScript ? (
          <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: viewerConfigScript }}
          />
        ) : null}
        {/* Theme script must be in <head> to block paint before body renders */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
      </head>
      <body>
        {children}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: hydrationScript }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootError({ error }: { error: Error }) {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Viewer Error</h1>
        <p className="lede">Something went wrong while rendering this route.</p>
      </header>
      <section className="card">
        <p>{error.message}</p>
      </section>
    </main>
  );
}

function RootNotFound() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Not Found</h1>
        <p className="lede">This route does not exist.</p>
      </header>
    </main>
  );
}

type RootComponentWithPreload = typeof RootComponent & {
  preload?: () => Promise<void>;
};

(RootComponent as RootComponentWithPreload).preload = async () => {
  const preloaders: Promise<unknown>[] = [];

  if (LazyVerificationRailHost.preload) {
    preloaders.push(LazyVerificationRailHost.preload());
  }
  preloaders.push(loadViewerSidebar());
  if (LazyCommandHost?.preload) {
    preloaders.push(LazyCommandHost.preload());
  }

  await Promise.all(preloaders);
};

function ViewerSidebarFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside
        aria-hidden="true"
        className="hidden w-[280px] shrink-0 border-r border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] md:block"
      />
      <div className="min-h-screen flex-1">{children}</div>
    </div>
  );
}
