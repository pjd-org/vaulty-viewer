import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { GlassSurface } from '@vault/ui';
import { CodSeverityPill } from './CodSeverityPill';
import { CodActionRow } from './CodActionRow';
import { CodConstraintTable } from './CodConstraintTable';
import { CodSignalRow } from './CodSignalRow';
import { SoftPanel, SectionHeader } from '../layout';
import { ReasonText } from '../ui';

/**
 * CodModal integrates useCODStatus (live hook) so it cannot render in isolation.
 * These stories exercise the same visual composition using static prop data,
 * verifying the assembled layout for each COD status state.
 */

const meta = {
  title: 'COD / CodModal',
  parameters: { layout: 'padded' },
  // No component — stories use render() with static fixtures
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const constraintItems = [
  { label: 'Energy', value: '7 / 10' },
  { label: 'Stress', value: '3 / 10' },
  { label: 'Time available', value: '90 min' },
  { label: 'Focus capacity', value: 'deep' },
];

const signalItems = [
  { label: 'Energy', value: '70%', variant: 'ok' as const },
  { label: 'Stress', value: '30%', variant: 'ok' as const },
  { label: 'Time available', value: '90%', variant: 'ok' as const },
];

export const ClearState: Story = {
  render: () => (
    <SoftPanel variant="utility">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <CodSeverityPill variant="clear" label="Clear" />
          <p className="mt-2 text-base font-medium text-[var(--text-primary)]">
            Good to go — all signals green
          </p>
        </div>
      </div>
      <CodActionRow
        actions={['Start 25m sprint', 'Start full session', 'Check in']}
        canWork
        onCheckIn={() => undefined}
      />
      <div className="grid grid-cols-2 gap-6 mt-6">
        <GlassSurface variant="canvas" radius="lg" shadow="sm" className="p-4">
          <SectionHeader title="Constraints" />
          <CodConstraintTable items={constraintItems} />
        </GlassSurface>
        <GlassSurface variant="canvas" radius="lg" shadow="sm" className="p-4">
          <SectionHeader title="Signals" />
          <CodSignalRow items={signalItems} />
        </GlassSurface>
      </div>
    </SoftPanel>
  ),
};

export const WarnState: Story = {
  render: () => (
    <SoftPanel variant="utility">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <CodSeverityPill variant="warn" label="Warn" />
          <p className="mt-2 text-base font-medium text-[var(--text-primary)]">
            Proceed with caution
          </p>
          <ReasonText className="mt-1">
            Stress elevated above threshold.
          </ReasonText>
        </div>
      </div>
      <CodActionRow
        actions={['Start 25m sprint', 'Check in']}
        canWork
        onCheckIn={() => undefined}
      />
      <div className="grid grid-cols-2 gap-6 mt-6">
        <GlassSurface variant="canvas" radius="lg" shadow="sm" className="p-4">
          <SectionHeader title="Constraints" />
          <CodConstraintTable items={constraintItems} />
        </GlassSurface>
        <GlassSurface variant="canvas" radius="lg" shadow="sm" className="p-4">
          <SectionHeader title="Signals" />
          <CodSignalRow
            items={[
              { label: 'Energy', value: '60%', variant: 'ok' },
              { label: 'Stress', value: '70%', variant: 'warn' },
              { label: 'Time available', value: '55%', variant: 'warn' },
            ]}
          />
        </GlassSurface>
      </div>
    </SoftPanel>
  ),
};

export const StopState: Story = {
  render: () => (
    <SoftPanel variant="utility">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <CodSeverityPill variant="stop" label="Stop" />
          <p className="mt-2 text-base font-medium text-[var(--text-primary)]">
            Rest recommended
          </p>
          <ReasonText className="mt-1">
            Energy too low to start a session.
          </ReasonText>
        </div>
      </div>
      <CodActionRow
        actions={['Check in']}
        canWork={false}
        onCheckIn={() => undefined}
      />
      <div className="grid grid-cols-2 gap-6 mt-6">
        <GlassSurface variant="canvas" radius="lg" shadow="sm" className="p-4">
          <SectionHeader title="Constraints" />
          <CodConstraintTable items={constraintItems} />
        </GlassSurface>
        <GlassSurface variant="canvas" radius="lg" shadow="sm" className="p-4">
          <SectionHeader title="Signals" />
          <CodSignalRow
            items={[
              { label: 'Energy', value: '20%', variant: 'bad' },
              { label: 'Stress', value: '90%', variant: 'bad' },
              { label: 'Time available', value: '30%', variant: 'warn' },
            ]}
          />
        </GlassSurface>
      </div>
    </SoftPanel>
  ),
};

export const UnknownState: Story = {
  render: () => (
    <SoftPanel variant="utility">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <CodSeverityPill variant="unknown" label="Unknown" />
          <p className="mt-2 text-base font-medium text-[var(--text-primary)]">
            No human state data
          </p>
          <ReasonText className="mt-1">Check in to calibrate.</ReasonText>
        </div>
      </div>
      <CodActionRow
        actions={['Check in']}
        canWork={false}
        onCheckIn={() => undefined}
      />
      <div className="grid grid-cols-2 gap-6 mt-6">
        <GlassSurface variant="canvas" radius="lg" shadow="sm" className="p-4">
          <SectionHeader title="Constraints" />
          <CodConstraintTable items={[]} />
        </GlassSurface>
        <GlassSurface variant="canvas" radius="lg" shadow="sm" className="p-4">
          <SectionHeader title="Signals" />
          <CodSignalRow items={[]} />
        </GlassSurface>
      </div>
    </SoftPanel>
  ),
};
