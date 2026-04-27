import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const unitViteConfig = {
  ...viteConfig,
  plugins: (viteConfig.plugins ?? []).filter((p) => {
    if (!p || typeof p !== 'object' || !('name' in p)) return true;
    const name = (p as { name: string }).name;
    return !name.startsWith('tanstack') && name !== 'vite-plugin-react-start';
  }),
};

export default mergeConfig(
  unitViteConfig,
  defineConfig({
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        react: path.resolve(dirname, 'node_modules/react'),
        'react-dom': path.resolve(dirname, 'node_modules/react-dom'),
      },
    },
    test: {
      testTimeout: 30000,
      hookTimeout: 30000,
      environment: 'jsdom',
      fileParallelism: false,
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
  })
);
