import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@vault/ui/atoms';

const meta = {
  title: 'UI / Atoms / Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  args: { children: 'Badge' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Accent: Story = {
  args: { variant: 'accent', children: 'Accent' },
};
export const Success: Story = {
  args: { variant: 'success', children: 'Success' },
};
export const Warning: Story = {
  args: { variant: 'warning', children: 'Warning' },
};
export const Danger: Story = {
  args: { variant: 'danger', children: 'Danger' },
};
export const Muted: Story = {
  args: { variant: 'muted', children: 'Muted' },
};
