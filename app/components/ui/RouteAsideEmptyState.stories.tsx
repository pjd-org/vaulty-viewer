import type { Meta, StoryObj } from '@storybook/react-vite';
import { RouteAsideEmptyState } from './RouteStates';

const meta = {
  title: 'UI / Organisms / RouteAsideEmptyState',
  component: RouteAsideEmptyState,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RouteAsideEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No task selected',
    description: 'Select a task from the board to see details here.',
  },
};

export const BlockerContext: Story = {
  args: {
    title: 'No blockers',
    description: 'All tasks in this project are unblocked.',
  },
};

export const KnowledgeContext: Story = {
  args: {
    title: 'No note selected',
    description: 'Open a note from the browser to load its workspace.',
    testId: 'knowledge-empty',
  },
};
