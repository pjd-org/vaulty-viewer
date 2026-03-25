export type ProjectSummaryDisplay = {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'done' | 'archived';
  progress: number; // 0..1
  bestMove?: string;
  etaLabel?: string;
};

export default ProjectSummaryDisplay;
