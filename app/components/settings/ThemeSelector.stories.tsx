import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeSelector } from './ThemeSelector';

const meta = {
  title: 'Settings / ThemeSelector',
  component: ThemeSelector,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
