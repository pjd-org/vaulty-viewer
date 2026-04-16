import type { Preview, Decorator } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import React from 'react';
import '../src/styles.css';

/**
 * Wraps every story in the app's gradient canvas so that backdrop-filter /
 * glass effects have a visible background to blur against — identical to the
 * real app's <body> gradient.
 */
const withAppBackground: Decorator = (StoryFn) =>
  React.createElement(
    'div',
    {
      style: {
        minHeight: '100vh',
        background: [
          'radial-gradient(980px at 18% 10%, rgba(165,207,255,0.24), transparent 62%)',
          'radial-gradient(720px at 82% 92%, rgba(216,195,255,0.15), transparent 70%)',
          'linear-gradient(180deg, #e9edf5 0%, #d8dfeb 56%, #cfd7e6 100%)',
        ].join(', '),
        padding: '1px 0', // prevent margin collapse
      },
    },
    React.createElement(StoryFn)
  );

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    layout: 'padded',
    backgrounds: { disable: true }, // we supply our own background via decorator
  },
  decorators: [
    withAppBackground,
    withThemeByClassName({
      themes: {
        Light: '',
        Dark: 'dark',
      },
      defaultTheme: 'Light',
    }),
  ],
};

export default preview;
