export type InboxView = 'queue' | 'workbench' | 'archive';

export interface InboxCounts {
  queue: number;
  workbench: number;
  archive: number;
}

export interface InboxNote {
  path: string;
  title: string;
  status: string | null;
  tags: string[];
  frontmatter?: Record<string, unknown>;
  source: 'inbox' | 'extracted' | 'rejected';
}

export interface InboxFilterState {
  query: string;
  status: string;
}

export function getInboxNoteSource(notePath: string): InboxNote['source'] {
  if (notePath.startsWith('inbox/rejected/')) return 'rejected';
  if (notePath.startsWith('inbox/extracted/')) return 'extracted';
  return 'inbox';
}

export interface SplitInboxNotes {
  workbenchNotes: InboxNote[];
  archiveNotes: InboxNote[];
}

export function splitInboxNotes(rawNotes: InboxNote[]): SplitInboxNotes {
  const workbenchNotes: InboxNote[] = [];
  const archiveNotes: InboxNote[] = [];
  for (const note of rawNotes) {
    const source = getInboxNoteSource(note.path);
    const enriched: InboxNote = { ...note, source };
    if (source === 'rejected') {
      archiveNotes.push(enriched);
    } else {
      workbenchNotes.push(enriched);
    }
  }
  return { workbenchNotes, archiveNotes };
}

export function computeInboxCounts(
  runs: unknown[],
  workbenchNotes: InboxNote[],
  archiveNotes: InboxNote[]
): InboxCounts {
  return {
    queue: runs.length,
    workbench: workbenchNotes.length,
    archive: archiveNotes.length,
  };
}

export function defaultInboxView(queueCount: number): InboxView {
  return queueCount > 0 ? 'queue' : 'workbench';
}

export function filterWorkbenchNotes(
  notes: InboxNote[],
  filter: InboxFilterState
): InboxNote[] {
  const q = filter.query.toLowerCase().trim();
  return notes.filter((note) => {
    if (filter.status !== 'all' && note.status !== filter.status) return false;
    if (q && !note.title.toLowerCase().includes(q) && !note.path.toLowerCase().includes(q))
      return false;
    return true;
  });
}
