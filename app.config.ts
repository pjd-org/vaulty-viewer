import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  server: {
    port: 8000,
  },
  tsr: {
    generatedRouteTree: './src/routeTree.gen.ts',
  },
  react: {
    babel: {},
  },
})
