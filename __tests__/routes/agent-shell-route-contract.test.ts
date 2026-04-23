import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function loadAgentShellRouteSource(): string {
  const cwd = process.cwd();
  const viewerRoot = cwd.endsWith('/apps/viewer')
    ? cwd
    : resolve(cwd, 'apps/viewer');
  return readFileSync(resolve(viewerRoot, 'app/routes/agent-shell.tsx'), 'utf8');
}

describe('agent-shell route hydration contract', () => {
  it('avoids Date.now() thread fallback in render path and redirects after mount', () => {
    const source = loadAgentShellRouteSource();

    expect(source).not.toContain('threadId ?? `da-${Date.now()}`');
    expect(source).toContain('if (threadId) return;');
    expect(source).toContain('replace: true');
    expect(source).toContain('Preparing chat thread...');
  });

  it('keeps hook order deterministic before threadId early return', () => {
    const source = loadAgentShellRouteSource();
    const useMemoIndex = source.indexOf('const store = React.useMemo');
    const earlyReturnIndex = source.indexOf('if (!threadId) {');

    expect(useMemoIndex).toBeGreaterThanOrEqual(0);
    expect(earlyReturnIndex).toBeGreaterThanOrEqual(0);
    expect(useMemoIndex).toBeLessThan(earlyReturnIndex);
  });
});
