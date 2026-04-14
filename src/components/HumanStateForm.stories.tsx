import type { Meta, StoryObj } from '@storybook/react-vite';
import { HumanStateForm } from './HumanStateForm';

const meta = {
  title: 'COD / HumanStateForm',
  component: HumanStateForm,
  parameters: { layout: 'centered' },
  args: {
    onSubmit: () => {},
    onCancel: () => {},
    loading: false,
  },
} satisfies Meta<typeof HumanStateForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — no prior state; all sliders at defaults. */
export const Default: Story = {};

/** Pre-filled from existing human state (morning check). */
export const PreFilled: Story = {
  args: {
    currentState: {
      energy: 0.75,
      focusCapacity: 'high',
      stress: 0.15,
      sleepDebt: 0.5,
      timeAvailableMin: 180,
    },
  },
};

/** Low energy, high stress — afternoon slump scenario. */
export const LowEnergyHighStress: Story = {
  args: {
    currentState: {
      energy: 0.25,
      focusCapacity: 'low',
      stress: 0.85,
      sleepDebt: 2,
      timeAvailableMin: 30,
    },
  },
};

/** Submitting — loading state, buttons disabled. */
export const Submitting: Story = {
  args: {
    loading: true,
    currentState: {
      energy: 0.6,
      focusCapacity: 'med',
      stress: 0.4,
      timeAvailableMin: 90,
    },
  },
};
