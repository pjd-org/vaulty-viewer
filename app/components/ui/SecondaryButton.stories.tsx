import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SecondaryButton } from './Buttons';

const meta = {
  title: 'UI / Atoms / SecondaryButton',
  component: SecondaryButton,
  parameters: { layout: 'centered' },
  args: { children: 'Cancel' },
} satisfies Meta<typeof SecondaryButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
