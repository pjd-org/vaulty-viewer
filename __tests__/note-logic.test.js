import { describe, expect, it } from 'vitest';

import {
  getLifecycleContext,
  renderNoteMarkdown,
  toApiNotePath,
  toNoteHref,
} from '../src/lib/note-logic.ts';

describe('note-logic', () => {
  it('renders wikilinks as internal note hrefs and strips unsafe script tags', () => {
    const html = renderNoteMarkdown(
      '# Hello\n\n[[notes/tasks/viewer/demo-task|Open task]]\n\n<script>alert(1)</script>'
    );

    expect(html).toContain(
      `<a href="${toNoteHref('notes/tasks/viewer/demo-task')}" class="wikilink">Open task</a>`
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('<h1>Hello</h1>');
  });

  it('normalizes api note paths with markdown extension', () => {
    expect(toApiNotePath('notes/tasks/viewer/demo-task')).toBe(
      'notes/tasks/viewer/demo-task.md'
    );
    expect(toApiNotePath('notes/tasks/viewer/demo-task.md')).toBe(
      'notes/tasks/viewer/demo-task.md'
    );
  });

  it('derives staged and canonical lifecycle states from path and frontmatter', () => {
    const staged = getLifecycleContext('inbox/extracted/run-1/demo.md', {
      type: 'task',
      _run_id: 'run-1',
      _target_path: 'notes/tasks/viewer/demo.md',
    });
    expect(staged.canPromote).toBe(true);
    expect(staged.canReject).toBe(true);
    expect(staged.isCanonicalTask).toBe(false);

    const rejected = getLifecycleContext('inbox/rejected/run-1/demo.md', {
      type: 'task',
      _run_id: 'run-1',
      _target_path: 'notes/tasks/viewer/demo.md',
    });
    expect(rejected.canPromote).toBe(true);
    expect(rejected.canReject).toBe(false);

    const canonicalTask = getLifecycleContext('notes/tasks/viewer/demo.md', {
      type: 'task',
      status: 'todo',
      review_status: 'needs_changes',
    });
    expect(canonicalTask.canReview).toBe(true);
    expect(canonicalTask.canComplete).toBe(true);
    expect(canonicalTask.reviewStatus).toBe('needs_changes');
  });
});
