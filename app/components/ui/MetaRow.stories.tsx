import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MetaRow, ReasonText } from './Labels';

// ─── MetaRow ─────────────────────────────────────────────────────────────────

const metaRowMeta = {
  title: 'UI / MetaRow',
  component: MetaRow,
  parameters: { layout: 'padded' },
  args: {
    items: [
      { label: '90 min' },
      { label: 'Focus cost 6' },
      { label: 'Priority 8' },
    ],
  },
} satisfies Meta<typeof MetaRow>;

export default metaRowMeta;
type MetaRowStory = StoryObj<typeof metaRowMeta>;

export const Default: MetaRowStory = {};

export const WithIcons: MetaRowStory = {
  args: {
    items: [
      { icon: <span>⏱</span>, label: '45 min' },
      { icon: <span>🎯</span>, label: 'Priority 9' },
      { icon: <span>🔥</span>, label: 'Deep focus' },
    ],
  },
};

export const Single: MetaRowStory = {
  args: { items: [{ label: 'Due Apr 30' }] },
};

// ─── ReasonText ──────────────────────────────────────────────────────────────

export const ReasonTextDefault: StoryObj = {
  render: () => (
    <ReasonText>
      This task has been prioritised because it unblocks three downstream items
      and is due in under 48 hours.
    </ReasonText>
  ),
};
