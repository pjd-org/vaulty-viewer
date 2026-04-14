import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedControl } from './Controls';

const meta = {
  title: 'UI / Controls / SegmentedControl',
  component: SegmentedControl,
  parameters: { layout: 'padded' },
  args: {
    options: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'done', label: 'Done' },
    ],
    value: 'all',
    onChange: () => {},
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ActiveSelected: Story = { args: { value: 'active' } };
export const TwoOptions: Story = {
  args: {
    options: [
      { value: 'list', label: 'List' },
      { value: 'board', label: 'Board' },
    ],
    value: 'list',
  },
};
