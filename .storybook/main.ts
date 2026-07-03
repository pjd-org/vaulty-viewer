import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCodeEditorStaticDirs } from 'storybook-addon-code-editor/getStaticDirs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  staticDirs: [...getCodeEditorStaticDirs(__filename)],
  stories: [
    '../app/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-mcp',
    '@storybook/addon-designs',
    '@storybook/addon-themes',
    'storybook-design-token',
    'storybook-addon-code-editor',
  ],
  framework: '@storybook/react-vite',
  viteFinal(config) {
    // Remove TanStack Start plugin — it's incompatible with Storybook's Vite runner
    config.plugins = (config.plugins ?? []).filter((p) => {
      if (!p || typeof p !== 'object' || !('name' in p)) return true;
      const name = (p as { name: string }).name;
      return !name.startsWith('tanstack') && name !== 'vite-plugin-react-start';
    });

    // Replicate the app's path alias so @/* resolves correctly in stories
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@': path.resolve(__dirname, '..'),
    };

    config.build = config.build ?? {};
    config.build.rollupOptions = config.build.rollupOptions ?? {};
    const existingOnWarn = config.build.rollupOptions.onwarn;
    config.build.rollupOptions.onwarn = (warning, warn) => {
      const message =
        typeof warning === 'string' ? warning : (warning.message ?? '');
      if (
        message.includes(
          'Module level directives cause errors when bundled, "use client"'
        )
      ) {
        return;
      }
      if (
        message.includes(
          "Error when using sourcemap for reporting an error: Can't resolve original location of error."
        )
      ) {
        return;
      }

      if (typeof existingOnWarn === 'function') {
        existingOnWarn(warning, warn);
        return;
      }
      warn(warning);
    };

    return config;
  },
};

export default config;
