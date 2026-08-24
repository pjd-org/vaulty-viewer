import { describe, expect, it } from 'vitest';

import { computeInboxCounts, splitInboxNotes, type InboxNote } from '../src/lib/inbox-logic';

describe('inbox logic', () => {
  it('routes inbox/rejected notes to archive instead of workbench', () => {
    const notes: InboxNote[] = [
      {
        path: 'inbox/rejected/rejected-item.md',
        title: 'Rejected item',
        status: 'rejected',
        tags: [],
        source: 'rejected',
      },
      {
        path: 'inbox/extracted/workbench-item.md',
        title: 'Workbench item',
        status: 'draft',
        tags: [],
        source: 'extracted',
      },
    ];

    const { workbenchNotes, archiveNotes } = splitInboxNotes(notes);
    const counts = computeInboxCounts([], workbenchNotes, archiveNotes);

    expect(archiveNotes.map((note) => note.path)).toEqual([
      'inbox/rejected/rejected-item.md',
    ]);
    expect(workbenchNotes.map((note) => note.path)).toEqual([
      'inbox/extracted/workbench-item.md',
    ]);
    expect(counts).toEqual({ queue: 0, workbench: 1, archive: 1 });
  });
});
