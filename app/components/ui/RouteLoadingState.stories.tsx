import type { Meta, StoryObj } from '@storybook/react-vite';
import { RouteLoadingState, RouteAsideEmptyState } from './RouteStates';

// ─── RouteLoadingState ────────────────────────────────────────────────────────

const loadingMeta = {
  title: 'UI / Organisms / RouteLoadingState',
  component: RouteLoadingState,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RouteLoadingState>;

export default loadingMeta;
type LoadingStory = StoryObj<typeof loadingMeta>;

export const Default: LoadingStory = {};
export const CustomLabel: LoadingStory = {
  args: { label: 'Fetching tasks…', rows: 3 },
};
export const ManyRows: LoadingStory = {
  args: { label: 'Loading surface…', rows: 8 },
};
