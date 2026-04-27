import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { FilterBar } from './FilterBar';

type SortKey = 'newest' | 'oldest' | 'confidence' | 'itemCount';

function StatefulFilterBar() {
  const [sort, setSort] = useState<SortKey>('newest');
  const [runType, setRunType] = useState('');
  const [reversibility, setReversibility] = useState('');
  const [severity, setSeverity] = useState('');
  return (
    <FilterBar
      sort={sort}
      onSortChange={setSort}
      runType={runType}
      onRunTypeChange={setRunType}
      reversibility={reversibility}
      onReversibilityChange={setReversibility}
      severity={severity}
      onSeverityChange={setSeverity}
      loading={false}
      anyInFlight={false}
      onRefresh={() => {}}
    />
  );
}

const meta = {
  title: 'Inbox / FilterBar',
  component: FilterBar,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sort: 'newest',
    onSortChange: () => {},
    runType: '',
    onRunTypeChange: () => {},
    reversibility: '',
    onReversibilityChange: () => {},
    severity: '',
    onSeverityChange: () => {},
    loading: false,
    anyInFlight: false,
    onRefresh: () => {},
  },
  render: () => <StatefulFilterBar />,
};

export const Loading: Story = {
  args: {
    sort: 'newest',
    onSortChange: () => {},
    runType: '',
    onRunTypeChange: () => {},
    reversibility: '',
    onReversibilityChange: () => {},
    severity: '',
    onSeverityChange: () => {},
    loading: true,
    anyInFlight: false,
    onRefresh: () => {},
  },
};

export const InFlight: Story = {
  args: {
    sort: 'confidence',
    onSortChange: () => {},
    runType: 'signals_infer',
    onRunTypeChange: () => {},
    reversibility: 'high',
    onReversibilityChange: () => {},
    severity: 'medium',
    onSeverityChange: () => {},
    loading: false,
    anyInFlight: true,
    onRefresh: () => {},
  },
};
