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
      onSort={setSort}
      runType={runType}
      onRunType={setRunType}
      reversibility={reversibility}
      onReversibility={setReversibility}
      severity={severity}
      onSeverity={setSeverity}
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
    onSort: () => {},
    runType: '',
    onRunType: () => {},
    reversibility: '',
    onReversibility: () => {},
    severity: '',
    onSeverity: () => {},
    loading: false,
    anyInFlight: false,
    onRefresh: () => {},
  },
  render: () => <StatefulFilterBar />,
};

export const Loading: Story = {
  args: {
    sort: 'newest',
    onSort: () => {},
    runType: '',
    onRunType: () => {},
    reversibility: '',
    onReversibility: () => {},
    severity: '',
    onSeverity: () => {},
    loading: true,
    anyInFlight: false,
    onRefresh: () => {},
  },
};

export const InFlight: Story = {
  args: {
    sort: 'confidence',
    onSort: () => {},
    runType: 'signals_infer',
    onRunType: () => {},
    reversibility: 'high',
    onReversibility: () => {},
    severity: 'medium',
    onSeverity: () => {},
    loading: false,
    anyInFlight: true,
    onRefresh: () => {},
  },
};
