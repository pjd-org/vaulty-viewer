import * as React from 'react';
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
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
  AppShell,
  SidebarRail,
  TopCommandBar,
  VerificationRailHost,
} from '../components/layout';
import { CommandHost, ModalHost } from '../components/shell';
import { Toaster } from '../components/ui/sonner';
import { serializeDehydratedQueryState } from '../../src/query-client';
import {
  NAV_OVERLAY_EVENT,
  type NavOverlay,
  type NavOverlayDetail,
} from '../../src/lib/nav-overlays';
import { isShellHiddenPath } from '../../src/lib/routes/v3-routing';
import { useUIStore, THEME_STORAGE_KEY } from '../../src/store/ui';
import { AvatarRoute } from './avatar';
import { CODStatusRoute } from './cod-status';
import appCss from '../../src/styles.css?url';

const SHELL_V3 = import.meta.env.VITE_SHELL_V3 === 'true';

// Module-level constant: runs before first paint to prevent dark-mode flash.
// Built from THEME_STORAGE_KEY so the localStorage key can't silently diverge.
// try/catch guards against SecurityError (sandboxed iframes, iOS private browsing).
// window.matchMedia guard covers old WebViews / jsdom configs where it may be undefined.
// Must be a plain string — no JSX expressions, no template literals with backticks
// inside the script body (breaks minifiers). Single quotes only.
const THEME_SCRIPT = [
  '(function(){try{',
  `var t=localStorage.getItem('${THEME_STORAGE_KEY}');`,
  "if(t==='dark'||(t!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches))",
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
  const [navOverlay, setNavOverlay] = React.useState<NavOverlay | null>(null);
  const hideShell = isShellHiddenPath(pathname);
  const routeHasOwnOverlay =
    pathname === '/avatar' || pathname === '/cod-status';

  const theme = useUIStore((s) => s.theme);

  React.useEffect(() => {
    const root = document.documentElement;
    const applyDark = (dark: boolean) =>
      dark ? root.classList.add('dark') : root.classList.remove('dark');
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
    typeof window === 'undefined' ? dehydrate(queryClient) : undefined;

  return (
    <RootDocument dehydratedState={dehydratedState}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen">
          {hideShell ? (
            <Outlet />
          ) : (
            <AppShell rail={<SidebarRail />}>
              <div className="min-h-screen pb-10">
                <TopCommandBar />
                <Outlet />
              </div>
            </AppShell>
          )}
          {!hideShell && <VerificationRailHost />}
          {!routeHasOwnOverlay && navOverlay === 'avatar' && (
            <AvatarRoute onRequestClose={closeNavOverlay} />
          )}
          {!routeHasOwnOverlay && navOverlay === 'cod' && (
            <CODStatusRoute onRequestClose={closeNavOverlay} />
          )}
          {SHELL_V3 && <CommandHost />}
          {SHELL_V3 && <ModalHost />}
        </div>
      </QueryClientProvider>
      <Toaster />
    </RootDocument>
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

  return (
    <html lang="en" style={{ colorScheme: 'dark' }}>
      <head>
        <HeadContent />
        <meta name="theme-color" content="#0f1117" />
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
