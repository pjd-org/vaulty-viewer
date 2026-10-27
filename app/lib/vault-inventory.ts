/**
 * Directory projection of the API's runtime-readable Markdown/MDX inventory.
 * Unlike /notes (knowledge index), this view can discover unindexed notes.
 * Inbox staging and archive are deliberately separate reviewer surfaces.
 */
export interface VaultDirectoryPage {
  view: 'vault';
  folder: string;
  entries: Array<{ path: string; name: string; folder: string; state: 'live' }>;
  folders: string[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export function buildVaultDirectoryPage(
  paths: unknown[],
  params: { folder: string; search: string; offset: number; limit: number }
): VaultDirectoryPage {
  const folder = params.folder.replace(/^\\/+|\\/+$/g, '');
  const prefix = folder ? `${folder}/` : '';
  const needle = params.search.trim().toLowerCase();
  const folders = new Set<string>();
  const entries: VaultDirectoryPage['entries'] = [];

  for (const path of paths) {
    if (typeof path !== 'string' || !/\\.mdx?$/i.test(path)) continue;
    // The read-scoped inventory is NOT a staging-review authorization.
    if (path.startsWith('inbox/') || path.startsWith('archive/')) continue;
    if (needle && !path.toLowerCase().includes(needle)) continue;
    if (prefix && !path.startsWith(prefix)) continue;
    const relative = path.slice(prefix.length);
    if (!relative) continue;
    const slash = relative.indexOf('/');
    if (slash !== -1) {
      folders.add(`${prefix}${relative.slice(0, slash)}`);
    } else {
      entries.push({
        path,
        name: relative.replace(/\\.mdx?$/i, ''),
        folder,
        state: 'live',
      });
    }
  }

  entries.sort((a, b) => a.path.localeCompare(b.path));
  const offset = Math.max(0, params.offset);
  const limit = Math.max(1, params.limit);
  return {
    view: 'vault',
    folder,
    entries: entries.slice(offset, offset + limit),
    folders: [...folders].sort(),
    total: entries.length,
    offset,
    limit,
    hasMore: offset + limit < entries.length,
  };
}
