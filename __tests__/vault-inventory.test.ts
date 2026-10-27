import { describe, expect, it } from 'vitest';
import { buildVaultDirectoryPage } from '../app/lib/vault-inventory';

const notes = [
  'notes/core/Avatar.md',
  'notes/core/notes.mdx',
  'tasks/pantha/check.md',
  'inbox/extracted/run-1/draft.md',
  'inbox/rejected/run-2/unsafe.md',
  'archive/retired.md',
  '._system/internal.md',
];

// The API filters private source-plane files. That is an API security contract,
// not a UI bypass. The UI does separately withhold staging/review roots.
describe('Vault directory inventory', () => {
  it('lists real root folders from unindexed Markdown and MDX paths', () => {
    const result = buildVaultDirectoryPage(notes.filter((p) => !p.startsWith('._')), {
      folder: '', search: '', offset: 0, limit: 50,
    });
    expect(result.folders).toEqual(['notes', 'tasks']);
    expect(result.total).toBe(0);
  });

  it('shows immediate children with stable pagination', () => {
    const result = buildVaultDirectoryPage(notes, {
      folder: 'notes/core', search: '', offset: 1, limit: 1,
    });
    expect(result.total).toBe(2);
    expect(result.entries.map((item) => item.path)).toEqual(['notes/core/notes.mdx']);
    expect(result.hasMore).toBe(false);
  });

  it('does not reveal staged, rejected or archived paths through a general read tab', () => {
    const result = buildVaultDirectoryPage(notes, {
      folder: '', search: 'draft', offset: 0, limit: 50,
    });
    expect(result.entries).toEqual([]);
    expect(result.folders).toEqual([]);
  });

  it('finds deep path matches by preserving discoverable parent folders', () => {
    const root = buildVaultDirectoryPage(notes, {
      folder: '', search: 'pantha', offset: 0, limit: 50,
    });
    expect(root.folders).toEqual(['tasks']);
    const nested = buildVaultDirectoryPage(notes, {
      folder: 'tasks', search: 'pantha', offset: 0, limit: 50,
    });
    expect(nested.folders).toEqual(['tasks/pantha']);
  });
});
