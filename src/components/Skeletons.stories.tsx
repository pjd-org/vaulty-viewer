import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  SkeletonCard,
  SkeletonStat,
  SkeletonKanbanColumn,
  SkeletonGoalCard,
  SkeletonVitals,
  SkeletonCardGrid,
  SkeletonKanban,
  SkeletonGoalsList,
} from './Skeletons';

// Use SkeletonCardGrid as the primary component for the meta (arbitrary — all
// are zero-prop render components).
const meta = {
  title: 'Loading / Skeletons',
  component: SkeletonCardGrid,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SkeletonCardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Atomic skeletons ──────────────────────────────────────────────────────────

export const Card: Story = {
  render: () => <SkeletonCard />,
};

export const Stat: Story = {
  render: () => <SkeletonStat />,
};

export const KanbanColumn: Story = {
  render: () => <SkeletonKanbanColumn />,
};

export const GoalCard: Story = {
  render: () => <SkeletonGoalCard />,
};

export const Vitals: Story = {
  render: () => <SkeletonVitals />,
};

// ── Composite skeletons ───────────────────────────────────────────────────────

export const CardGrid: Story = {
  args: { count: 6 },
};

export const CardGridSmall: Story = {
  args: { count: 3 },
};

export const Kanban: Story = {
  render: () => <SkeletonKanban />,
};

export const GoalsList: Story = {
  render: () => <SkeletonGoalsList count={4} />,
};

export const GoalsListShort: Story = {
  render: () => <SkeletonGoalsList count={2} />,
};
