import React from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/src/lib/utils';
import { Card, CardContent } from '../ui/card';
import { MetaRow } from '../ui';
import type { ReadinessState } from '../../../src/lib/readiness-logic';

interface ReadinessCardProps {
  readiness: ReadinessState;
  capacityLabel: string;
  timeBudgetLabel: string | null;
}

export function ReadinessCard({
  readiness,
  capacityLabel,
  timeBudgetLabel,
}: ReadinessCardProps) {
  const metaItems = [
    ...(timeBudgetLabel ? [{ label: timeBudgetLabel }] : []),
    { label: capacityLabel },
  ];

  return (
    <div className="p-[3px] border-[0.5px] rounded-[14px] border-border">
      <Card
        className={cn(
          'border-[1.5px] bg-gradient-to-br rounded-[12px] shadow-none',
          'from-background to-muted/60 shadow-[2px_0_8px_rgba(0,0,0,0.15)]'
        )}
      >
        <CardContent className="p-6">
          <div
            className="inline-flex items-center gap-2 mb-1"
            style={{ color: readiness.color }}
          >
            <span className="text-xl font-semibold">{readiness.label}</span>
          </div>
          <p className="text-sm text-neutral-500 mt-1 mb-5">
            {readiness.description}
          </p>

          {metaItems.length > 0 && (
            <MetaRow items={metaItems} className="mb-5" />
          )}

          <Link
            to="/"
            className="inline-flex bg-[#4f8cff] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#3d7de8] transition-colors"
          >
            Start {readiness.sessionType} session
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
