import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { KnowledgePanel, CapacityPanel } from './KnowledgePanel';

// ─── KnowledgePanel ──────────────────────────────────────────────────────────

const knowledgeMeta = {
  title: 'Avatar / KnowledgePanel',
  component: KnowledgePanel,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof KnowledgePanel>;

export default knowledgeMeta;
type Story = StoryObj<typeof knowledgeMeta>;

export const WithDomainsAndLearning: Story = {
  args: {
    knowledge: {
      domains: {
        TypeScript: 4,
        React: 5,
        Python: 3,
        'Obsidian/PKM': 4,
        'System Design': 2,
      },
      learning: {
        now: ['LangChain', 'Vite plugin authoring'],
        next: ['Rust basics', 'Edge workers'],
      },
      gaps: ['mobile testing', 'database tuning'],
    },
  },
};

export const DomainsOnly: Story = {
  args: {
    knowledge: {
      domains: {
        Python: 5,
        FastAPI: 4,
        SQL: 3,
      },
    },
  },
};

export const LearningOnly: Story = {
  args: {
    knowledge: {
      learning: {
        now: ['Storybook 8', 'TanStack Router'],
        next: ['Playwright E2E'],
      },
    },
  },
};

export const GapsOnly: Story = {
  args: {
    knowledge: {
      gaps: ['CI/CD pipelines', 'observability', 'security auditing'],
    },
  },
};

export const Empty: Story = {
  args: { knowledge: {} },
};

export const NoKnowledgeProp: Story = {
  args: {},
};

// ─── CapacityPanel ───────────────────────────────────────────────────────────

export const CapacityDefault: StoryObj<typeof CapacityPanel> = {
  render: () => (
    <CapacityPanel
      capacity={{ focusCostMax: 7, effortScoreMax: 6, timeBudgetMin: 90 }}
    />
  ),
};

export const CapacityLow: StoryObj<typeof CapacityPanel> = {
  render: () => (
    <CapacityPanel
      capacity={{ focusCostMax: 2, effortScoreMax: 2, timeBudgetMin: 30 }}
    />
  ),
};

export const CapacityNoProps: StoryObj<typeof CapacityPanel> = {
  render: () => <CapacityPanel />,
};
