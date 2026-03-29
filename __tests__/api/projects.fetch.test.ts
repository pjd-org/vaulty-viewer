import { describe, it, expect, vi } from 'vitest';
import { fetchProjects, fetchProjectById } from '../../app/lib/api/projects';

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

  it('fetchProjectById finds by id', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ projects: fake }) } as any));
    const p = await fetchProjectById('p1');
    expect(p).not.toBeNull();
    expect(p!.id).toBe('p1');
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
