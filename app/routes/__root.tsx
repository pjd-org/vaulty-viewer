import { Outlet } from '@tanstack/react-router'
import { createRootRoute } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import Navbar from '../../src/components/Navbar'
import { queryClient } from '../../src/query-client'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navbar />
      <Outlet />
    </QueryClientProvider>
  )
}
