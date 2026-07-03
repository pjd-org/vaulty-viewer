import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressionPanel } from './ProgressionPanel';

const meta = {
  title: 'Avatar / ProgressionPanel',
  component: ProgressionPanel,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ProgressionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mid-level with an active streak (updated today). */
export const ActiveStreak: Story = {
  args: {
    level: 7,
    currentXp: 3_400,
    xpToNext: 5_000,
    xpProgress: 68,
    progression: {
      streakDays: 14,
      streakUpdated: new Date().toISOString(),
    },
  },
};

/** Level 1 — just starting out, no streak yet. */
export const NewUser: Story = {
  args: {
    level: 1,
    currentXp: 0,
    xpToNext: 500,
    xpProgress: 0,
    progression: { streakDays: 0 },
  },
};

/** Streak at risk — last update was 2 days ago. */
export const StreakAtRisk: Story = {
  args: {
    level: 12,
    currentXp: 8_900,
    xpToNext: 10_000,
    xpProgress: 89,
    progression: {
      streakDays: 30,
      streakUpdated: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    },
  },
};

/** High level — more than 5 stars capped at 5. */
export const HighLevel: Story = {
  args: {
    level: 25,
    currentXp: 42_000,
    xpToNext: 50_000,
    xpProgress: 84,
    progression: {
      streakDays: 7,
      streakUpdated: new Date().toISOString(),
    },
  },
};

/** No progression prop provided (optional). */
export const NoProgression: Story = {
  args: {
    level: 5,
    currentXp: 2_100,
    xpToNext: 3_000,
    xpProgress: 70,
  },
};
