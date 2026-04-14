import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodSignalRow } from './CodSignalRow';
import type { PressureSignal } from '../../lib/viewer-adapter';

const baseSignal: PressureSignal = {
  id: 'sig-1',
  kind: 'stale',
  title: 'Stale phase notes — no edits in 14 days',
  summary: 'Phase 3 notes untouched since Apr 1.',
  severity: 'medium',
  surfacedBy: 'cod',
  sourceType: 'note',
  sourceId: 'notes/projects/phase-3/plan.md',
  surfacedAt: new Date().toISOString(),
  whySurfaced: 'Phase 3 notes untouched since Apr 1.',
  allowedActions: [],
  confidence: 0.82,
};

const criticalSignal: PressureSignal = {
  id: 'sig-2',
  kind: 'blocker',
  title: 'Blocked task chain detected',
  summary: '3 tasks share a circular dependency.',
  severity: 'high',
  surfacedBy: 'cod',
  sourceType: 'task',
  sourceId: 'notes/tasks/implement-auth.md',
  surfacedAt: new Date().toISOString(),
  whySurfaced: '3 tasks share a circular dependency.',
  allowedActions: [],
  confidence: 0.95,
};

const meta = {
  title: 'COD / CodSignalRow',
  component: CodSignalRow,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CodSignalRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const V3Signals: Story = {
  args: {
    signals: [baseSignal, criticalSignal],
    onOpen: () => {},
    onAct: () => {},
  },
};

export const SingleSignal: Story = {
  args: { signals: [baseSignal], onOpen: () => {}, onAct: () => {} },
};

export const V1LegacyItems: Story = {
  args: {
    items: [
      { label: 'Energy', value: 'High', variant: 'ok' },
      { label: 'Hard stop', value: '23:00', variant: 'warn' },
      { label: 'Blocked tasks', value: '3', variant: 'bad' },
    ],
  },
};
