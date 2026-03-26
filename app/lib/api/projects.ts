import type { ProjectSummaryDisplay } from '../../types/display';

const statusVariantMap: Record<string, ProjectSummaryDisplay['statusVariant']> = {
  completed: 'success',
  active: 'default',
  'on-hold': 'warning',
  blocked: 'danger',
};

export async function fetchProjects(): Promise<ProjectSummaryDisplay[]> {
  // Fetch project list from backend API. The backend may return either
  // { structuredContent: { projects: [...] } } or { projects: [...] }.
  const res = await fetch('/api/v1/projects');
  if (!res.ok) {
    throw new Error('Failed to fetch projects');
  }
  const body = await res.json();
  const raw: any[] = body.structuredContent?.projects ?? body.projects ?? [];
  return raw.map((r) => {
    const progressPercent = (() => {
      if (typeof r.progress === 'number') return Math.round(r.progress * 100);
      if (typeof r.completedTaskCount === 'number' && typeof r.taskCount === 'number' && r.taskCount > 0) {
        return Math.round((r.completedTaskCount / r.taskCount) * 100);
      }
      return r.progressPercent ?? 0;
    })();
    const rawStatus: string = r.status ?? 'active';
    const statusVariant = statusVariantMap[rawStatus] ?? 'default';
    const statusLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).replace(/-/g, ' ');
    return {
      id: r.id ?? r.domain ?? r.path ?? r.slug ?? String(r.title || '').toLowerCase().replace(/\s+/g, '-'),
      title: r.title ?? r.name ?? 'Untitled',
      statusVariant,
      statusLabel,
      progressPercent,
      progressText: `${progressPercent}%`,
      etaLabel: r.eta ?? null,
      bestMoveTitle: (r.nextAction && r.nextAction.title) ?? r.bestMove ?? r.nextActionTitle ?? null,
    };
  });
}

export async function fetchProjectById(id: string): Promise<ProjectSummaryDisplay | null> {
  // Basic implementation: fetch all projects and find by id. Backends may offer a dedicated endpoint later.
  const all = await fetchProjects();
  return all.find((p) => p.id === id || p.id === decodeURIComponent(id)) ?? null;
}
