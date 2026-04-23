import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function loadViteConfigSource(): string {
  const cwd = process.cwd();
  const viewerRoot = cwd.endsWith('/apps/viewer')
    ? cwd
    : resolve(cwd, 'apps/viewer');
  return readFileSync(resolve(viewerRoot, 'vite.config.ts'), 'utf8');
}

describe('vite TanStack Start entry contract', () => {
  it('points client/server entries at top-level app directory', () => {
    const source = loadViteConfigSource();

    expect(source).toContain("client: { entry: '../app/client.tsx' }");
    expect(source).toContain("server: { entry: '../app/ssr.tsx' }");
  });
});
