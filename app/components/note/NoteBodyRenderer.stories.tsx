import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { fn, expect } from 'storybook/test';
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
<h3>Notes</h3>
<p>Rendered via <strong>ProseKit</strong> in <em>readonly</em> mode — no editing, full fidelity.</p>
<hr />
<p>Inline marks: <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, <code>inline code</code>.</p>
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

export const RichContent: Story = {
  args: {
    html: `
<h1>Project Alpha</h1>
<p>High-level overview of the project goals and current phase.</p>
<h2>Goals</h2>
<ol>
  <li>Ship the core pipeline by end of Q2</li>
  <li>Integrate monitoring hooks</li>
  <li>Document the public API</li>
</ol>
<h2>Risks</h2>
<ul>
  <li><strong>Dependency lag</strong> — upstream package pinned to old version</li>
  <li><em>Staffing</em> — one engineer on leave until May</li>
</ul>
<blockquote><p>Velocity is not speed. Ship the right thing slowly over the wrong thing fast.</p></blockquote>
<hr />
<p>Status: <strong>In Progress</strong> | Owner: <em>darry</em></p>
`,
  },
};

export const WithTable: Story = {
  args: {
    html: `
<h2>Metrics</h2>
<table>
  <thead>
    <tr><th>Field</th><th>Value</th></tr>
  </thead>
  <tbody>
    <tr><td>Status</td><td>todo</td></tr>
    <tr><td>Priority</td><td>8</td></tr>
    <tr><td>Effort</td><td>5</td></tr>
  </tbody>
</table>
<p>Table data reflects the last sync from the task graph.</p>
`,
  },
};

export const WithCodeBlock: Story = {
  args: {
    html: `
<h2>Implementation</h2>
<p>The core handler signature:</p>
<pre><code class="language-typescript">async function handleEvent(
  event: DomainEvent,
  ctx: EventContext,
): Promise&lt;void&gt; {
  const writer = new DomainEventWriter(ctx.log);
  await writer.write(event);
}</code></pre>
<p>All domain events must be written to <code>._log/events/*.jsonl</code> only.</p>
`,
  },
};

export const Empty: Story = {
  args: { html: '' },
};

export const LongDocument: Story = {
  args: {
    html: Array.from(
      { length: 8 },
      (_, i) => `
<h2>Section ${i + 1}</h2>
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>
<ul>
  <li>Point A in section ${i + 1}</li>
  <li>Point B with <strong>emphasis</strong></li>
  <li>Point C with <code>inline code</code></li>
</ul>
`
    ).join(''),
  },
};

// ── Editable stories ──────────────────────────────────────────────────────────

export const Editable: Story = {
  args: {
    html: '<h2>Edit me</h2><p>This note is editable. Click anywhere and start typing.</p>',
    editable: true,
    onChange: fn(),
  },
  play: async ({ canvas: _canvas, args }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = _canvas as any;
    // The ProseMirror div should be contentEditable when editable=true
    const editorEl = await canvas.findByRole('textbox');
    await expect(editorEl).toBeInTheDocument();
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const EditableWithChangeCallback: Story = {
  name: 'Editable — onChange fires',
  render: () => {
    const [output, setOutput] = useState('(not yet edited)');
    return (
      <div className="space-y-4">
        <NoteBodyRenderer
          html="<p>Type something to see the onChange output below.</p>"
          editable
          onChange={setOutput}
        />
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
          {output}
        </pre>
      </div>
    );
  },
  args: { html: '' },
};
