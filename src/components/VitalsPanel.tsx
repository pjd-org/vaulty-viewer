import React from 'react';

interface Vitals {
  health?: number;
  energy?: number;
  stress?: number;
}

interface VitalsPanelProps {
  vitals: Vitals;
}

interface VitalBarProps {
  value: number;
  label: string;
  inverted?: boolean;
}

function VitalBar({ value, label, inverted = false }: VitalBarProps) {
  const effectiveValue = inverted ? 100 - value : value;
  const fillColor =
    effectiveValue < 40
      ? 'var(--a-rose)'
      : effectiveValue < 60
        ? 'var(--a-sun)'
        : 'var(--a-mint)';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
        <span
          className="tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: fillColor }}
        />
      </div>
    </div>
  );
}

export function VitalsPanel({ vitals }: VitalsPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <VitalBar value={vitals.energy ?? 50} label="Energy" />
      <VitalBar value={vitals.stress ?? 50} label="Stress" inverted />
      <VitalBar value={vitals.health ?? 50} label="Health" />
    </div>
  );
}

export default VitalsPanel;
