import { describe, expect, it } from 'vitest';
import { buildInboxSurfacePayload } from '../app/lib/viewer-adapter';

function adapt(signal: Record<string, unknown>) {
  return buildInboxSurfacePayload({
    signals: [signal], runs: [], workbenchNotes: [], archiveNotes: [],
  })[0];
}

const signal = {
  id: 'signal:scheduler-job-nightly',
  title: 'Nightly failed',
  severity: 'high',
  source: 'vault:scheduler',
  route: '/automation',
  whySurfaced: 'Runner failed before a pipeline was recorded.',
  surfacedAt: '2026-10-24T03:00:00.000Z',
  jobId: 'nightly',
  pipelineId: null,
  runId: null,
  trigger: 'schedule',
  status: 'failed',
  failedAt: null,
  observedAt: '2026-10-24T03:00:00.000Z',
  error: 'Runner unavailable',
  errors: [{ message: 'No runner connected' }],
};

describe('runtime signal adapter', () => {
  it('preserves recorded scheduler lifecycle and nullable provenance', () => {
    expect(adapt(signal)).toMatchObject({
      id: signal.id,
      sourceId: 'vault:scheduler',
      surfacedAt: signal.surfacedAt,
      jobId: signal.jobId,
      pipelineId: null,
      runId: null,
      trigger: 'schedule',
      status: 'failed',
      failedAt: null,
      observedAt: signal.observedAt,
      error: signal.error,
      errors: signal.errors,
    });
  });

  it('does not invent COD provenance, confidence, reversibility, or pipeline identity', () => {
    const item = adapt(signal);
    expect(item.surfacedBy).not.toBe('cod');
    expect(item.sourceType).toBe('schedule');
    expect(item.confidence).toBeUndefined();
    expect(item.reversibility).toBeUndefined();
    expect(item.allowedActions.map((action) => action.actionType)).toEqual(['open_source']);
  });

  it('retains critical severity independently of runtime status', () => {
    const item = adapt({ ...signal, severity: 'critical', status: 'running', pipelineId: 'daily', runId: 'run-9' });
    expect(item.severity).toBe('critical');
    expect(item).toMatchObject({ status: 'running', pipelineId: 'daily', runId: 'run-9' });
  });
});
