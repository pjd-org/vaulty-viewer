import type { ProjectSummaryDisplay } from '../types/project-display';

export function toProjectSummaryDisplay(raw: any): ProjectSummaryDisplay {
  return {
    id: String(raw.id ?? raw._id ?? 'unknown'),
    title: raw.title ?? raw.name ?? 'Untitled project',
    status: (raw.status as any) ?? (raw.completed ? 'done' : 'active'),
    progress: typeof raw.progress === 'number' ? Math.max(0, Math.min(1, raw.progress)) : 0,
    bestMove: raw.best_move ?? raw.bestMove ?? undefined,
    etaLabel: raw.eta_label ?? raw.etaLabel ?? undefined,
  };
}
