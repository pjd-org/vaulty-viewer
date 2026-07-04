import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const testResolve = {
  dedupe: ['react', 'react-dom'],
  alias: {
    '@': dirname,
    react: path.resolve(dirname, 'node_modules/react'),
    'react-dom': path.resolve(dirname, 'node_modules/react-dom'),
    'react/jsx-runtime': path.resolve(dirname, 'node_modules/react/jsx-runtime'),
    'react/jsx-dev-runtime': path.resolve(dirname, 'node_modules/react/jsx-dev-runtime'),
  },
};

const unitViteConfig = {
  ...viteConfig,
  ssr: {
    ...(viteConfig.ssr ?? {}),
    // Vitest with jsdom runs in SSR mode internally. The vite.config.ts sets
    // ssr.external for react/react-dom to avoid duplicating them in SSR bundles,
    // but in jsdom tests this causes separate instances to be loaded from
    // different pnpm resolution paths (e.g. @testing-library/react's react-dom
    // from root store vs viewer's react-dom from viewer store).
    // Override to let Vite transform these modules consistently.
    external: [],
  },
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
      ...testResolve,
    },
    test: {
      testTimeout: 30000,
      hookTimeout: 30000,
      projects: [
        {
          resolve: {
            ...testResolve,
          },
          test: {
            name: 'node',
            environment: 'node',
            fileParallelism: false,
            include: [
              '__tests__/**/*.test.js',
              '__tests__/**/*.spec.js',
              '__tests__/**/*.test.ts',
              '__tests__/**/*.spec.ts',
            ],
            exclude: [
              '**/node_modules/**',
              '**/dist/**',
              '**/.cache/**',
              '__tests__/e2e/**',
              '__tests__/api/**',
              '__tests__/hooks/**',
              '__tests__/lib/primary-agent-thread-history.test.ts',
              '__tests__/lib/thread-registry-hydration.test.ts',
              '__tests__/store/ui-layout.test.ts',
              '__tests__/store/ui-theme.test.ts',
              '__tests__/query-client.test.ts',
            ],
          },
        },
        {
          resolve: {
            ...testResolve,
          },
          test: {
            name: 'jsdom',
            environment: 'jsdom',
            fileParallelism: false,
            setupFiles: ['./__tests__/setup.ts'],
            include: [
              '__tests__/**/*.test.tsx',
              '__tests__/**/*.spec.tsx',
              '__tests__/query-client.test.ts',
              '__tests__/api/**/*.test.ts',
              '__tests__/hooks/**/*.test.ts',
              '__tests__/lib/primary-agent-thread-history.test.ts',
              '__tests__/lib/thread-registry-hydration.test.ts',
              '__tests__/store/ui-layout.test.ts',
              '__tests__/store/ui-theme.test.ts',
            ],
            exclude: [
              '**/node_modules/**',
              '**/dist/**',
              '**/.cache/**',
              '__tests__/e2e/**',
            ],
          },
        },
      ],
    },
  })
);
