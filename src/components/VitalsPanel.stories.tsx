import type { Meta, StoryObj } from '@storybook/react-vite';
import { VitalsPanel } from './VitalsPanel';

const meta = {
  title: 'Avatar / VitalsPanel',
  component: VitalsPanel,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof VitalsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllHigh: Story = {
  args: { vitals: { health: 9, energy: 8, stress: 2 } },
};

export const AllMedium: Story = {
  args: { vitals: { health: 6, energy: 5, stress: 5 } },
};

export const LowEnergyHighStress: Story = {
  args: { vitals: { health: 7, energy: 3, stress: 8 } },
};

export const CriticalState: Story = {
  args: { vitals: { health: 3, energy: 2, stress: 9 } },
};

export const Empty: Story = {
  args: { vitals: {} },
};
