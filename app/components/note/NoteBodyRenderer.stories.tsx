import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { NoteBodyRenderer } from './NoteBodyRenderer';

const sampleHtml = `
<h2>Overview</h2>
<p>This note describes the COD signal renderer implementation. It should handle all signal variants
and render them with proper type guards.</p>
<h3>Requirements</h3>
<ul>
  <li>Support <code>warn</code>, <code>ok</code>, and <code>bad</code> variant states</li>
  <li>Render within a <code>SoftPanel</code> container</li>
  <li>Accept a typed array of signal items</li>
</ul>
<blockquote><p>Design principle: never show raw severity codes to the user — always map to human labels.</p></blockquote>
<pre><code>export interface CodSignalItem {
  label: string;
  value: string;
  variant?: 'warn' | 'ok' | 'bad';
}</code></pre>
`;

const meta = {
  title: 'Note / NoteBodyRenderer',
  component: NoteBodyRenderer,
  parameters: { layout: 'padded' },
  args: { html: sampleHtml },
} satisfies Meta<typeof NoteBodyRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Short: Story = {
  args: {
    html: '<p>A simple one-paragraph note with no complex structure.</p>',
  },
};

export const WithTable: Story = {
  args: {
    html: `
<table>
  <thead><tr><th>Field</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Status</td><td>todo</td></tr>
    <tr><td>Priority</td><td>8</td></tr>
    <tr><td>Effort</td><td>5</td></tr>
  </tbody>
</table>`,
  },
};

export const Empty: Story = {
  args: { html: '' },
};
