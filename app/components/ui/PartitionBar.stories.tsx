import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import PartitionBar, {
  PartitionBarSegment,
  PartitionBarSegmentTitle,
  PartitionBarSegmentValue,
} from './partition-bar';

const meta = {
  title: 'UI / PartitionBar',
  component: PartitionBar,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PartitionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full h-24">
      <PartitionBar>
        <PartitionBarSegment num={40} variant="default">
          <PartitionBarSegmentTitle>Done</PartitionBarSegmentTitle>
          <PartitionBarSegmentValue>40</PartitionBarSegmentValue>
        </PartitionBarSegment>
        <PartitionBarSegment num={30} variant="secondary">
          <PartitionBarSegmentTitle>In Progress</PartitionBarSegmentTitle>
          <PartitionBarSegmentValue>30</PartitionBarSegmentValue>
        </PartitionBarSegment>
        <PartitionBarSegment num={30} variant="muted">
          <PartitionBarSegmentTitle>Backlog</PartitionBarSegmentTitle>
          <PartitionBarSegmentValue>30</PartitionBarSegmentValue>
        </PartitionBarSegment>
      </PartitionBar>
    </div>
  ),
};

export const WithDestructive: Story = {
  render: () => (
    <div className="w-full h-24">
      <PartitionBar>
        <PartitionBarSegment num={60} variant="default">
          <PartitionBarSegmentTitle>Passing</PartitionBarSegmentTitle>
          <PartitionBarSegmentValue>60%</PartitionBarSegmentValue>
        </PartitionBarSegment>
        <PartitionBarSegment num={40} variant="destructive">
          <PartitionBarSegmentTitle>Failing</PartitionBarSegmentTitle>
          <PartitionBarSegmentValue>40%</PartitionBarSegmentValue>
        </PartitionBarSegment>
      </PartitionBar>
    </div>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <div className="w-full h-20">
      <PartitionBar size="sm">
        <PartitionBarSegment num={50} variant="default">
          <PartitionBarSegmentTitle>A</PartitionBarSegmentTitle>
        </PartitionBarSegment>
        <PartitionBarSegment num={25} variant="secondary">
          <PartitionBarSegmentTitle>B</PartitionBarSegmentTitle>
        </PartitionBarSegment>
        <PartitionBarSegment num={25} variant="muted">
          <PartitionBarSegmentTitle>C</PartitionBarSegmentTitle>
        </PartitionBarSegment>
      </PartitionBar>
    </div>
  ),
};

export const LargeSize: Story = {
  render: () => (
    <div className="w-full h-32">
      <PartitionBar size="lg">
        <PartitionBarSegment num={70} variant="default" alignment="left">
          <PartitionBarSegmentTitle>Completed</PartitionBarSegmentTitle>
          <PartitionBarSegmentValue>70 tasks</PartitionBarSegmentValue>
        </PartitionBarSegment>
        <PartitionBarSegment num={30} variant="outline" alignment="right">
          <PartitionBarSegmentTitle>Remaining</PartitionBarSegmentTitle>
          <PartitionBarSegmentValue>30 tasks</PartitionBarSegmentValue>
        </PartitionBarSegment>
      </PartitionBar>
    </div>
  ),
};

export const SingleSegment: Story = {
  render: () => (
    <div className="w-full h-20">
      <PartitionBar>
        <PartitionBarSegment num={100} variant="default">
          <PartitionBarSegmentTitle>All Done</PartitionBarSegmentTitle>
          <PartitionBarSegmentValue>100%</PartitionBarSegmentValue>
        </PartitionBarSegment>
      </PartitionBar>
    </div>
  ),
};
