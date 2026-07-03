import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { NoteBodyEditor } from './NoteBodyEditor';

const sampleHtml = `
<h2>Architecture Decision</h2>
<p>We will use <strong>ProseKit</strong> as the rich-text engine for all note editing surfaces.</p>
<h3>Rationale</h3>
<ul>
  <li>Headless — no imposed styling</li>
  <li>ProseMirror-based — mature and extensible</li>
  <li>React-first API with hooks</li>
</ul>
<blockquote><p>Readonly mode uses <code>defineReadonly()</code>; edit mode removes it.</p></blockquote>
`;

const meta = {
  title: 'Note / NoteBodyEditor',
  component: NoteBodyEditor,
  parameters: { layout: 'padded' },
  args: {
    html: sampleHtml,
    onChange: fn(),
  },
} satisfies Meta<typeof NoteBodyEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EditModeToggle: Story = {
  args: { initialMode: 'edit' },
  play: async ({ canvas: _canvas, args }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = _canvas as any;
    await expect(canvas.getByRole('tab', { name: 'Edit' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    await userEvent.click(canvas.getByRole('tab', { name: 'Read' }));

    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(canvas.getByRole('tab', { name: 'Read' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  },
};

export const WithChangeOutput: Story = {
  render: () => {
    const [output, setOutput] = useState('(not yet edited)');
    return (
      <div className="space-y-4">
        <NoteBodyEditor
          html="<p>Switch to Edit mode and type to see the onChange output below.</p>"
          initialMode="edit"
          onChange={setOutput}
        />
        <pre className="text-xs bg-gray-100 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap">
          {output}
        </pre>
      </div>
    );
  },
};

export const EmptyContent: Story = {
  args: { html: '' },
};

export const AccentColor: Story = {
  args: {
    html: sampleHtml,
    accentColor: '#6C63FF',
    initialMode: 'read',
  },
};

export const AccentColorEdit: Story = {
  args: {
    html: sampleHtml,
    accentColor: '#22c55e',
    initialMode: 'edit',
  },
};
