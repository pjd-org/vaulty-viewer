import React from 'react';
import { GlassBadge } from '@vault/ui';

const VARIANT_TONES = {
  clear: 'mint',
  warn: 'sun',
  rest: 'neutral',
  stop: 'rose',
  unknown: 'neutral',
} as const;

interface CodSeverityPillProps {
  variant: keyof typeof VARIANT_TONES;
  label: string;
}

export function CodSeverityPill({ variant, label }: CodSeverityPillProps) {
  return (
    <GlassBadge
      tone={VARIANT_TONES[variant]}
      dot
      size="md"
      glow={variant === 'clear' || variant === 'warn' || variant === 'stop'}
      className="px-3 py-1.5 text-sm font-semibold"
    >
      {label}
    </GlassBadge>
  );
}
