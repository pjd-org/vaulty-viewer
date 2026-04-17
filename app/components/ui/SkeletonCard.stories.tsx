import type { Meta, StoryObj } from '@storybook/react-vite';
import { SkeletonCard } from '@vault/ui';

const meta = {
  title: 'UI / Organisms / SkeletonCard',
  component: SkeletonCard,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SkeletonCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Wide: Story = { args: { className: 'w-full' } };
