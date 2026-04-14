import React from 'react';
import { TrendingDownIcon } from '@/app/components/ui/trending-down';
import { TrendingUpIcon } from '@/app/components/ui/trending-up';

export interface SummaryRowItem {
  label: string;
  value: string;
  detail?: string;
  /** Optional trend: positive numbers show green ↑ badge, negative show red ↓ badge */
  trend?: number;
  /** Optional Lucide icon rendered in the card header */
  icon?: React.ReactNode;
}

interface SummaryRowProps {
  items: readonly SummaryRowItem[];
  /** Override the up-trend badge accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

export function SummaryRow({ items, accentColor }: SummaryRowProps) {
  const accent = accentColor ?? 'var(--a-mint)';
  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const hasTrend = item.trend !== undefined && item.trend !== null;
        const isUp = hasTrend && item.trend! >= 0;

        return (
          <div
            key={item.label}
            className="genie-card @container/card relative"
            style={{ containerType: 'inline-size' }}
          >
            {/* Trend badge */}
            {hasTrend && (
              <div className="absolute right-4 top-4">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={
                    isUp
                      ? {
                          background: `color-mix(in srgb, ${accent} 30%, transparent)`,
                          color: 'var(--text-primary)',
                          border: `1px solid color-mix(in srgb, ${accent} 50%, transparent)`,
                        }
                      : {
                          background:
                            'color-mix(in srgb, var(--a-rose) 25%, transparent)',
                          color: 'var(--text-primary)',
                          border:
                            '1px solid color-mix(in srgb, var(--a-rose) 40%, transparent)',
                        }
                  }
                >
                  {isUp ? (
                    <TrendingUpIcon size={12} />
                  ) : (
                    <TrendingDownIcon size={12} />
                  )}
                  {Math.abs(item.trend!)}%
                </span>
              </div>
            )}
            {/* Icon (when no trend) */}
            {item.icon && !hasTrend && (
              <div
                className="absolute right-4 top-4"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {item.icon}
              </div>
            )}
            {/* Label */}
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {item.label}
            </p>
            {/* Value */}
            <p
              className="text-2xl font-semibold tabular-nums mt-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {item.value}
            </p>
            {/* Detail */}
            {item.detail && (
              <p
                className="text-xs mt-2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {item.detail}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
