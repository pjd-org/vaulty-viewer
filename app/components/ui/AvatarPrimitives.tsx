import React from 'react';

export interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <h3
      className={`text-[11px] font-medium uppercase tracking-widest text-slate-500 ${className ?? ''}`}
    >
      {children}
    </h3>
  );
}
