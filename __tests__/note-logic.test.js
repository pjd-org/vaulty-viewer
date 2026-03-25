import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  getLifecycleContext,
  renderNoteMarkdown,
  toApiNotePath,
  toNoteHref,
} from '../src/lib/note-logic.ts';

describe('note-logic', () => {
  it('renders wikilinks and vault note links as internal note hrefs', () => {
    const html = renderNoteMarkdown(
      [
        '# Hello',
        '',
        '[[notes/tasks/viewer/demo-task|Open task]]',
        '[Legacy task link](/note/notes/tasks/viewer/demo-task)',
        '[Vault note link](/notes/tasks/viewer/demo-task)',
        '',
        '<script>alert(1)</script>',
      ].join('\n')
    );

    expect(html).toContain(
      `<a href="${toNoteHref('notes/tasks/viewer/demo-task')}" class="wikilink">Open task</a>`
    );
    expect(html).toContain(
      `<a href="${toNoteHref('notes/tasks/viewer/demo-task')}" class="wikilink">Legacy task link</a>`
    );
    expect(html).toContain(
      `<a href="${toNoteHref('notes/tasks/viewer/demo-task')}" class="wikilink">Vault note link</a>`
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('<h1>Hello</h1>');
  });

  it('keeps reader-safe markup for task, knowledge, and inbox/rejected note content', () => {
    const taskHtml = renderNoteMarkdown(
      '# Task note\n\n- [ ] Work item\n- [x] Done item\n\n[[notes/knowledge/reader-surface]]'
    );
    const knowledgeHtml = renderNoteMarkdown(
      '# Knowledge note\n\n[Reader note](/note/notes/tasks/viewer/demo-task)\n\n```js\nconsole.log("ok")\n```'
    );
    const rejectedHtml = renderNoteMarkdown(
      '# Rejected note\n\n[Back to queue](/inbox/rejected/run-1/demo-task)\n\n<script>alert(2)</script>'
    );

    expect(taskHtml).toContain('<li class="task-item">');
    expect(taskHtml).toContain('class="wikilink"');
    expect(knowledgeHtml).toContain(
      'href="/note?p=notes%2Ftasks%2Fviewer%2Fdemo-task"'
    );
    expect(knowledgeHtml).toContain('<code class="language-js">');
    expect(rejectedHtml).toContain(
      'href="/note?p=inbox%2Frejected%2Frun-1%2Fdemo-task"'
    );
    expect(rejectedHtml).not.toContain('<script>');
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

    const stagedWithoutRun = getLifecycleContext(
      'inbox/extracted/run-1/demo.md',
      {
        type: 'task',
        _target_path: 'notes/tasks/viewer/demo.md',
      }
    );
    expect(stagedWithoutRun.canPromote).toBe(false);
    expect(stagedWithoutRun.isStaged).toBe(false);

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

  it('keeps the note route in a reader-first responsive layout with related notes', () => {
    const cwd = process.cwd();
    const viewerRoot = cwd.endsWith('/apps/viewer')
      ? cwd
      : resolve(cwd, 'apps/viewer');
    const source = readFileSync(
      resolve(viewerRoot, 'app/routes/note.tsx'),
      'utf8'
    );

    expect(source).toContain('/api/v1/graph/related/${encodedPath}?limit=8');
    expect(source).toContain('grid grid-cols-12 gap-6');
    expect(source).toContain('className="col-span-12 lg:col-span-4 space-y-4"');
    expect(source).toContain('NoteBodyRenderer');
    expect(source).toContain('NoteMetaRail');
  });
});
