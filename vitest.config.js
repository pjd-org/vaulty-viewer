import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
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
