import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { PrimaryButton, SecondaryButton, IconButton } from './Buttons';

/* ── PrimaryButton ─────────────────────────────────────────────────────────── */
const primaryMeta = {
  title: 'UI / Buttons / PrimaryButton',
  component: PrimaryButton,
  parameters: { layout: 'centered' },
  args: { children: 'Save changes' },
} satisfies Meta<typeof PrimaryButton>;

export default primaryMeta;
type Story = StoryObj<typeof primaryMeta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
