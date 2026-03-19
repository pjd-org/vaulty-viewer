import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      '__tests__/**/*.test.js',
      '__tests__/**/*.spec.js',
      '__tests__/*.test.js',
      '__tests__/*.spec.js',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.cache/**',
      '__tests__/e2e/**',
    ],
  },
});
