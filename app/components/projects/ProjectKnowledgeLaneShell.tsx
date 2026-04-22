import React from 'react';
import { Link } from '@tanstack/react-router';

import { ProjectTabPlaceholder } from './ProjectTabPlaceholder';

type ProjectKnowledgeLane = 'notes' | 'views' | 'memories';

interface ProjectKnowledgeLaneShellProps {
  slug: string;
  tab?: string;
  selectedId?: string;
  noteId?: string;
  mode?: 'read' | 'edit';
  templateId?: string;
  memoryTab?: string;
}

function normalizeLane(tab?: string): ProjectKnowledgeLane {
  if (tab === 'views' || tab === 'memories') return tab;
  return 'notes';
}

function buildLaneSearch({
  lane,
  selectedId,
  noteId,
  mode,
  templateId,
  memoryTab,
}: {
  lane: ProjectKnowledgeLane;
  selectedId?: string;
  noteId?: string;
  mode?: 'read' | 'edit';
  templateId?: string;
  memoryTab?: string;
}) {
  return {
    tab: lane,
    selectedId,
    noteId,
    mode,
    templateId,
    memoryTab,
  };
}

const KnowledgeWorkspaceSurface = React.lazy(() =>
  import('../knowledge/KnowledgeWorkspaceSurface').then((module) => ({
    default: module.KnowledgeWorkspaceSurface,
  }))
);

export function ProjectKnowledgeLaneShell({
  slug,
  tab,
  selectedId,
  noteId,
  mode,
  templateId,
  memoryTab,
}: ProjectKnowledgeLaneShellProps) {
  const activeLane = normalizeLane(tab);
  const workspaceSearch = buildLaneSearch({
    lane: activeLane,
    selectedId,
    noteId,
    mode,
    templateId,
    memoryTab,
  });
  const laneParams = { slug };

  return (
    <div className="flex flex-col gap-4">
      <div className="genie-surface genie-surface--utility rounded-[24px] p-2">
        <div className="flex flex-wrap gap-2">
          {(['notes', 'views', 'memories'] as const).map((lane) => {
            const active = lane === activeLane;
            return (
              <Link
                key={lane}
                to="/project/$slug/knowledge"
                params={laneParams}
                search={buildLaneSearch({
                  lane,
                  selectedId,
                  noteId,
                  mode,
                  templateId,
                  memoryTab,
                })}
                className={[
                  'tab rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'active text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]',
                ].join(' ')}
              >
                {lane.charAt(0).toUpperCase() + lane.slice(1)}
              </Link>
            );
          })}
        </div>
      </div>

      {activeLane === 'notes' ? (
        <React.Suspense
          fallback={
            <ProjectTabPlaceholder
              title="Project Knowledge Notes"
              description="Loading the project knowledge workspace..."
            />
          }
        >
          <KnowledgeWorkspaceSurface
            noteId={noteId}
            mode={mode}
            projectId={slug}
            templateId={templateId}
            memoryTab={memoryTab}
            workspaceSearch={workspaceSearch}
            workspaceTo="/project/$slug/knowledge"
            workspaceParams={laneParams}
          />
        </React.Suspense>
      ) : activeLane === 'views' ? (
        <ProjectTabPlaceholder
          title="Project Knowledge Views"
          description="Project-scoped views, curated lenses, and lane-specific summaries will render here."
        />
      ) : (
        <ProjectTabPlaceholder
          title="Project Memories"
          description={`Agent and project memories will render here${memoryTab ? ` for ${memoryTab}` : ''}.`}
        />
      )}
    </div>
  );
}
