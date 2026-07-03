import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import Timeline, {
  TimelineItem,
  TimelineItemDate,
  TimelineItemTitle,
  TimelineItemDescription,
} from './timeline';

const meta = {
  title: 'UI / Timeline',
  component: Timeline,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HorizontalAlternating: Story = {
  render: () => (
    <div className="w-full h-96">
      <Timeline orientation="horizontal" alternating>
        <TimelineItem variant="default">
          <TimelineItemDate>{new Date('2025-01-10')}</TimelineItemDate>
          <TimelineItemTitle>Project Kickoff</TimelineItemTitle>
          <TimelineItemDescription>
            Team aligned on scope and deliverables.
          </TimelineItemDescription>
        </TimelineItem>
        <TimelineItem variant="secondary">
          <TimelineItemDate>{new Date('2025-02-01')}</TimelineItemDate>
          <TimelineItemTitle>Phase 1 Complete</TimelineItemTitle>
          <TimelineItemDescription>
            Foundation laid, core APIs shipped.
          </TimelineItemDescription>
        </TimelineItem>
        <TimelineItem variant="default">
          <TimelineItemDate>{new Date('2025-03-15')}</TimelineItemDate>
          <TimelineItemTitle>Beta Launch</TimelineItemTitle>
          <TimelineItemDescription>
            First users onboarded, feedback loop open.
          </TimelineItemDescription>
        </TimelineItem>
        <TimelineItem variant="destructive">
          <TimelineItemDate>{new Date('2025-04-01')}</TimelineItemDate>
          <TimelineItemTitle>Incident</TimelineItemTitle>
          <TimelineItemDescription>
            Outage resolved within 2 hours.
          </TimelineItemDescription>
        </TimelineItem>
      </Timeline>
    </div>
  ),
};

export const VerticalAlternating: Story = {
  render: () => (
    <div className="w-96 h-[600px]">
      <Timeline orientation="vertical" alternating>
        <TimelineItem variant="default">
          <TimelineItemDate>{new Date('2025-01-10')}</TimelineItemDate>
          <TimelineItemTitle>Project Kickoff</TimelineItemTitle>
          <TimelineItemDescription>
            Team aligned on scope.
          </TimelineItemDescription>
        </TimelineItem>
        <TimelineItem variant="secondary">
          <TimelineItemDate>{new Date('2025-02-01')}</TimelineItemDate>
          <TimelineItemTitle>Phase 1 Complete</TimelineItemTitle>
          <TimelineItemDescription>Core APIs shipped.</TimelineItemDescription>
        </TimelineItem>
        <TimelineItem variant="default">
          <TimelineItemDate>{new Date('2025-03-15')}</TimelineItemDate>
          <TimelineItemTitle>Beta Launch</TimelineItemTitle>
          <TimelineItemDescription>
            First users onboarded.
          </TimelineItemDescription>
        </TimelineItem>
      </Timeline>
    </div>
  ),
};

export const HorizontalTopAligned: Story = {
  render: () => (
    <div className="w-full h-64">
      <Timeline
        orientation="horizontal"
        alternating={false}
        alignment="top/left"
      >
        <TimelineItem variant="default">
          <TimelineItemDate>Jan 2025</TimelineItemDate>
          <TimelineItemTitle>Start</TimelineItemTitle>
        </TimelineItem>
        <TimelineItem variant="default">
          <TimelineItemDate>Feb 2025</TimelineItemDate>
          <TimelineItemTitle>Milestone 1</TimelineItemTitle>
        </TimelineItem>
        <TimelineItem variant="default">
          <TimelineItemDate>Mar 2025</TimelineItemDate>
          <TimelineItemTitle>Milestone 2</TimelineItemTitle>
        </TimelineItem>
        <TimelineItem variant="default">
          <TimelineItemDate>Apr 2025</TimelineItemDate>
          <TimelineItemTitle>Launch</TimelineItemTitle>
        </TimelineItem>
      </Timeline>
    </div>
  ),
};

export const HollowDots: Story = {
  render: () => (
    <div className="w-full h-96">
      <Timeline orientation="horizontal" alternating>
        <TimelineItem variant="default" hollow>
          <TimelineItemDate>{new Date('2025-01-10')}</TimelineItemDate>
          <TimelineItemTitle>Hollow Default</TimelineItemTitle>
        </TimelineItem>
        <TimelineItem variant="secondary" hollow>
          <TimelineItemDate>{new Date('2025-02-01')}</TimelineItemDate>
          <TimelineItemTitle>Hollow Secondary</TimelineItemTitle>
        </TimelineItem>
        <TimelineItem variant="destructive" hollow>
          <TimelineItemDate>{new Date('2025-03-01')}</TimelineItemDate>
          <TimelineItemTitle>Hollow Destructive</TimelineItemTitle>
        </TimelineItem>
      </Timeline>
    </div>
  ),
};

export const NoCards: Story = {
  render: () => (
    <div className="w-full h-72">
      <Timeline orientation="horizontal" alternating noCards>
        <TimelineItem variant="default">
          <TimelineItemDate>Q1</TimelineItemDate>
          <TimelineItemTitle>Research</TimelineItemTitle>
        </TimelineItem>
        <TimelineItem variant="default">
          <TimelineItemDate>Q2</TimelineItemDate>
          <TimelineItemTitle>Build</TimelineItemTitle>
        </TimelineItem>
        <TimelineItem variant="default">
          <TimelineItemDate>Q3</TimelineItemDate>
          <TimelineItemTitle>Launch</TimelineItemTitle>
        </TimelineItem>
        <TimelineItem variant="default">
          <TimelineItemDate>Q4</TimelineItemDate>
          <TimelineItemTitle>Grow</TimelineItemTitle>
        </TimelineItem>
      </Timeline>
    </div>
  ),
};
