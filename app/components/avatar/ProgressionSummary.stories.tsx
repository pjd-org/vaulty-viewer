import type { Meta, StoryObj } from '@storybook/react-vite';
import { makeLiveEditStory } from 'storybook-addon-code-editor';
import { ProgressionSummary } from '../ui/ProgressionSummary';

const meta = {
  title: 'Avatar / ProgressionSummary',
  component: ProgressionSummary,
  parameters: { layout: 'padded' },
  args: {
    level: 12,
    currentXp: 4750,
    xpToNext: 5000,
    progression: {},
  },
} satisfies Meta<typeof ProgressionSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ActiveStreak: Story = {
  args: {
    level: 8,
    currentXp: 2100,
    xpToNext: 2500,
    progression: {
      streakDays: 7,
      streakUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  },
};

export const InactiveStreak: Story = {
  args: {
    level: 5,
    currentXp: 800,
    xpToNext: 1000,
    progression: {
      streakDays: 14,
      streakUpdated: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
  },
};

export const LevelZero: Story = {
  args: {
    level: 0,
    currentXp: 0,
    xpToNext: 100,
    progression: {},
  },
};

export const HighLevel: Story = {
  args: {
    level: 42,
    currentXp: 99500,
    xpToNext: 100000,
    progression: {
      streakDays: 30,
      streakUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  },
};

export const NoStreak: Story = {
  args: {
    level: 3,
    currentXp: 250,
    xpToNext: 500,
    progression: { streakDays: 0 },
  },
};

export const WithCodeEditor: Story = { ...Default };

makeLiveEditStory(WithCodeEditor, {
  availableImports: {
    './ProgressionSummary': { ProgressionSummary },
  },
  code: `import { ProgressionSummary } from '../ui/ProgressionSummary';

export default () => (
  <ProgressionSummary
    level={12}
    currentXp={4750}
    xpToNext={5000}
    progression={{ streakDays: 7, streakUpdated: new Date().toISOString() }}
  />
);`,
});
