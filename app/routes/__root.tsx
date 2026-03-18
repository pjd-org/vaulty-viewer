import { Outlet } from '@tanstack/react-router'
import { createRootRoute } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import Navbar from '../../src/components/Navbar'
import { queryClient } from '../../src/query-client'

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootError,
  notFoundComponent: RootNotFound,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navbar />
      <Outlet />
    </QueryClientProvider>
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
