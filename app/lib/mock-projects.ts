export const MOCK_PROJECTS = [
  { id: 'p1', title: 'Roadmap redesign', status: 'active', progress: 0.42, best_move: 'Draft project charter', eta_label: '2w' },
  { id: 'p2', title: 'Viewer UI revamp', status: 'active', progress: 0.12, best_move: 'Polish Note layout', eta_label: '1w' },
  { id: 'p3', title: 'MCP inbox cleanup', status: 'paused', progress: 0.03, best_move: 'Review queued runs', eta_label: 'TBD' },
];

export function getMockProjects() {
  return Promise.resolve(MOCK_PROJECTS);
}

export function getMockProjectById(id: string) {
  const p = MOCK_PROJECTS.find((x) => x.id === id);
  return Promise.resolve(p ?? null);
}
