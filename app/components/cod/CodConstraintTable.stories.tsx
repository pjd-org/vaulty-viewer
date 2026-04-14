import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodConstraintTable } from './CodConstraintTable';

const meta = {
  title: 'COD / CodConstraintTable',
  component: CodConstraintTable,
  parameters: { layout: 'padded' },
  args: {
    items: [
      { label: 'Energy', value: 'High' },
      { label: 'Focus window', value: '90 min' },
      { label: 'Session type', value: 'Deep work' },
      { label: 'Hard stop', value: '23:00' },
    ],
  },
} satisfies Meta<typeof CodConstraintTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Minimal: Story = {
  args: { items: [{ label: 'Status', value: 'Active' }] },
};
