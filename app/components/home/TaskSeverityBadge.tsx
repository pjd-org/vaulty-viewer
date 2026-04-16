function taskSeverityFromPriority(
  priority: number
): 'critical' | 'high' | 'normal' {
  if (priority >= 8) return 'critical';
  if (priority >= 5) return 'high';
  return 'normal';
}

interface TaskSeverityBadgeProps {
  priority: number;
  confidencePct: number;
}

export function TaskSeverityBadge({
  priority,
  confidencePct,
}: TaskSeverityBadgeProps) {
  const severity = taskSeverityFromPriority(priority);
  const classes =
    severity === 'critical'
      ? '[background:color-mix(in_srgb,var(--a-rose)_18%,white)] [color:color-mix(in_srgb,var(--a-rose)_70%,#1c2230)] [border-color:color-mix(in_srgb,var(--a-rose)_35%,transparent)]'
      : severity === 'high'
        ? '[background:color-mix(in_srgb,var(--a-sun)_18%,white)] [color:color-mix(in_srgb,var(--a-sun)_80%,#1c2230)] [border-color:color-mix(in_srgb,var(--a-sun)_35%,transparent)]'
        : '[background:color-mix(in_srgb,var(--a-sky)_12%,white)] [color:color-mix(in_srgb,var(--a-sky)_60%,#1c2230)] [border-color:color-mix(in_srgb,var(--a-sky)_25%,transparent)]';
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${classes}`}
    >
      <span>{severity}</span>
      <span className="text-[10px] normal-case tracking-normal">
        {confidencePct}%
      </span>
    </span>
  );
}
