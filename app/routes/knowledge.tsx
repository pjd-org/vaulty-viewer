import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { knowledgeSearchParams } from '../../src/lib/routes/search-params';
import { KnowledgeWorkspaceSurface } from '../components/knowledge/KnowledgeWorkspaceSurface';
import { WorkspaceScaffold } from '../components/layout';
import { useKnowledgeSurface } from '../lib/viewer-adapter';

export const Route = createFileRoute('/knowledge')({
  validateSearch: knowledgeSearchParams,
  component: KnowledgeRoute,
});

function KnowledgeRoute() {
  const { tab, noteId, mode, templateId, memoryTab, projectId } =
    Route.useSearch();
  const { data: surface } = useKnowledgeSurface();

  const workspaceSearch = {
    tab: tab ?? 'notes',
    ...(mode ? { mode } : {}),
    ...(templateId ? { templateId } : {}),
    ...(memoryTab ? { memoryTab } : {}),
    ...(projectId ? { projectId } : {}),
  };

  const quickLinks = (
    <div className="flex flex-wrap gap-2">
      <Link
        to="/knowledge/search"
        search={
          ((prev: Record<string, unknown>) => ({
            ...prev,
            searchMode: 'semantic',
          })) as never
        }
        className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-700"
      >
        Search
      </Link>
      <Link
        to="/knowledge/graph"
        className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-700"
      >
        Graph
      </Link>
      <Link
        to="/huey"
        search={{}}
        className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-700"
      >
        Ask Huey →
      </Link>
      {noteId && (
        <Link
          to="/note"
          search={{ p: noteId }}
          className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-700"
        >
          Open note
        </Link>
      )}
    </div>
  );

  const summaryItems = [
    {
      label: 'Context',
      value: String(surface?.selectedContext.length ?? 0),
      detail: 'Active context candidates',
    },
    {
      label: 'Entities',
      value: String(surface?.linkedEntities.length ?? 0),
      detail: 'Linked entities in scope',
    },
    {
      label: 'Templates',
      value: String(surface?.suggestedTemplates.length ?? 0),
      detail: 'Suggested note templates',
    },
    {
      label: 'Actions',
      value: String(surface?.suggestedActions.length ?? 0),
      detail: 'Suggested authoring actions',
    },
  ] as const;

  return (
    <WorkspaceScaffold
      title="Knowledge"
      subtitle="Structured memory for human, agent, and bubble contexts."
      statusLine={
        surface
          ? `${surface.selectedContext.length} active context · ${surface.suggestedActions.length} suggested action${surface.suggestedActions.length !== 1 ? 's' : ''}`
          : 'Memory surface loading…'
      }
      nextAction="→ Select a note to read or edit, or use Search to find context by meaning."
      actions={quickLinks}
      summaryItems={summaryItems}
      primaryTitle="Workspace"
      primarySubtitle="Note authoring, search, and memory operations."
      primary={
        <KnowledgeWorkspaceSurface
          noteId={noteId}
          mode={mode}
          projectId={projectId}
          templateId={templateId}
          memoryTab={memoryTab}
          workspaceSearch={workspaceSearch}
          workspaceTo="/knowledge"
        />
      }
      asideTitle="Suggested Actions"
      asideSubtitle="COD-recommended authoring and linking operations."
      aside={
        surface?.suggestedActions.length ? (
          <div className="space-y-3">
            {surface.suggestedActions.map((action) => (
              <div
                key={`${action.actionType}-${action.label}`}
                className="rounded-[18px] border border-slate-200 bg-black/3 p-4"
              >
                <p className="text-sm font-semibold text-slate-800">
                  {action.label}
                </p>
                <p className="mt-1 text-xs text-slate-500 uppercase tracking-[0.18em]">
                  {action.actionType.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No authoring actions are suggested at this time.
          </p>
        )
      }
    />
  );
}
