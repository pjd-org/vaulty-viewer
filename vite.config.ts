import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: '/_viewer/',
  plugins: [
    tanstackStart({
      srcDirectory: 'src',
      client: { entry: 'app/client.tsx' },
      server: { entry: 'app/ssr.tsx' },
      start: { entry: 'start.ts' },
      router: {
        routesDirectory: '../app/routes',
        generatedRouteTree: 'routeTree.gen.ts',
        entry: 'router.tsx',
      },
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  server: {
    port: 8000,
  },
});
