import { describe, expect, it } from 'vitest';
import { LamilissEscalationController } from '../../src/lib/lamiliss/escalation';

describe('LamilissEscalationController', () => {
  it('retries once and escalates after the second complete failure on one gate', () => {
    const controller = new LamilissEscalationController();
    expect(controller.recordFailure('runtime')).toBe('retry');
    expect(controller.recordFailure('runtime')).toBe('escalate');
    expect(controller.state).toEqual({ gate: 'runtime', attempts: 2 });
  });

  it('starts a fresh loop when a different gate fails', () => {
    const controller = new LamilissEscalationController();
    expect(controller.recordFailure('runtime')).toBe('retry');
    expect(controller.recordFailure('accessibility')).toBe('retry');
    expect(controller.state).toEqual({ gate: 'accessibility', attempts: 1 });
  });

  it('resets state explicitly after a successful repair', () => {
    const controller = new LamilissEscalationController();
    controller.recordFailure('system-drift');
    controller.reset();
    expect(controller.state).toEqual({ gate: null, attempts: 0 });
  });
});
