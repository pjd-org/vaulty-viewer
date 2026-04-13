export type InboxView = 'queue' | 'workbench' | 'archive';

export type InboxBucket =
  | 'all'
  | 'needs_action'
  | 'needs_approval'
  | 'failure'
  | 'drift_stale'
  | 'rejected_user'
  | 'rejected_automated'
  | 'deferred';

export const INBOX_BUCKET_CONFIG: Array<{
  bucket: InboxBucket;
  label: string;
  shortLabel: string;
  matches: (item: { inboxBucket: string }) => boolean;
}> = [
  {
    bucket: 'all',
    label: 'All Signals',
    shortLabel: 'All',
    matches: () => true,
  },
  {
    bucket: 'needs_action',
    label: 'Needs Action',
    shortLabel: 'Action',
    matches: (i) => i.inboxBucket === 'needs_action',
  },
  {
    bucket: 'needs_approval',
    label: 'Needs Approval',
    shortLabel: 'Approval',
    matches: (i) => i.inboxBucket === 'needs_approval',
  },
  {
    bucket: 'failure',
    label: 'Failures',
    shortLabel: 'Failures',
    matches: (i) => i.inboxBucket === 'failure',
  },
  {
    bucket: 'drift_stale',
    label: 'Drift / Stale',
    shortLabel: 'Drift',
    matches: (i) => i.inboxBucket === 'drift' || i.inboxBucket === 'stale',
  },
  {
    bucket: 'rejected_user',
    label: 'Rejected',
    shortLabel: 'Rejected',
    matches: (i) => i.inboxBucket === 'rejected_user',
  },
  {
    bucket: 'rejected_automated',
    label: 'Auto-rejected',
    shortLabel: 'Auto',
    matches: (i) => i.inboxBucket === 'rejected_automated',
  },
  {
    bucket: 'deferred',
    label: 'Deferred',
    shortLabel: 'Deferred',
    matches: (i) => i.inboxBucket === 'deferred',
  },
];

export function getBucketAllowedActions(
  bucket: InboxBucket
): Array<'promote' | 'reject'> {
  if (bucket === 'all') return ['promote', 'reject'];
  if (bucket === 'rejected_user') return ['promote', 'reject'];
  if (bucket === 'rejected_automated') return ['promote', 'reject'];
  if (bucket === 'deferred') return ['promote', 'reject'];
  return ['promote', 'reject'];
}

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
    if (
      q &&
      !note.title.toLowerCase().includes(q) &&
      !note.path.toLowerCase().includes(q)
    )
      return false;
    return true;
  });
}
