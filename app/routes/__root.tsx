import * as React from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import Navbar from '../../src/components/Navbar'
import { queryClient } from '../../src/query-client'
import appCss from '../../src/styles.css?url'

export const Route = createRootRoute({
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
})

function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const hideNavbar = pathname === '/login' || pathname === '/oauth/consent'

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen">
          {!hideNavbar && <Navbar />}
          <Outlet />
        </div>
      </QueryClientProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
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
  )
}

function RootNotFound() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Not Found</h1>
        <p className="lede">This route does not exist.</p>
      </header>
    </main>
  )
}
