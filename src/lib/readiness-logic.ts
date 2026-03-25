/**
 * readiness-logic.ts — pure functions for operating-state derivation.
 * No API calls. No side effects.
 */

export type ReadinessLevel = 'deep' | 'medium' | 'shallow' | 'recover';

export interface ReadinessState {
  level: ReadinessLevel;
  label: string;
  description: string;
  color: string;
  sessionType: string;
  maxFocusCost: number | undefined;
  maxEffortScore: number | undefined;
}

export interface VitalsInput {
  energy?: number;
  stress?: number;
  health?: number;
}

export interface CapacityInput {
  focusCostMax?: number;
  effortScoreMax?: number;
  timeBudgetMin?: number;
}

export function deriveReadiness(
  vitals: VitalsInput,
  capacity: CapacityInput
): ReadinessState {
  const energy = vitals.energy ?? 50;
  const stress = vitals.stress ?? 50;
  const focus = capacity.focusCostMax || undefined;
  const effort = capacity.effortScoreMax || undefined;

  if (energy >= 70 && stress <= 35) {
    return {
      level: 'deep',
      label: 'Deep work window',
      description: 'Good for focused, high-effort execution.',
      color: 'var(--readiness-deep)',
      sessionType: 'deep',
      maxFocusCost: focus,
      maxEffortScore: effort,
    };
  }
  if (energy >= 50 && stress <= 60) {
    return {
      level: 'medium',
      label: 'Sustained execution',
      description: 'Medium-focus tasks. Avoid switching costs.',
      color: 'var(--readiness-medium)',
      sessionType: 'steady',
      maxFocusCost: focus !== undefined ? Math.min(focus, 6) : undefined,
      maxEffortScore: effort !== undefined ? Math.min(effort, 6) : undefined,
    };
  }
  if (energy >= 30 || stress <= 70) {
    return {
      level: 'shallow',
      label: 'Light task mode',
      description: 'Prefer short, low-friction tasks. Avoid deep work.',
      color: 'var(--readiness-shallow)',
      sessionType: 'light',
      maxFocusCost: focus !== undefined ? Math.min(focus, 4) : 4,
      maxEffortScore: effort !== undefined ? Math.min(effort, 4) : 4,
    };
  }
  return {
    level: 'recover',
    label: 'Recovery mode',
    description: 'Low energy and high stress. Minimal execution recommended.',
    color: 'var(--readiness-recover)',
    sessionType: 'minimal',
    maxFocusCost: 2,
    maxEffortScore: 2,
  };
}

export function formatTimeBudget(min: number | undefined): string {
  if (!min || min <= 0) return '';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function isMetricReal(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') return value.trim().length > 0 && value !== '—';
  return false;
}

export function isStale(updated: string | null | undefined): boolean {
  if (!updated) return true;
  const ms = Date.now() - Date.parse(updated);
  return ms > 2 * 60 * 60 * 1000;
}

export function deriveCapacityGuidance(capacity: CapacityInput): string {
  const time = capacity.timeBudgetMin ?? 0;
  const focus = capacity.focusCostMax ?? 0;
  const effort = capacity.effortScoreMax ?? 0;
  if (time > 0 && time < 30) return 'Short window — quick tasks only.';
  if (focus <= 3 && effort <= 3) return 'Low capacity — prefer minimal tasks.';
  if (focus >= 7 && effort >= 7) return 'High capacity — deep session is viable.';
  if (focus > 0 || effort > 0) return 'Moderate capacity — balanced execution.';
  return '';
}
