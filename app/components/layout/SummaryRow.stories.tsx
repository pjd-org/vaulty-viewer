import type { Meta, StoryObj } from '@storybook/react-vite';
import { SummaryRow } from './SummaryRow';

const meta = {
  title: 'Layout / SummaryRow',
  component: SummaryRow,
  parameters: { layout: 'padded' },
  args: {
    items: [
      { label: 'Tasks done', value: '42', trend: 12 },
      { label: 'Open items', value: '7', trend: -3 },
      { label: 'Blocked', value: '2', detail: 'Waiting on phase sign-off' },
      { label: 'Sessions', value: '18' },
    ],
  },
} satisfies Meta<typeof SummaryRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoTrends: Story = {
  args: {
    items: [
      { label: 'Projects', value: '5' },
      { label: 'Active tasks', value: '23' },
    ],
  },
};
export const SingleItem: Story = {
  args: {
    items: [
      {
        label: 'Focus score',
        value: '8.4',
        detail: 'Above average this week',
        trend: 5,
      },
    ],
  },
};
