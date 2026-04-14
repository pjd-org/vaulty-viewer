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
      ? 'bg-red-100 text-red-700'
      : severity === 'high'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-700';
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${classes}`}
    >
      <span>{severity}</span>
      <span className="text-[10px] normal-case tracking-normal">
        {confidencePct}%
      </span>
    </span>
  );
}
