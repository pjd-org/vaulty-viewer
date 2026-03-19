import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  server: {
    // Runtime accepts this, but the current published config types lag behind.
    // Keep the explicit port until the TanStack Start typings catch up.
    // @ts-expect-error port is supported at runtime
    port: 8000,
  },
  tsr: {
    generatedRouteTree: './src/routeTree.gen.ts',
  },
  react: {
    babel: {},
  },
})
