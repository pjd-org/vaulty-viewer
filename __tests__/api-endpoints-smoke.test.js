import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REQUIRED_ENDPOINT_FRAGMENTS = [
  '/api/v1/notes',
  '/api/v1/tasks?status=all',
  '/api/v1/tasks',
  '/api/v1/tasks/${encodeURIComponent(task.path)}/status',
  '/api/v1/notes/${encodedPath}',
  '/api/v1/tasks/${encodedPath}',
  '/api/v1/tools/obsidian_update_task/execute',
  '/api/v1/cod/avatar',
  '/api/v1/sessions/stats',
  '/api/v1/cod/status',
  '/api/v1/cod/human-state',
  '/api/v1/cod/session/start',
  '/api/v1/cod/session/end',
  '/api/v1/inbox',
  '/api/v1/inbox/${encodeURIComponent(runId)}/commit',
  '/api/v1/inbox/${encodeURIComponent(runId)}',
];

const SOURCE_FILES = [
  'app/routes/index.tsx',
  'app/routes/kanban.tsx',
  'app/routes/note.tsx',
  'src/components/GoalCard.tsx',
  'src/hooks/useGoals.js',
  'src/hooks/useAvatar.js',
  'src/hooks/useCODStatus.js',
  'src/hooks/useInbox.js',
];

function loadViewerSource() {
  const cwd = process.cwd();
  const viewerRoot = cwd.endsWith('/apps/viewer')
    ? cwd
    : resolve(cwd, 'apps/viewer');

  return SOURCE_FILES.map((file) =>
    readFileSync(resolve(viewerRoot, file), 'utf8')
  ).join('\n');
}

describe('viewer API endpoint smoke contract', () => {
  it('keeps required endpoint wiring in TanStack routes/hooks', () => {
    const source = loadViewerSource();
    for (const fragment of REQUIRED_ENDPOINT_FRAGMENTS) {
      expect(source).toContain(fragment);
    }
  });

  it('maintains at least 17 /api/v1 callsites for P0 smoke coverage', () => {
    const source = loadViewerSource();
    const matches = source.match(/\/api\/v1\/[^\s"'`)]*/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(17);
  });
});
