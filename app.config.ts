import { defineConfig } from '@tanstack/react-start/config'

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '')

const apiProxyBase = stripTrailingSlashes(
  process.env.API_PROXY_URL?.trim() || 'http://127.0.0.1:4300'
)

export default defineConfig({
  server: {
    // Runtime accepts this, but the current published config types lag behind.
    // Keep the explicit port until the TanStack Start typings catch up.
    // @ts-expect-error port is supported at runtime
    port: 8000,
    routeRules: {
      // Keep browser requests on same-origin `/api/*` and proxy them internally.
      '/api/**': {
        proxy: {
          to: `${apiProxyBase}/**`,
        },
      },
    },
  },
  tsr: {
    generatedRouteTree: './src/routeTree.gen.ts',
  },
  react: {
    babel: {},
  },
})
