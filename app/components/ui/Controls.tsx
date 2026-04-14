import React, { useRef } from 'react';

export interface SegmentOption {
  value: string;
  label: string;
  badge?: number;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const tabs =
      containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (!tabs) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (next >= 0) {
      e.preventDefault();
      tabs[next].focus();
      onChange(options[next].value);
    }
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={`genie-surface genie-surface--utility inline-flex items-center rounded-full p-1 gap-1 ${className}`}
    >
      {options.map((opt, index) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`tab px-4 py-1.5 text-sm cursor-pointer transition-all rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--a-sky)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
              isActive
                ? 'active font-medium'
                : 'hover:text-[var(--text-primary)]'
            }`}
          >
            {opt.label}
            {opt.badge != null && opt.badge > 0 && (
              <span className="ml-1 rounded-full bg-black/8 px-1.5 py-0.5 text-[10px] leading-none tabular-nums">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
