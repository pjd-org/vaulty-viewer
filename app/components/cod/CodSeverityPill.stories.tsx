import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodSeverityPill } from './CodSeverityPill';

const meta = {
  title: 'COD / CodSeverityPill',
  component: CodSeverityPill,
  parameters: { layout: 'centered' },
  args: { variant: 'rest', label: 'Rest' },
} satisfies Meta<typeof CodSeverityPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rest: Story = {};
export const Clear: Story = { args: { variant: 'clear', label: 'Clear' } };
export const Warn: Story = { args: { variant: 'warn', label: 'Warn' } };
export const Stop: Story = { args: { variant: 'stop', label: 'Stop' } };
export const Unknown: Story = {
  args: { variant: 'unknown', label: 'Unknown' },
};
