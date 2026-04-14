import type { Meta, StoryObj } from '@storybook/react-vite';
import { GoalCard } from './GoalCard';

/**
 * NOTE: GoalCard calls `apiFetch` only when the user clicks "Approve" or
 * "Needs changes" in the expanded task list. All stories here keep the card
 * collapsed by default, so no network traffic is triggered on render.
 */

const baseTasks = [
  {
    id: 'task-001',
    path: 'goals/tensura-v2/task-001.md',
    title: 'Design new auth flow',
    status: 'completed',
    effortScore: 4,
  },
  {
    id: 'task-002',
    path: 'goals/tensura-v2/task-002.md',
    title: 'Implement JWT refresh',
    status: 'in-progress',
    effortScore: 6,
  },
  {
    id: 'task-003',
    path: 'goals/tensura-v2/task-003.md',
    title: 'Write integration tests',
    status: 'todo',
    effortScore: 5,
  },
  {
    id: 'task-004',
    path: 'goals/tensura-v2/task-004.md',
    title: 'Deploy to staging',
    status: 'blocked',
    effortScore: 3,
  },
];

const meta = {
  title: 'Goals / GoalCard',
  component: GoalCard,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof GoalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnTrack: Story = {
  args: {
    goal: {
      id: 'tensura-v2',
      title: 'Tensura v2 launch',
      progress: 62,
      status: 'on-track',
      stats: {
        total: 12,
        completed: 7,
        totalEffort: 48,
        completedEffort: 30,
        blocked: 1,
      },
      tasks: baseTasks,
      targetDate: '2026-05-01',
      eta: '2026-04-28',
      priority: 8,
    },
  },
};

export const AtRisk: Story = {
  args: {
    goal: {
      id: 'knowledge-index',
      title: 'Knowledge graph rebuild',
      progress: 35,
      status: 'at-risk',
      stats: {
        total: 8,
        completed: 3,
        totalEffort: 32,
        completedEffort: 10,
        blocked: 2,
      },
      tasks: [
        {
          id: 't1',
          title: 'Audit stale nodes',
          status: 'completed',
          effortScore: 3,
        },
        {
          id: 't2',
          title: 'Fix edge resolver',
          status: 'in-progress',
          effortScore: 7,
        },
        { id: 't3', title: 'Reindex vault', status: 'blocked', effortScore: 5 },
      ],
      eta: '2026-04-20',
      priority: 6,
    },
  },
};

export const Behind: Story = {
  args: {
    goal: {
      id: 'api-hardening',
      title: 'API hardening & auth',
      progress: 18,
      status: 'behind',
      stats: {
        total: 10,
        completed: 2,
        totalEffort: 55,
        completedEffort: 9,
        blocked: 3,
      },
      tasks: baseTasks,
      targetDate: '2026-04-15',
      priority: 9,
    },
  },
};

export const Blocked: Story = {
  args: {
    goal: {
      id: 'deploy-pipeline',
      title: 'Deploy pipeline automation',
      progress: 45,
      status: 'blocked',
      stats: {
        total: 6,
        completed: 3,
        totalEffort: 20,
        completedEffort: 10,
        blocked: 3,
      },
      tasks: [
        {
          id: 't1',
          title: 'Write Dockerfile',
          status: 'completed',
          effortScore: 2,
        },
        {
          id: 't2',
          title: 'CI/CD secrets config',
          status: 'blocked',
          effortScore: 5,
        },
        {
          id: 't3',
          title: 'Smoke test in staging',
          status: 'blocked',
          effortScore: 4,
        },
      ],
      priority: 7,
    },
  },
};

export const Completed: Story = {
  args: {
    goal: {
      id: 'onboarding-redesign',
      title: 'Onboarding redesign',
      progress: 100,
      status: 'completed',
      stats: {
        total: 5,
        completed: 5,
        totalEffort: 18,
        completedEffort: 18,
        blocked: 0,
      },
      tasks: [
        {
          id: 't1',
          title: 'User research synthesis',
          status: 'completed',
          effortScore: 4,
        },
        { id: 't2', title: 'Wireframes', status: 'completed', effortScore: 3 },
        {
          id: 't3',
          title: 'Implementation',
          status: 'completed',
          effortScore: 6,
        },
      ],
      targetDate: '2026-03-31',
      priority: 5,
    },
  },
};

export const MinimalNoOptionals: Story = {
  args: {
    goal: {
      id: 'quick-goal',
      title: 'Minimal goal — no dates or priority',
      progress: 0,
      status: 'on-track',
      stats: { total: 3, completed: 0 },
      tasks: [],
    },
  },
};
