import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlockersRail } from './BlockersRail';
import type { KanbanTask } from '../../../src/lib/kanban-logic';

const blockedTasks: KanbanTask[] = [
  {
    id: 'task-001',
    title: 'Deploy API v2 to production',
    status: 'blocked',
    priority: 9,
    tags: ['backend', 'infra'],
    estimatedTimeMin: 60,
    cmsSlug: 'deploy-api-v2',
    link: '/work',
    completedAt: null,
    createdAt: Date.now(),
  },
  {
    id: 'task-002',
    title: 'Finalize onboarding copy',
    status: 'blocked',
    priority: 7,
    tags: ['copy', 'ux'],
    estimatedTimeMin: 30,
    cmsSlug: 'onboarding-copy',
    link: '/work',
    completedAt: null,
    createdAt: Date.now(),
  },
  {
    id: 'task-003',
    title: 'Fix auth regression from last deploy',
    status: 'blocked',
    priority: 10,
    tags: [],
    cmsSlug: 'fix-auth-regression',
    link: '/work',
    completedAt: null,
    createdAt: Date.now(),
  },
];

const meta = {
  title: 'Projects / BlockersRail',
  component: BlockersRail,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BlockersRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleBlocker: Story = {
  args: { blockedTasks: [blockedTasks[0]] },
};

export const MultipleBlockers: Story = {
  args: { blockedTasks: blockedTasks },
};

export const NoTags: Story = {
  args: { blockedTasks: [blockedTasks[2]] },
};

// BlockersRail returns null when empty — show a placeholder note instead
export const Empty: Story = {
  render: () => (
    <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
      BlockersRail renders nothing when blockedTasks is empty (returns null).
    </p>
  ),
};
