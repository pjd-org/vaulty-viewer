import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReasonText } from './Labels';

const meta = {
  title: 'UI / Labels / ReasonText',
  component: ReasonText,
  parameters: { layout: 'padded' },
  args: {
    children:
      'This task was surfaced because no edits have been made in the past 14 days.',
  },
} satisfies Meta<typeof ReasonText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
