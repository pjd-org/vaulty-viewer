export async function fetchProjects() {
  // Fetch project list from backend API. The backend may return either
  // { structuredContent: { projects: [...] } } or { projects: [...] }.
  const res = await fetch('/api/v1/projects');
  if (!res.ok) {
    throw new Error('Failed to fetch projects');
  }
  const body = await res.json();
  const raw = body.structuredContent?.projects ?? body.projects ?? [];
  return raw.map((r: any) => ({
    id: r.id ?? r.domain ?? r.path ?? r.slug ?? String(r.title || '').toLowerCase().replace(/\s+/g, '-'),
    title: r.title ?? r.name ?? 'Untitled',
    statusVariant: r.status === 'completed' ? 'completed' : r.status ?? 'active',
    progressPercent: (() => {
      if (typeof r.progress === 'number') return Math.round(r.progress * 100);
      if (typeof r.completedTaskCount === 'number' && typeof r.taskCount === 'number' && r.taskCount > 0) {
        return Math.round((r.completedTaskCount / r.taskCount) * 100);
      }
      return r.progressPercent ?? 0;
    })(),
    bestMoveTitle: (r.nextAction && r.nextAction.title) ?? r.bestMove ?? r.nextActionTitle ?? '',
  }));
}

export async function fetchProjectById(id: string) {
  // Basic implementation: fetch all projects and find by id. Backends may offer a dedicated endpoint later.
  const all = await fetchProjects();
  return all.find((p: any) => p.id === id || p.id === decodeURIComponent(id)) ?? null;
}
