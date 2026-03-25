import { describe, it, expect } from 'vitest';
import { toTaskDisplayMeta, toProjectSummaryDisplay } from '../../app/lib/display';

describe('display helpers', () => {
  it('maps task fields correctly', () => {
    const task = { id: 't1', title: 'Do thing', estimatedMinutes: 45, focusCost: 8, bestMove: 'Start' };
    const out = toTaskDisplayMeta(task);
    expect(out.id).toBe('t1');
    expect(out.title).toBe('Do thing');
    expect(out.estimatedMinutes).toBe(45);
    expect(out.focusCost).toBe('Deep');
    expect(out.bestMove).toBe('Start');
  });

  it('maps project fields correctly', () => {
    const p = { id: 'p1', title: 'Project X', status: 'active', progress: 42, bestMove: 'Ship' };
    const out = toProjectSummaryDisplay(p);
    expect(out.id).toBe('p1');
    expect(out.title).toBe('Project X');
    expect(out.statusVariant).toBe('active');
    expect(out.progressPercent).toBe(42);
    expect(out.bestMoveTitle).toBe('Ship');
  });
});
