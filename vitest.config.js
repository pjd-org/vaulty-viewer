import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Force a single React singleton across all packages (root-hoisted and
      // viewer-local) so hook dispatchers never split across two module copies.
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-dom/client': path.resolve(
        __dirname,
        'node_modules/react-dom/client'
      ),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    include: [
      '__tests__/**/*.test.js',
      '__tests__/**/*.spec.js',
      '__tests__/*.test.js',
      '__tests__/*.spec.js',
      '__tests__/**/*.test.ts',
      '__tests__/**/*.spec.ts',
      '__tests__/**/*.test.tsx',
      '__tests__/**/*.spec.tsx',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.cache/**',
      '__tests__/e2e/**',
    ],
  },
});
