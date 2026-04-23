import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function loadServerNodeSource(): string {
  const cwd = process.cwd();
  const viewerRoot = cwd.endsWith('/apps/viewer')
    ? cwd
    : resolve(cwd, 'apps/viewer');
  return readFileSync(resolve(viewerRoot, 'app/server-node.mjs'), 'utf8');
}

describe('viewer server-node API routing contract', () => {
  it('keeps agent-shell run endpoints in viewer SSR instead of API proxy', () => {
    const source = loadServerNodeSource();

    expect(source).toContain("../dist/server/ssr.js");
    expect(source).toContain("typeof app === 'function'");
    expect(source).toContain("typeof app?.fetch === 'function'");
    expect(source).toContain('response = await appHandler(request);');
    expect(source).toContain("const VIEWER_API_PREFIXES = ['/api/agent-shell/run/'];");
    expect(source).toContain('const isViewerOwnedApi = VIEWER_API_PREFIXES.some');
    expect(source).toContain("if (req.url?.startsWith('/api/') && !isViewerOwnedApi)");
  });
});
