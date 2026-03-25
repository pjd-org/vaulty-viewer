import React from "react";

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
  let color = "success";
  if (effectiveValue < 40) color = "danger";
  else if (effectiveValue < 60) color = "warning";

  return (
    <div className="avatar-vital">
      <div className="avatar-vital__header">
        <span className="avatar-vital__label">{label}</span>
        <span className="avatar-vital__value">{value}%</span>
      </div>
      <div className="avatar-vital__track">
        <div
          className={`avatar-vital__fill avatar-vital__fill--${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function VitalsPanel({ vitals }: VitalsPanelProps) {
  return (
    <div className="vitals-group">
      <VitalBar value={vitals.energy ?? 50} label="Energy" />
      <VitalBar value={vitals.stress ?? 50} label="Stress" inverted />
      <VitalBar value={vitals.health ?? 50} label="Health" />
    </div>
  );
}

export default VitalsPanel;
