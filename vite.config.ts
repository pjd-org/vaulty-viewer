import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: '/_viewer/',
  ssr: {
    // Bundle packages not present in the container's node_modules into SSR output.
    noExternal: ['@radix-ui/react-collapsible'],
    // Keep React external so there is exactly one copy at runtime.
    // The react/react-dom aliases below were inlining a second copy into
    // dist/server/server.js, causing `useState` to be null on SSR render.
    external: ['react', 'react-dom'],
  },
  plugins: [
    tanstackStart({
      srcDirectory: 'src',
      // Entries are resolved from srcDirectory; route to top-level app/* files.
      client: { entry: '../app/client.tsx' },
      server: { entry: '../app/ssr.tsx' },
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
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  server: {
    port: 8000,
    fs: {
      allow: [path.resolve(import.meta.dirname, '../..')],
    },
  },
});
