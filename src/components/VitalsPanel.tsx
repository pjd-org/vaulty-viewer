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
      ? 'bg-red-500'
      : effectiveValue < 60
        ? 'bg-amber-400'
        : 'bg-emerald-400';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${fillColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function VitalsPanel({ vitals }: VitalsPanelProps) {
  return (
    <div className="space-y-3">
      <VitalBar value={vitals.energy ?? 50} label="Energy" />
      <VitalBar value={vitals.stress ?? 50} label="Stress" inverted />
      <VitalBar value={vitals.health ?? 50} label="Health" />
    </div>
  );
}

export default VitalsPanel;
