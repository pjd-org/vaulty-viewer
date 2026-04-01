import * as React from 'react';
import {
  HeadContent,
  Outlet,
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
import { serializeDehydratedQueryState } from '../../src/query-client';
import {
  NAV_OVERLAY_EVENT,
  type NavOverlay,
  type NavOverlayDetail,
} from '../../src/lib/nav-overlays';
import { isShellHiddenPath } from '../../src/lib/routes/v3-routing';
import { AvatarRoute } from './avatar';
import { CODStatusRoute } from './cod-status';
import appCss from '../../src/styles.css?url';

const SHELL_V3 = import.meta.env.VITE_SHELL_V3 === 'true';

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
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: hydrationScript }}
        />
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
