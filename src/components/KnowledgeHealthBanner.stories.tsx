import type { Meta, StoryObj } from '@storybook/react-vite';
import { KnowledgeHealthBanner } from './KnowledgeHealthBanner';
import type { GraphHealthReport } from './KnowledgeHealthBanner';

const freshHealth: GraphHealthReport = {
  graph_generated: new Date(Date.now() - 5 * 60_000).toISOString(), // 5 min ago
  is_stale: false,
  node_count: 312,
  edge_count: 1_048,
  by_audience: { human: 240, agent: 62, bubble: 10 },
  unresolved_link_count: 4,
};

const staleHealth: GraphHealthReport = {
  ...freshHealth,
  graph_generated: new Date(Date.now() - 3 * 3_600_000).toISOString(), // 3 hours ago
  is_stale: true,
};

const manyUnresolved: GraphHealthReport = {
  ...freshHealth,
  is_stale: false,
  unresolved_link_count: 73,
};

const emptyVault: GraphHealthReport = {
  ...freshHealth,
  node_count: 0,
  edge_count: 0,
};

const meta = {
  title: 'Knowledge / KnowledgeHealthBanner',
  component: KnowledgeHealthBanner,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof KnowledgeHealthBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Healthy vault — shows green success banner with note + time info. */
export const Healthy: Story = {
  args: { health: freshHealth },
};

/** Graph index is stale — shows warning banner. */
export const Stale: Story = {
  args: { health: staleHealth },
};

/** More than 50 unresolved wikilinks — shows warning banner. */
export const ManyUnresolvedLinks: Story = {
  args: { health: manyUnresolved },
};

/** Vault has no notes — shows error banner prompting pipeline run. */
export const EmptyVault: Story = {
  args: { health: emptyVault },
};

/** API has not responded yet — shows skeleton loading state. */
export const Loading: Story = {
  args: { health: null, loading: true },
};

/** health=null and not loading — renders nothing (null). */
export const NoData: Story = {
  args: { health: null, loading: false },
};
