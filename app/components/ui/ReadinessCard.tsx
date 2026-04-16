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
      <div className="genie-card rounded-[12px] bg-gradient-to-br from-[var(--surf-base)] to-[var(--surf-utility)] shadow-[2px_0_8px_rgba(0,0,0,0.15)] p-6">
        <div
          className="inline-flex items-center gap-2 mb-1"
          style={{ color: readiness.color }}
        >
          <span className="text-xl font-semibold">{readiness.label}</span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1 mb-5">
          {readiness.description}
        </p>

        {metaItems.length > 0 && <MetaRow items={metaItems} className="mb-5" />}

        <Link
          to="/"
          className="inline-flex text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ background: accent }}
        >
          Start {readiness.sessionType} session
        </Link>
      </div>
    </div>
  );
}
