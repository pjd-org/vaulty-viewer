import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { CardGrid, GridCol } from './CardGrid';

const meta = {
  title: 'Layout / CardGrid',
  component: CardGrid,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const Box = ({ label }: { label: string }) => (
  <div
    style={{
      background: '#e2e8f0',
      borderRadius: 8,
      padding: '16px',
      textAlign: 'center',
      fontSize: 13,
      color: '#475569',
    }}
  >
    {label}
  </div>
);

export const TwelveColumns: Story = {
  args: { children: null },
  render: () => (
    <CardGrid cols={12} gap={4}>
      <GridCol span={6}>
        <Box label="col-6" />
      </GridCol>
      <GridCol span={6}>
        <Box label="col-6" />
      </GridCol>
      <GridCol span={4}>
        <Box label="col-4" />
      </GridCol>
      <GridCol span={4}>
        <Box label="col-4" />
      </GridCol>
      <GridCol span={4}>
        <Box label="col-4" />
      </GridCol>
      <GridCol span={12}>
        <Box label="col-12 (full)" />
      </GridCol>
    </CardGrid>
  ),
};

export const ThreeColumns: Story = {
  args: { children: null },
  render: () => (
    <CardGrid cols={3} gap={4}>
      <GridCol span={1}>
        <Box label="1/3" />
      </GridCol>
      <GridCol span={1}>
        <Box label="1/3" />
      </GridCol>
      <GridCol span={1}>
        <Box label="1/3" />
      </GridCol>
    </CardGrid>
  ),
};
