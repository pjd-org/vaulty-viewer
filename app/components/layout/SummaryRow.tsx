import React from 'react';
import { TrendingDownIcon } from '@/app/components/ui/trending-down';
import { TrendingUpIcon } from '@/app/components/ui/trending-up';
import { Badge } from '@/app/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';

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
}

export function SummaryRow({ items }: SummaryRowProps) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const hasTrend = item.trend !== undefined && item.trend !== null;
        const isUp = hasTrend && item.trend! >= 0;

        return (
          <Card key={item.label} className="@container/card">
            <CardHeader className="relative pb-2">
              <CardDescription className="text-[10px] font-semibold uppercase tracking-[0.28em]">
                {item.label}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {item.value}
              </CardTitle>
              {hasTrend && (
                <div className="absolute right-4 top-4">
                  <Badge
                    variant="outline"
                    className={
                      isUp
                        ? 'flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'flex items-center gap-1 border-red-200 bg-red-50 text-red-700'
                    }
                  >
                    {isUp ? (
                      <TrendingUpIcon size={12} />
                    ) : (
                      <TrendingDownIcon size={12} />
                    )}
                    {Math.abs(item.trend!)}%
                  </Badge>
                </div>
              )}
              {item.icon && !hasTrend && (
                <div className="absolute right-4 top-4 text-muted-foreground">
                  {item.icon}
                </div>
              )}
            </CardHeader>
            {item.detail && (
              <CardFooter className="flex-col items-start gap-1 pt-0 pb-4 px-6 text-sm">
                <div className="text-xs text-muted-foreground">
                  {item.detail}
                </div>
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
}
