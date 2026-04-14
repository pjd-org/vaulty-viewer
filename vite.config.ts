import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: '/_viewer/',
  ssr: {
    // Bundle packages not present in the container's node_modules into SSR output.
    noExternal: ['radix-ui', '@radix-ui/react-collapsible'],
  },
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
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
      react: path.resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
    },
  },
  server: {
    port: 8000,
    fs: {
      allow: [path.resolve(import.meta.dirname, '../..')],
    },
  },
});
