import React from 'react';
import { Link } from '@tanstack/react-router';
import { MetaRow } from './Labels';
import type { ReadinessState } from '../../../src/lib/readiness-logic';

interface ReadinessCardProps {
  readiness: ReadinessState;
  capacityLabel: string;
  timeBudgetLabel: string | null;
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

export function ReadinessCard({
  readiness,
  capacityLabel,
  timeBudgetLabel,
  accentColor,
}: ReadinessCardProps) {
  const accent = accentColor ?? 'var(--color-primary)';
  const metaItems = [
    ...(timeBudgetLabel ? [{ label: timeBudgetLabel }] : []),
    { label: capacityLabel },
  ];

  return (
    <div className="p-[3px] border-[0.5px] rounded-[14px] border-[var(--border-glass)]">
      <div className="genie-card rounded-[12px] bg-gradient-to-br from-[var(--surf-base)] to-[var(--surf-utility)] p-6">
        <div className="mb-1 inline-flex items-center gap-2" style={{ color: readiness.color }}>
          <span className="text-xl font-semibold">{readiness.label}</span>
        </div>
        <p className="mt-1 mb-5 text-sm text-[var(--text-secondary)] leading-relaxed">
          {readiness.description}
        </p>

        {metaItems.length > 0 && <MetaRow items={metaItems} className="mb-5" />}

        <Link
          to="/"
          className="inline-flex rounded-xl px-4 py-2 text-sm font-medium text-[var(--n-0)] transition-opacity hover:opacity-90"
          style={{ background: accent }}
        >
          Start {readiness.sessionType} session
        </Link>
      </div>
    </div>
  );
}
