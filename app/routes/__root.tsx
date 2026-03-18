import { Outlet } from '@tanstack/react-router'
import { createRootRoute } from '@tanstack/react-router'
import Navbar from '../../src/components/Navbar'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}
