import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { PageContainer } from './PageContainer';

const meta = {
  title: 'Layout / PageContainer',
  component: PageContainer,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: null },
  render: () => (
    <div style={{ background: '#f1f5f9', minHeight: '100vh' }}>
      <PageContainer>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              border: '1px solid #e2e8f0',
            }}
          >
            Section {n}
          </div>
        ))}
      </PageContainer>
    </div>
  ),
};
