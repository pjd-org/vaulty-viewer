import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { knowledgeSearchParams } from '../../src/lib/routes/search-params';
import { KnowledgeWorkspaceSurface } from '../components/knowledge/KnowledgeWorkspaceSurface';

export const Route = createFileRoute('/knowledge')({
  validateSearch: knowledgeSearchParams,
  component: KnowledgeRoute,
});

function KnowledgeRoute() {
  const { tab, noteId, mode, templateId, memoryTab, projectId } = Route.useSearch()
  const workspaceSearch = {
    tab: tab ?? 'notes',
    ...(mode ? { mode } : {}),
    ...(templateId ? { templateId } : {}),
    ...(memoryTab ? { memoryTab } : {}),
    ...(projectId ? { projectId } : {}),
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1>Knowledge</h1>
            <p className="text-sm text-neutral-500">
              Active authoring and context operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/knowledge/search"
              search={((prev: Record<string, unknown>) => ({ ...prev, mode: 'semantic' })) as never}
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
        </div>
      </header>
      <KnowledgeWorkspaceSurface
        noteId={noteId}
        mode={mode}
        projectId={projectId}
        templateId={templateId}
        memoryTab={memoryTab}
        workspaceSearch={workspaceSearch}
        workspaceTo="/knowledge"
      />
    </main>
  );
}
