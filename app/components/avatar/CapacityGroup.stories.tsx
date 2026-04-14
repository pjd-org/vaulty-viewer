import type { Meta, StoryObj } from '@storybook/react-vite';
import { CapacityGroup } from './CapacityGroup';

const meta = {
  title: 'Avatar / CapacityGroup',
  component: CapacityGroup,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CapacityGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullCapacity: Story = {
  args: {
    capacity: {
      timeBudgetMin: 90,
      focusCostMax: 7,
      effortScoreMax: 7,
    },
  },
};

export const ShortWindow: Story = {
  args: {
    capacity: {
      timeBudgetMin: 20,
      focusCostMax: 3,
      effortScoreMax: 3,
    },
  },
};

export const TimeBudgetOnly: Story = {
  args: {
    capacity: {
      timeBudgetMin: 60,
    },
  },
};

export const FocusAndEffortOnly: Story = {
  args: {
    capacity: {
      focusCostMax: 5,
      effortScoreMax: 5,
    },
  },
};

export const HighCapacity: Story = {
  args: {
    capacity: {
      timeBudgetMin: 180,
      focusCostMax: 9,
      effortScoreMax: 9,
    },
  },
};

export const LowCapacity: Story = {
  args: {
    capacity: {
      timeBudgetMin: 30,
      focusCostMax: 2,
      effortScoreMax: 2,
    },
  },
};

// Returns null — nothing rendered
export const Empty: Story = {
  args: {
    capacity: {},
  },
};
