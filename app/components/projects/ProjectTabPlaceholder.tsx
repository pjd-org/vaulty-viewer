import React from 'react';

import { SoftPanel } from '../layout';
import { useProjectRouteShellContext } from '../layout/ProjectRouteContext';

interface ProjectTabPlaceholderProps {
  title: string;
  description: string;
}

export function ProjectTabPlaceholder({
  title,
  description,
}: ProjectTabPlaceholderProps) {
  const shellContext = useProjectRouteShellContext();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
      <SoftPanel title={title} subtitle="Phase 1 scaffold" variant="elevated">
        <div className="space-y-3 text-sm text-slate-600">
          <p>{description}</p>
          <p>
            This view now resolves inside the canonical project shell and is
            ready for Phase 3 and Phase 4 feature work.
          </p>
        </div>
      </SoftPanel>
      <SoftPanel
        title="Why it is here"
        subtitle="Viewer V3 shell contract"
        variant="utility"
      >
        <ul className="space-y-2 text-sm text-slate-600">
          <li>Project routes now share one scoped command-center shell.</li>
          <li>Tabs are URL-addressable and safe to link directly.</li>
          <li>Verification stays visible at the global shell level.</li>
        </ul>
        {shellContext ? (
          <div
            data-testid="project-shell-context"
            className="mt-4 rounded-[18px] border border-sky-500/20 bg-sky-50 p-4 text-sm text-slate-700"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
              Inherited project shell
            </p>
            <p className="mt-2 font-medium text-slate-800">
              Project: {shellContext.projectId}
            </p>
            <p className="mt-1 text-slate-600">
              {shellContext.projectSurface
                ? `${shellContext.projectSurface.pressureBand.length} pressure signal${shellContext.projectSurface.pressureBand.length === 1 ? '' : 's'}, ${shellContext.projectSurface.decisionQueue.length} decision${shellContext.projectSurface.decisionQueue.length === 1 ? '' : 's'}, and ${shellContext.projectSurface.verificationRail.length} verification item${shellContext.projectSurface.verificationRail.length === 1 ? '' : 's'} are available to this tab.`
                : 'Project surface is still loading.'}
            </p>
          </div>
        ) : null}
      </SoftPanel>
    </div>
  );
}
