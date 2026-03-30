import { defineConfig } from '@tanstack/react-start/config'
import path from 'node:path'

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '')

const apiProxyBase = stripTrailingSlashes(
  process.env.API_PROXY_URL?.trim() || 'http://127.0.0.1:4300'
)

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
  },
  server: {
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
