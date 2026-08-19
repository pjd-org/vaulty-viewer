import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const VIEWER_ROOT = new URL('../../', import.meta.url).pathname;
const RUNNER = 'scripts/release-verification/run-matrix.mjs';

describe('Viewer V3 release verification runner', () => {
  it('prints the canonical 168-case plan', () => {
    const result = spawnSync(process.execPath, [RUNNER, '--print-plan'], {
      cwd: VIEWER_ROOT,
      encoding: 'utf8',
    });

    expect(result.status, result.stderr).toBe(0);
    const plan = JSON.parse(result.stdout);
    expect(plan.routes).toBe(28);
    expect(plan.cases).toBe(168);
    expect(plan.viewports).toEqual(['390x844', '768x1024', '1440x900']);
    expect(plan.themes).toEqual(['light', 'dark']);
    expect(plan.health).toEqual({ path: '/health', urlPath: '/_viewer/health' });
    expect(plan.pinnedCommits).toEqual({
      superRepo: 'fb65cd0db4c9a3daa1444f5c9bcbf9068fc5537b',
      viewer: '482db8c2207aa0d1bace3d7443ec2f71ec214c81',
      api: 'e87ecd52e57985629cc3d4247bdf1042a685c056',
      proxy: 'de0cd6c87f5e1698434a17ddd7e028053a229200',
    });
    expect(plan.excludedFromGate).toEqual([{
      path: '/config',
      reason: 'Proxy owns /config/ for the Config control plane; the Viewer UI route is unreachable through the canonical release proxy.',
    }]);
  });
});
