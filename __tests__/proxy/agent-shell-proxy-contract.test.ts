import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function getProxyTemplate(): string {
  const cwd = process.cwd();
  const repoRoot = cwd.endsWith('/apps/viewer') ? resolve(cwd, '../..') : cwd;
  const templatePath = resolve(repoRoot, 'apps/proxy/nginx.conf.template');
  return readFileSync(templatePath, 'utf8');
}

describe('proxy contract for agent-shell run endpoints', () => {
  it('routes /api/agent-shell/run/* to viewer before generic /api routing', () => {
    const template = getProxyTemplate();
    const agentShellIdx = template.indexOf('location ^~ /api/agent-shell/run/');
    const genericApiIdx = template.indexOf('location /api/');

    expect(agentShellIdx).toBeGreaterThanOrEqual(0);
    expect(genericApiIdx).toBeGreaterThanOrEqual(0);
    expect(agentShellIdx).toBeLessThan(genericApiIdx);

    const block = template.slice(agentShellIdx, genericApiIdx);
    expect(block).toContain('auth_request /_auth_verify_api;');
    expect(block).toContain('error_page 401 = @api_unauthorized;');
    expect(block).toContain('proxy_pass http://viewer;');
  });
});
