import React from 'react';

const VARIANT_STYLES = {
  clear: {
    container: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  warn: {
    container: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  rest: {
    container: 'bg-white/70 text-slate-700 border-slate-300/70',
    dot: 'bg-slate-500',
  },
  stop: {
    container: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
  },
  unknown: {
    container: 'bg-white/8 text-slate-400 border-white/10',
    dot: 'bg-slate-500',
  },
} as const;

interface CodSeverityPillProps {
  variant: keyof typeof VARIANT_STYLES;
  label: string;
}

export function CodSeverityPill({ variant, label }: CodSeverityPillProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${styles.container}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${styles.dot}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
