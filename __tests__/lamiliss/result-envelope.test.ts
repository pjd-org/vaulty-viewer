import { describe, expect, it } from 'vitest';
import { parseLamilissEnvelope } from '../../src/lib/lamiliss/result-envelope';

const validEnvelope = {
  status: 'pass' as const,
  mode: 'inspect' as const,
  scope: { routes: ['/'], components: ['button'], files: [] },
  contractSources: ['DESIGN.md'],
  changedFiles: [],
  checks: [{ name: 'runtime', status: 'pass' as const, command: 'playwright', evidence: ['page loaded'], notes: '' }],
  screenshots: ['shots/390.png'],
  visualRegressions: [],
  accessibilityFindings: [],
  performanceFindings: [],
  systemDrift: [],
  unverified: [],
  escalation: null,
};

describe('Lamiliss result envelope', () => {
  it('accepts a complete pass envelope without coercion', () => {
    expect(parseLamilissEnvelope(validEnvelope)).toEqual(validEnvelope);
  });

  it('rejects unknown fields and invalid status values', () => {
    expect(() => parseLamilissEnvelope({ ...validEnvelope, status: 'PASS', extra: true })).toThrow();
  });

  it('requires escalation details for escalation status', () => {
    expect(() => parseLamilissEnvelope({ ...validEnvelope, status: 'escalate' })).toThrow();
  });
});
