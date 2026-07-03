import React from 'react';

type ColSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type RowSpan = 1 | 2 | 3 | 4 | 5 | 6;

interface CardGridProps {
  cols?: number;
  gap?: number;
  children: React.ReactNode;
}

const GAP_CLASS: Record<number, string> = {
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
};

export function CardGrid({ cols = 12, gap = 6, children }: CardGridProps) {
  const colClass = cols === 12 ? 'grid-cols-12' : `grid-cols-${cols}`;
  const gapClass = GAP_CLASS[gap] ?? 'gap-6';
  return <div className={`grid ${colClass} ${gapClass}`}>{children}</div>;
}

interface GridColProps {
  span: ColSpan;
  md?: ColSpan;
  lg?: ColSpan;
  xl?: ColSpan;
  children: React.ReactNode;
}

const SPAN_CLASS: Record<ColSpan, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

const MD_SPAN_CLASS: Record<ColSpan, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

const LG_SPAN_CLASS: Record<ColSpan, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
};

const XL_SPAN_CLASS: Record<ColSpan, string> = {
  1: 'xl:col-span-1',
  2: 'xl:col-span-2',
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  5: 'xl:col-span-5',
  6: 'xl:col-span-6',
  7: 'xl:col-span-7',
  8: 'xl:col-span-8',
  9: 'xl:col-span-9',
  10: 'xl:col-span-10',
  11: 'xl:col-span-11',
  12: 'xl:col-span-12',
};

export function GridCol({ span, md, lg, xl, children }: GridColProps) {
  const classes = [
    SPAN_CLASS[span],
    md ? MD_SPAN_CLASS[md] : '',
    lg ? LG_SPAN_CLASS[lg] : '',
    xl ? XL_SPAN_CLASS[xl] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}

// ─── BentoGrid ────────────────────────────────────────────────────────────────
// A 12-column CSS Grid container where cells can span both columns AND rows,
// enabling asymmetric bento-style layouts.

interface BentoGridProps {
  /** Number of columns (default: 12). */
  cols?: number;
  /** Gap between cells (default: 4). */
  gap?: number;
  /** Minimum row height in px (default: 120). Each row-span unit adds this height. */
  rowHeight?: number;
  className?: string;
  children: React.ReactNode;
}

export function BentoGrid({
  cols = 12,
  gap = 4,
  rowHeight = 120,
  className = '',
  children,
}: BentoGridProps) {
  const gapClass = GAP_CLASS[gap] ?? 'gap-4';
  const colClass = cols === 12 ? 'grid-cols-12' : `grid-cols-${cols}`;
  return (
    <div
      className={`grid ${colClass} ${gapClass} ${className}`}
      style={{ gridAutoRows: `${rowHeight}px` }}
    >
      {children}
    </div>
  );
}

// ─── BentoCell ────────────────────────────────────────────────────────────────
// A cell inside BentoGrid. Accepts both col-span and row-span at every breakpoint.

const ROW_SPAN_CLASS: Record<RowSpan, string> = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
  4: 'row-span-4',
  5: 'row-span-5',
  6: 'row-span-6',
};
const MD_ROW_SPAN_CLASS: Record<RowSpan, string> = {
  1: 'md:row-span-1',
  2: 'md:row-span-2',
  3: 'md:row-span-3',
  4: 'md:row-span-4',
  5: 'md:row-span-5',
  6: 'md:row-span-6',
};
const LG_ROW_SPAN_CLASS: Record<RowSpan, string> = {
  1: 'lg:row-span-1',
  2: 'lg:row-span-2',
  3: 'lg:row-span-3',
  4: 'lg:row-span-4',
  5: 'lg:row-span-5',
  6: 'lg:row-span-6',
};
const XL_ROW_SPAN_CLASS: Record<RowSpan, string> = {
  1: 'xl:row-span-1',
  2: 'xl:row-span-2',
  3: 'xl:row-span-3',
  4: 'xl:row-span-4',
  5: 'xl:row-span-5',
  6: 'xl:row-span-6',
};

interface BentoCellProps {
  /** Column span at base (mobile-first). */
  col: ColSpan;
  /** Row span at base (default: 1). */
  row?: RowSpan;
  /** Column span overrides per breakpoint. */
  mdCol?: ColSpan;
  lgCol?: ColSpan;
  xlCol?: ColSpan;
  /** Row span overrides per breakpoint. */
  mdRow?: RowSpan;
  lgRow?: RowSpan;
  xlRow?: RowSpan;
  className?: string;
  children: React.ReactNode;
}

export function BentoCell({
  col,
  row = 1,
  mdCol,
  lgCol,
  xlCol,
  mdRow,
  lgRow,
  xlRow,
  className = '',
  children,
}: BentoCellProps) {
  const classes = [
    SPAN_CLASS[col],
    ROW_SPAN_CLASS[row],
    mdCol ? MD_SPAN_CLASS[mdCol] : '',
    lgCol ? LG_SPAN_CLASS[lgCol] : '',
    xlCol ? XL_SPAN_CLASS[xlCol] : '',
    mdRow ? MD_ROW_SPAN_CLASS[mdRow] : '',
    lgRow ? LG_ROW_SPAN_CLASS[lgRow] : '',
    xlRow ? XL_ROW_SPAN_CLASS[xlRow] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}
