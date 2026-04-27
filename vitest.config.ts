import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import viteConfig from './vite.config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const storybookViteConfig = {
  ...viteConfig,
  plugins: (viteConfig.plugins ?? []).filter((p) => {
    if (!p || typeof p !== 'object' || !('name' in p)) return true;
    const name = (p as { name: string }).name;
    return !name.startsWith('tanstack') && name !== 'vite-plugin-react-start';
  }),
};

export default mergeConfig(
  storybookViteConfig,
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
      browser: {
        server: {
          fs: {
            allow: [path.resolve(dirname, '../..')],
          },
        },
      },
      projects: [
        {
          extends: true,
          test: {
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
            ],
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, '.storybook'),
              storybookScript: 'pnpm storybook --ci',
            }),
          ],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: 'chromium' }],
            },
          },
        },
        {
          test: {
            name: 'e2e',
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: 'chromium' }],
            },
            include: ['__tests__/e2e/**/*.test.ts'],
          },
        },
      ],
    },
  })
);
