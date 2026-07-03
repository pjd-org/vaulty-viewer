export interface CodPageStyle {
  background: string;
  minHeight: string;
}

export const codPageStyle = (): CodPageStyle => ({
  background: "linear-gradient(135deg, #0a0a0f 0%, #0d0d12 50%, #0f0a14 100%)",
  minHeight: "100vh",
});

// ============================================================================
// Types
// ============================================================================

export type CodStatus = 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN';

export type CodSignalStatus = 'good' | 'warn' | 'bad' | 'unknown';

export interface CodSignal {
  label: string;
  value: number;    // always 0–100 for display
  raw: number | string;
  unit?: string;
  status: CodSignalStatus;
}

export interface CodConstraint {
  label: string;
  value: string;
  active: boolean;  // true = this constraint is currently limiting
}

export interface CodRecommendation {
  title: string;
  description: string;
}

export interface CodDisplayState {
  status: CodStatus;
  recommendation: CodRecommendation;
  signals: CodSignal[];
  constraints: CodConstraint[];
  why: string[];
  maxSprintMin: number;
  canStartSession: boolean;
}

// ============================================================================
// Normalization
// ============================================================================

/**
 * Normalize a raw value to the 0–100 display scale.
 * The API returns energy/stress as 0–100 integers. If a legacy fractional
 * value (e.g. 0.7) is detected, it is converted.
 */
export function normalizeToPercent(raw: number | null | undefined): number {
  if (raw == null) return 0;
  // If the value looks fractional (non-integer, magnitude ≤ 1) treat as 0–1
  if (Math.abs(raw) <= 1 && !Number.isInteger(raw)) {
    return Math.min(100, Math.max(0, raw * 100));
  }
  return Math.min(100, Math.max(0, raw));
}

function signalStatus(
  value: number,
  warnBelow?: number,
  badBelow?: number,
  warnAbove?: number,
  badAbove?: number,
): CodSignalStatus {
  if (badBelow != null && value < badBelow) return 'bad';
  if (warnBelow != null && value < warnBelow) return 'warn';
  if (badAbove != null && value > badAbove) return 'bad';
  if (warnAbove != null && value > warnAbove) return 'warn';
  return 'good';
}

// ============================================================================
// Display adapter
// ============================================================================

interface RawHumanState {
  energy?: number | null;
  stress?: number | null;
  sleepDebt?: number | null;      // hours (0–8)
  focusCapacity?: 'low' | 'med' | 'high' | 'unknown' | null;
  timeAvailableMin?: number | null;
}

/**
 * Convert raw humanState from the API into normalized display signals.
 * Prevents the ×100 rendering bug when API already returns 0–100 integers.
 */
export function normalizeCodSignals(humanState: RawHumanState): CodSignal[] {
  const energy = normalizeToPercent(humanState.energy);
  const stress = normalizeToPercent(humanState.stress);
  const sleepDebt = humanState.sleepDebt ?? 0;
  const restScore = Math.max(0, 100 - sleepDebt * 12.5); // 0h=100%, 8h=0%
  const timeMin = humanState.timeAvailableMin ?? 0;
  const focusCap = humanState.focusCapacity ?? 'unknown';
  const focusValue =
    focusCap === 'high' ? 100 : focusCap === 'med' ? 60 : focusCap === 'low' ? 25 : 0;

  return [
    {
      label: 'Energy',
      value: energy,
      raw: humanState.energy ?? 0,
      unit: '%',
      status: signalStatus(energy, 60, 30),
    },
    {
      label: 'Stress',
      value: stress,
      raw: humanState.stress ?? 0,
      unit: '%',
      status: signalStatus(stress, undefined, undefined, 60, 80),
    },
    {
      label: 'Rest',
      value: restScore,
      raw: sleepDebt,
      unit: '%',
      status: signalStatus(restScore, 50, 25),
    },
    {
      label: 'Focus',
      value: focusValue,
      raw: focusCap,
      status: focusCap === 'high' ? 'good'
            : focusCap === 'med'  ? 'warn'
            : focusCap === 'low'  ? 'bad'
            : 'unknown',
    },
    {
      label: 'Time',
      value: Math.min(100, timeMin / 2.4),  // 240 min → 100 %
      raw: timeMin,
      unit: 'min',
      status: signalStatus(timeMin, 60, 30),
    },
  ];
}

/**
 * Derive hard constraints from current COD state.
 */
export function deriveCodConstraints(
  humanState: RawHumanState,
  status: CodStatus,
): CodConstraint[] {
  const energy = normalizeToPercent(humanState.energy);
  const stress = normalizeToPercent(humanState.stress);
  const focusCap = humanState.focusCapacity ?? 'unknown';

  const now = new Date();
  const hour = now.getHours();
  const isHardStop = hour >= 23 || hour < 5;
  const nearHardStop = !isHardStop && hour >= 22;

  const maxSprintMin = status === 'PASS' ? 60 : status === 'WARN' ? 25 : 0;
  const maxFocusLabel =
    focusCap === 'high' && status === 'PASS' ? 'high'
    : focusCap === 'high' || focusCap === 'med' ? 'medium'
    : 'low';
  const deepWorkAllowed =
    energy >= 70 && stress <= 40 && focusCap === 'high' && status === 'PASS';

  return [
    {
      label: 'Max sprint',
      value: maxSprintMin > 0 ? `${maxSprintMin} min` : 'blocked',
      active: maxSprintMin < 60,
    },
    {
      label: 'Max focus',
      value: maxFocusLabel,
      active: maxFocusLabel !== 'high',
    },
    {
      label: 'Deep work',
      value: deepWorkAllowed ? 'allowed' : 'avoid',
      active: !deepWorkAllowed,
    },
    {
      label: 'Hard stop',
      value: isHardStop ? 'active' : nearHardStop ? '1h warning' : '23:00',
      active: isHardStop || nearHardStop,
    },
  ];
}

/**
 * Derive human-readable recommendation from status + warnings.
 */
export function deriveCodRecommendation(
  status: CodStatus,
  warnings: string[],
): CodRecommendation {
  if (status === 'PASS') {
    return { title: 'Ready to work', description: 'All systems nominal. Start planned session.' };
  }
  if (status === 'FAIL') {
    const isHardStop = warnings.some(w => w.includes('HARD_STOP'));
    if (isHardStop) {
      return { title: 'Hard stop active', description: 'Past 23:00. Rest window enforced.' };
    }
    return {
      title: 'Session blocked',
      description: warnings[0] || 'Blocking condition detected.',
    };
  }
  if (status === 'WARN') {
    const reasons = warnings.slice(0, 2).join(' · ');
    return { title: 'Light sprint only', description: reasons || 'Degraded state detected.' };
  }
  return { title: 'Status unknown', description: 'Check in to update COD state.' };
}

/** Maximum sprint budget in minutes for current status. */
export function getMaxSprintMin(status: CodStatus): number {
  if (status === 'PASS') return 60;
  if (status === 'WARN') return 25;
  return 0;
}
