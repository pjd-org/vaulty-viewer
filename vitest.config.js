import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
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
