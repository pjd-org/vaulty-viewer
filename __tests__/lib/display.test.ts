import { describe, it, expect } from 'vitest';
import { toTaskDisplayMeta, toProjectSummaryDisplay } from '../../app/lib/display';

describe('display helpers', () => {
  it('maps task fields correctly', () => {
    const task = { estimatedTimeMin: 45, focusCost: 8, effortScore: 5, score: 1.6, status: 'in-progress' };
    const out = toTaskDisplayMeta(task);
    expect(out.durationLabel).toBeTruthy();
    expect(out.focusLabel).toBe('Deep focus');
    expect(out.scoreLabel).toBe('Best fit');
    expect(out.effortLabel).toBe('Heavy');
    expect(out.statusLabel).toBe('In progress');
  });

  it('maps project fields correctly', () => {
    const p = { title: 'Project X', status: 'active', taskCount: 10, completedTaskCount: 4, nextAction: { title: 'Ship' } };
    const out = toProjectSummaryDisplay(p);
    expect(out.title).toBe('Project X');
    expect(out.statusVariant).toBe('success');
    expect(out.progressPercent).toBe(40);
    expect(out.bestMoveTitle).toBe('Ship');
  });
});
