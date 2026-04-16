import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent } from 'storybook/test';
import { SurfaceButtonChip } from './SurfaceChrome';

const meta = {
  title: 'UI / Atoms / SurfaceButtonChip',
  component: SurfaceButtonChip,
  parameters: { layout: 'padded' },
  args: {
    children: 'Action',
    onClick: fn(),
  },
} satisfies Meta<typeof SurfaceButtonChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: { tone: 'neutral', children: 'Neutral' },
};

export const Accent: Story = {
  args: { tone: 'accent', children: 'Accent' },
};

export const Muted: Story = {
  args: { tone: 'muted', children: 'Muted' },
};

export const Disabled: Story = {
  args: { tone: 'neutral', children: 'Disabled', disabled: true },
};

export const ClickFires: Story = {
  args: { tone: 'neutral', children: 'Click me' },
  play: async ({ canvas: _canvas, args }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = _canvas as any;
    await userEvent.click(canvas.getByRole('button', { name: 'Click me' }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const DisabledDoesNotFire: Story = {
  args: { tone: 'neutral', children: 'Disabled', disabled: true },
  play: async ({ canvas: _canvas, args }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = _canvas as any;
    await userEvent.click(canvas.getByRole('button', { name: 'Disabled' }));
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
