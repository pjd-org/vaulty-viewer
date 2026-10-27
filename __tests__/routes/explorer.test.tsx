/**
 * Explorer route — rendered behaviour.
 *
 * The unit tests prove the data rules; this proves the component actually
 * renders them. It follows the repository's route-test convention: the router
 * and scaffold are stubbed, the fetch boundary is mocked, and assertions are
 * made against the DOM a reviewer would see.
 */
import React from 'react';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({ primary }: { primary?: React.ReactNode }) => (
    <div data-testid="scaffold-primary">{primary}</div>
  ),
}));

const apiFetch = vi.fn();
vi.mock('../../src/utils/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...(args as [])),
}));

afterEach(() => {
  cleanup();
  apiFetch.mockReset();
});

import { Route as ExplorerRouteModule } from '../../app/routes/explorer';
const ExplorerComponent = ExplorerRouteModule.options
  .component as React.ComponentType;

interface PageBody {
  view: 'archives' | 'rejected';
  folder: string;
  entries: Array<Record<string, unknown>>;
  folders: string[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function page(overrides: Partial<PageBody> = {}): PageBody {
  return {
    view: 'archives',
    folder: 'archive',
    entries: [],
    folders: [],
    total: 0,
    offset: 0,
    limit: 50,
    hasMore: false,
    ...overrides,
  };
}

const liveEntry = {
  path: 'archive/projects/vaulty/tasks/a.md',
  name: 'a',
  folder: 'archive/projects/vaulty/tasks',
  state: 'live',
  title: 'Task A',
  tags: ['task'],
  status: 'done',
};

const historicalEntry = {
  path: 'archive/projects/vaulty/tasks/gone.md',
  name: 'gone',
  folder: 'archive/projects/vaulty/tasks',
  state: 'historical',
  title: 'chore: prune archives',
  deletedInCommit: 'def4567890abcdef',
  updatedAt: '2026-09-15T10:00:00Z',
};

describe('explorer — folders and entries', () => {
  it('renders folders for navigation', async () => {
    apiFetch.mockResolvedValue(
      jsonResponse(page({ folders: ['archive/legacy', 'archive/projects'] }))
    );
    render(<ExplorerComponent />);

    await waitFor(() => {
      expect(screen.getAllByTestId('explorer-folder')).toHaveLength(2);
    });
  });

  it('renders live entries with a live badge', async () => {
    apiFetch.mockResolvedValue(jsonResponse(page({ entries: [liveEntry], total: 1 })));
    render(<ExplorerComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('explorer-entry')).toBeTruthy();
    });
    const badge = screen.getAllByTestId('explorer-state-badge')[0]!;
    expect(badge.getAttribute('data-state')).toBe('live');
  });

  it('renders an empty state rather than a blank panel', async () => {
    apiFetch.mockResolvedValue(jsonResponse(page()));
    render(<ExplorerComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('explorer-empty')).toBeTruthy();
    });
  });
});

describe('explorer — live vs historical distinction', () => {
  it('marks a deleted record as historical, not live', async () => {
    apiFetch.mockResolvedValue(
      jsonResponse(page({ entries: [historicalEntry], total: 1 }))
    );
    render(<ExplorerComponent />);

    await waitFor(() => {
      const entry = screen.getByTestId('explorer-entry');
      expect(entry.getAttribute('data-state')).toBe('historical');
    });
    const badge = screen.getAllByTestId('explorer-state-badge')[0]!;
    expect(badge.getAttribute('data-state')).toBe('historical');
    expect(badge.textContent?.toLowerCase()).toContain('historical');
  });

  it('does not preview historical content, and says why', async () => {
    apiFetch.mockResolvedValue(
      jsonResponse(page({ entries: [historicalEntry], total: 1 }))
    );
    render(<ExplorerComponent />);

    await waitFor(() => expect(screen.getByTestId('explorer-entry')).toBeTruthy());
    fireEvent.click(screen.getByTestId('explorer-entry'));

    await waitFor(() => {
      expect(screen.getByTestId('explorer-preview-error')).toBeTruthy();
    });
    // It must not have asked the server for bytes it will not show.
    const previewCalls = apiFetch.mock.calls.filter((c) =>
      String(c[0]).includes('/preview')
    );
    expect(previewCalls).toHaveLength(0);
  });
});

describe('explorer — preview safety', () => {
  it('renders markdown as text, never as HTML', async () => {
    apiFetch.mockResolvedValue(jsonResponse(page({ entries: [liveEntry], total: 1 })));
    render(<ExplorerComponent />);
    await waitFor(() => expect(screen.getByTestId('explorer-entry')).toBeTruthy());

    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        view: 'archives',
        path: liveEntry.path,
        state: 'live',
        markdown: '<img src=x onerror=alert(1)>',
        frontmatter: {},
      })
    );
    fireEvent.click(screen.getByTestId('explorer-entry'));

    await waitFor(() => expect(screen.getByTestId('explorer-preview-body')).toBeTruthy());
    const body = screen.getByTestId('explorer-preview-body');
    // The payload appears as literal text; no element was created from it.
    expect(body.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(body.querySelector('img')).toBeNull();
  });
});

describe('explorer — permission denial', () => {
  it('shows a denial message, not an empty list', async () => {
    apiFetch.mockResolvedValue(jsonResponse({ error: 'Forbidden' }, 403));
    render(<ExplorerComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('explorer-denied')).toBeTruthy();
    });
    // An empty-list state would imply "nothing here"; a denial must say so.
    expect(screen.queryByTestId('explorer-empty')).toBeNull();
  });
});

describe('explorer — view switching and filters', () => {
  it('switches to the rejected view', async () => {
    apiFetch.mockResolvedValue(jsonResponse(page()));
    render(<ExplorerComponent />);
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    apiFetch.mockClear();
    fireEvent.click(screen.getByTestId('explorer-tab-rejected'));

    await waitFor(() => {
      const called = apiFetch.mock.calls.some((c) =>
        String(c[0]).includes('/explorer/rejected')
      );
      expect(called).toBe(true);
    });
  });

  it('sends the search term to the API', async () => {
    apiFetch.mockResolvedValue(jsonResponse(page()));
    render(<ExplorerComponent />);
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    apiFetch.mockClear();
    fireEvent.change(screen.getByTestId('explorer-search'), {
      target: { value: 'avatar' },
    });

    await waitFor(() => {
      const called = apiFetch.mock.calls.some((c) =>
        String(c[0]).includes('search=avatar')
      );
      expect(called).toBe(true);
    });
  });

  it('requests history only when the toggle is on', async () => {
    apiFetch.mockResolvedValue(jsonResponse(page()));
    render(<ExplorerComponent />);
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    const firstCall = String(apiFetch.mock.calls[0]?.[0]);
    expect(firstCall).not.toContain('history=true');

    apiFetch.mockClear();
    fireEvent.click(screen.getByTestId('explorer-history-toggle'));

    await waitFor(() => {
      const called = apiFetch.mock.calls.some((c) =>
        String(c[0]).includes('history=true')
      );
      expect(called).toBe(true);
    });
  });
});

describe('explorer — pagination', () => {
  it('disables Previous on the first page', async () => {
    apiFetch.mockResolvedValue(jsonResponse(page({ total: 120, hasMore: true })));
    render(<ExplorerComponent />);

    await waitFor(() => expect(screen.getByTestId('explorer-prev')).toBeTruthy());
    expect(
      (screen.getByTestId('explorer-prev') as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it('advances the offset when Next is pressed', async () => {
    apiFetch.mockResolvedValue(jsonResponse(page({ total: 120, hasMore: true })));
    render(<ExplorerComponent />);
    await waitFor(() => expect(screen.getByTestId('explorer-next')).toBeTruthy());

    apiFetch.mockClear();
    fireEvent.click(screen.getByTestId('explorer-next'));

    await waitFor(() => {
      const called = apiFetch.mock.calls.some((c) => String(c[0]).includes('offset=50'));
      expect(called).toBe(true);
    });
  });

  it('reports the visible range', async () => {
    apiFetch.mockResolvedValue(
      jsonResponse(
        page({ entries: [liveEntry], total: 120, offset: 50, hasMore: true })
      )
    );
    render(<ExplorerComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('explorer-range').textContent).toContain('51');
    });
  });
});


describe('explorer — Vault filesystem view', () => {
  it('fetches unindexed notes from the API and navigates through the directory tree', async () => {
    apiFetch.mockImplementation(async (url: string) => {
      if (url.startsWith('/api/v1/notes?')) {
        return jsonResponse({
          structuredContent: {
            notes: [
              'notes/core/Avatar.md',
              'tasks/pantha/importer.mdx',
              'inbox/extracted/run-1/draft.md',
              'archive/legacy/old.md',
            ],
          },
        });
      }
      if (url.startsWith('/api/v1/notes/')) {
        return jsonResponse({
          structuredContent: {
            content: '<img src=x onerror=alert(1)>',
            frontmatter: { title: 'Importer', type: 'task' },
          },
        });
      }
      return jsonResponse(page());
    });

    render(<ExplorerComponent />);
    fireEvent.click(screen.getByTestId('explorer-tab-vault'));
    await waitFor(() => {
      const folders = screen.getAllByTestId('explorer-folder');
      expect(folders.map((n) => n.textContent).join(' ')).toContain('notes');
      expect(folders.map((n) => n.textContent).join(' ')).toContain('tasks');
      expect(folders.map((n) => n.textContent).join(' ')).not.toContain('archive');
      expect(folders.map((n) => n.textContent).join(' ')).not.toContain('inbox');
    });

    fireEvent.click(screen.getAllByTestId('explorer-folder').find((n) =>
      n.textContent?.includes('tasks')
    )!);
    await waitFor(() => expect(screen.getAllByTestId('explorer-folder')[0]?.textContent).toContain('pantha'));
    fireEvent.click(screen.getAllByTestId('explorer-folder')[0]!);
    await waitFor(() => expect(screen.getByTestId('explorer-entry')).toBeTruthy());
    fireEvent.click(screen.getByTestId('explorer-entry'));
    await waitFor(() => expect(screen.getByTestId('explorer-preview-body')).toBeTruthy());
    expect(screen.getByTestId('explorer-preview-body').querySelector('img')).toBeNull();
    expect(apiFetch.mock.calls.some(([url]) => String(url).includes(
      'tasks%2Fpantha%2Fimporter.mdx'
    ))).toBe(true);
  });

  it('does not show an empty vault on read-scope denial', async () => {
    apiFetch.mockImplementation(async (url: string) =>
      url.startsWith('/api/v1/notes?')
        ? jsonResponse({ error: 'Forbidden' }, 403)
        : jsonResponse(page())
    );
    render(<ExplorerComponent />);
    fireEvent.click(screen.getByTestId('explorer-tab-vault'));
    await waitFor(() => {
      expect(screen.getByTestId('explorer-denied').textContent).toContain('read');
    });
    expect(screen.queryByTestId('explorer-empty')).toBeNull();
  });
});
