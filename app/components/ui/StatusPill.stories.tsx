import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { StatusPill } from './Chips';

const meta = {
  title: 'UI / StatusPill',
  component: StatusPill,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Todo: Story = { args: { status: 'todo' } };
export const InProgress: Story = { args: { status: 'in-progress' } };
export const Blocked: Story = { args: { status: 'blocked' } };
export const Done: Story = { args: { status: 'done' } };
export const Backlog: Story = { args: { status: 'backlog' } };

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusPill status="todo" />
      <StatusPill status="in-progress" />
      <StatusPill status="blocked" />
      <StatusPill status="done" />
      <StatusPill status="backlog" />
    </div>
  ),
};
