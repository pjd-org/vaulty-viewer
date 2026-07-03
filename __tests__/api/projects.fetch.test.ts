import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchProjects,
  fetchProjectById,
  getProjectQueryOptions,
} from '../../app/lib/api/projects';
import { UnauthenticatedError } from '../../src/utils/api';

const originalEnv = { ...process.env };
const originalWindow = globalThis.window;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete globalThis.window;
});

afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.window = originalWindow;
  globalThis.fetch = originalFetch;
});

describe('projects API client', () => {
  const fake = [
    { id: 'p1', title: 'A', status: 'active', completedTaskCount: 2, taskCount: 5, nextAction: { title: 'Do it' } },
  ];

  it('fetchProjects maps backend response', async () => {
    const mockRes = { projects: fake };
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockRes) } as any));
    const out = await fetchProjects();
    expect(out.length).toBe(1);
    expect(out[0].id).toBe('p1');
    expect(out[0].progressPercent).toBe(Math.round((2 / 5) * 100));
    expect(out[0].bestMoveTitle).toBe('Do it');
  });

  it('fetchProjects throws UnauthenticatedError on 401', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) } as any)
    );

    await expect(fetchProjects()).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('fetchProjectById finds by id', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ projects: fake }) } as any));
    const p = await fetchProjectById('p1');
    expect(p).not.toBeNull();
    expect(p!.id).toBe('p1');
  });

  it('exposes a stable query key for project preloading', () => {
    expect(getProjectQueryOptions('p1').queryKey).toEqual(['project', 'p1']);
  });

  it('uses the configured server API base for SSR fetches', async () => {
    delete process.env.VAULT_API_URL;
    process.env.API_PROXY_URL = 'http://127.0.0.1:4300';
    delete process.env.VIEWER_INTERNAL_APP_API_KEY;
    delete process.env.AUTH_MCP_API_KEY;

    const mockFetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ projects: fake }) } as any)
    );
    global.fetch = mockFetch as typeof fetch;

    await fetchProjects();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]?.[0]).toBe('http://127.0.0.1:4300/api/v1/projects');
  });

  it('filters template/archive placeholders from projects response', async () => {
    const payload = {
      projects: [
        { id: '{{id}}', title: '{{title}}', path: '_system/templates/projects/project-template.md', status: 'active' },
        { id: 'real', title: 'Real Project', path: 'notes/projects/real/real.md', status: 'paused' },
        { id: 'archived', title: 'Archived', path: 'archive/legacy/old-project.md', status: 'active' },
      ],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(payload) } as any)
    );

    const out = await fetchProjects();
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('real');
    expect(out[0].title).toBe('Real Project');
    expect(out[0].statusVariant).toBe('warning');
  });
});
