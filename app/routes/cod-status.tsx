import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CodModal } from '../components/cod';
import { useSystemSummarizerQuery } from '../lib/queries/agents';
import { fetchAllTasks } from '../lib/api/tasks';
import { fetchProjects } from '../lib/api/projects';
import { useLoginRedirectOnUnauthenticated } from '../hooks/use-login-redirect';

export const Route = createFileRoute('/cod-status')({
  component: () => <CODStatusRoute />,
});

interface CODStatusRouteProps {
  onRequestClose?: () => void;
}

export function CODStatusRoute({ onRequestClose }: CODStatusRouteProps = {}) {
  const navigate = useNavigate();
  const { data: tasks, error: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchAllTasks,
    staleTime: 1000 * 60,
  });
  const { data: projects, error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 1000 * 60,
  });
  const isUnauthenticated = useLoginRedirectOnUnauthenticated(
    tasksError ?? projectsError
  );

  const closeOverlay = React.useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }

    void navigate({ to: '/', search: {} });
  }, [navigate, onRequestClose]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOverlay();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeOverlay]);

  const agentTasks = (tasks ?? []).map(
    (t: {
      id: string;
      title: string;
      status?: string;
      estimatedTimeMin?: number | null;
    }) => ({
      id: t.id,
      title: t.title,
      status: t.status ?? undefined,
      priority: undefined,
      estimatedMin: t.estimatedTimeMin ?? undefined,
      project: undefined,
    })
  );

  const agentProjects = (projects ?? []).map((p) => ({
    id: p.id ?? p.title,
    title: p.title,
  }));

  const { data: summaryData } = useSystemSummarizerQuery(
    agentTasks,
    agentProjects,
    {
      enabled: agentTasks.length > 0,
    }
  );

  if (isUnauthenticated) return null;

  return (
    <div className="route-modal-overlay" onClick={closeOverlay}>
      <section
        className="route-modal-card route-modal-card--cod genie-surface genie-surface--overlay"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="COD"
      >
        <button
          type="button"
          className="route-modal-close"
          onClick={closeOverlay}
          aria-label="Close COD"
        >
          ✕
        </button>
        <div className="route-modal-scroll route-modal-body space-y-4">
          <header className="rounded-[28px] p-6 genie-surface genie-surface--hero genie-layer-hero">
            <div className="genie-content">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-800">
                Readiness
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Can you work now, and under what constraints?
              </p>
            </div>
          </header>
          {summaryData?.summary && summaryData.summary.length > 0 && (
            <div className="genie-surface genie-surface--hero rounded-xl px-4 py-3 space-y-1.5">
              <div className="genie-content">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  System State
                </p>
                <ul className="space-y-1">
                  {summaryData.summary.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <CodModal />
        </div>
      </section>
    </div>
  );
}
