import type { Meta, StoryObj } from '@storybook/react-vite';
import { DensitySelector } from './DensitySelector';

const meta = {
  title: 'Settings / DensitySelector',
  component: DensitySelector,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DensitySelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
