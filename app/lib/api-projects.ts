import { toProjectSummaryDisplay } from './display-projects';
import { getMockProjects, getMockProjectById } from './mock-projects';

async function safeFetch(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('network');
    return await res.json();
  } catch (err) {
    // Fall back to mocks for dev/test environments
    return null;
  }
}

export async function fetchProjects() {
  const raw = await safeFetch('/api/viewer/projects');
  if (raw) return (Array.isArray(raw) ? raw : []).map((r: any) => toProjectSummaryDisplay(r));
  const mocks = await getMockProjects();
  return mocks.map((r: any) => toProjectSummaryDisplay(r));
}

export async function fetchProjectById(id: string) {
  const raw = await safeFetch(`/api/viewer/projects/${encodeURIComponent(id)}`);
  if (raw) return toProjectSummaryDisplay(raw);
  const mock = await getMockProjectById(id);
  if (!mock) throw new Error('Failed to load project');
  return toProjectSummaryDisplay(mock);
}
