import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const config = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../.lamiliss/lamiliss.config.json'), 'utf8'),
);

describe('Lamiliss project contract', () => {
  it('declares canonical sources, routes, breakpoints, and variant budgets', () => {
    expect(config.visualContract).toBe('DESIGN.md');
    expect(config.tokenSource).toBe('../../packages/ui/tokens.css');
    expect(config.routes.length).toBeGreaterThan(5);
    expect(config.breakpoints).toEqual([390, 768, 1440]);
    expect(config.variantBudgets.button).toBeGreaterThan(0);
  });

  it('keeps policy exceptions explicit and motion conditional', () => {
    expect(config.motion).toBe(false);
    expect(config.policy.rules['horizontal-overflow']).toMatchObject({ enabled: true, level: 'error' });
    expect(config.policy.exceptions).toContain('@vault/ui');
  });
});
