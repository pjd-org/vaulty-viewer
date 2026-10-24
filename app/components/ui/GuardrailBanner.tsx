/**
 * COD returns an empty task payload when a guardrail short-circuits — it never
 * reads the task graph. Without this banner an empty lane is indistinguishable
 * from "no work exists" or "the service is down", which is exactly how the
 * 2026-10-20 HARD_STOP window was misread as an outage.
 *
 * Renders nothing when no guardrail is active, so it is safe to mount
 * unconditionally on every task-derived surface.
 */
export interface GuardrailHumanState {
  status?: string;
  warnings?: string[];
  durationCapMin?: number;
  recommendedMode?: string;
}

export function guardrailReason(
  humanState: GuardrailHumanState | undefined | null
): string | undefined {
  if (!humanState) return undefined;
  if (humanState.status !== 'blocked') return undefined;
  const first = Array.isArray(humanState.warnings)
    ? humanState.warnings[0]
    : undefined;
  return typeof first === 'string' && first.trim() ? first.trim() : undefined;
}

export function GuardrailBanner({
  humanState,
  className = '',
}: {
  humanState?: GuardrailHumanState | null;
  className?: string;
}) {
  const reason = guardrailReason(humanState);
  if (!reason) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        'border-[color-mix(in_srgb,var(--a-amber)_38%,var(--border-glass))]',
        'bg-[color-mix(in_srgb,var(--a-amber)_12%,var(--surf-elevated))]',
        'text-[var(--text-primary)]',
        className,
      ]
        .join(' ')
        .trim()}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-base">
        ⏸
      </span>
      <div className="min-w-0">
        <p className="font-semibold">Work is paused by a guardrail.</p>
        <p className="mt-0.5 text-[var(--text-secondary)]">{reason}</p>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Task-ranked lanes are empty because COD does not read the task graph
          while this guardrail is active — not because there is no work.
        </p>
      </div>
    </div>
  );
}
