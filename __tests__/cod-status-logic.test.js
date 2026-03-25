import { describe, expect, it } from 'vitest';
import {
  codPageStyle,
  normalizeToPercent,
  normalizeCodSignals,
  deriveCodConstraints,
  deriveCodRecommendation,
  getMaxSprintMin,
} from '../src/lib/cod-status-logic.js';

describe('codPageStyle', () => {
  it('returns gradient background and full height', () => {
    const style = codPageStyle();
    expect(style.background).toContain('linear-gradient');
    expect(style.minHeight).toBe('100vh');
  });
});

describe('normalizeToPercent', () => {
  it('returns 0-100 integers unchanged', () => {
    expect(normalizeToPercent(70)).toBe(70);
    expect(normalizeToPercent(0)).toBe(0);
    expect(normalizeToPercent(100)).toBe(100);
  });

  it('converts fractional values to percent', () => {
    expect(normalizeToPercent(0.7)).toBe(70);
    expect(normalizeToPercent(0.4)).toBe(40);
  });

  it('clamps out-of-range values', () => {
    expect(normalizeToPercent(150)).toBe(100);
    expect(normalizeToPercent(-10)).toBe(0);
  });

  it('handles null/undefined as 0', () => {
    expect(normalizeToPercent(null)).toBe(0);
    expect(normalizeToPercent(undefined)).toBe(0);
  });
});

describe('normalizeCodSignals', () => {
  const state = {
    energy: 70,
    stress: 30,
    sleepDebt: 1,
    focusCapacity: 'high',
    timeAvailableMin: 120,
  };

  it('returns 5 signals', () => {
    const signals = normalizeCodSignals(state);
    expect(signals).toHaveLength(5);
  });

  it('does not multiply energy by 100 (no 7000% bug)', () => {
    const signals = normalizeCodSignals(state);
    const energy = signals.find(s => s.label === 'Energy');
    expect(energy?.value).toBe(70);
    expect(energy?.value).toBeLessThanOrEqual(100);
  });

  it('marks high energy as good', () => {
    const signals = normalizeCodSignals(state);
    expect(signals.find(s => s.label === 'Energy')?.status).toBe('good');
  });

  it('marks low stress as good', () => {
    const signals = normalizeCodSignals(state);
    expect(signals.find(s => s.label === 'Stress')?.status).toBe('good');
  });

  it('marks high stress as bad', () => {
    const signals = normalizeCodSignals({ ...state, stress: 90 });
    expect(signals.find(s => s.label === 'Stress')?.status).toBe('bad');
  });

  it('marks low energy as bad', () => {
    const signals = normalizeCodSignals({ ...state, energy: 15 });
    expect(signals.find(s => s.label === 'Energy')?.status).toBe('bad');
  });
});

describe('deriveCodConstraints', () => {
  it('returns 4 constraints', () => {
    const c = deriveCodConstraints({ energy: 70, stress: 30, focusCapacity: 'high' }, 'PASS');
    expect(c).toHaveLength(4);
  });

  it('blocks sprint when status is FAIL', () => {
    const c = deriveCodConstraints({ energy: 10, stress: 90, focusCapacity: 'low' }, 'FAIL');
    const sprint = c.find(x => x.label === 'Max sprint');
    expect(sprint?.value).toBe('blocked');
    expect(sprint?.active).toBe(true);
  });

  it('limits sprint to 25m when status is WARN', () => {
    const c = deriveCodConstraints({ energy: 50, stress: 60, focusCapacity: 'med' }, 'WARN');
    const sprint = c.find(x => x.label === 'Max sprint');
    expect(sprint?.value).toBe('25 min');
  });
});

describe('deriveCodRecommendation', () => {
  it('returns ready message for PASS', () => {
    const r = deriveCodRecommendation('PASS', []);
    expect(r.title).toBe('Ready to work');
  });

  it('returns light sprint for WARN', () => {
    const r = deriveCodRecommendation('WARN', ['High stress (75%)']);
    expect(r.title).toBe('Light sprint only');
    expect(r.description).toContain('High stress');
  });

  it('returns blocked message for FAIL', () => {
    const r = deriveCodRecommendation('FAIL', ['HARD_STOP window active']);
    expect(r.title).toBe('Hard stop active');
  });

  it('returns unknown message for UNKNOWN', () => {
    const r = deriveCodRecommendation('UNKNOWN', []);
    expect(r.title).toBe('Status unknown');
  });
});

describe('getMaxSprintMin', () => {
  it('returns 60 for PASS', () => expect(getMaxSprintMin('PASS')).toBe(60));
  it('returns 25 for WARN', () => expect(getMaxSprintMin('WARN')).toBe(25));
  it('returns 0 for FAIL', () => expect(getMaxSprintMin('FAIL')).toBe(0));
});
