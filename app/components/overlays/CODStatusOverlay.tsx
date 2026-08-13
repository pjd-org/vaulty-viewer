import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { GlassBadge, GlassSurface } from '@vault/ui';
import { CodModal } from '../cod';
import { useSystemSummarizerQuery } from '../../lib/queries/agents';
import { fetchAllTasks } from '../../lib/api/tasks';
import { fetchProjects } from '../../lib/api/projects';
import { useLoginRedirectOnUnauthenticated } from '../../hooks/use-login-redirect';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export interface CODStatusOverlayProps {
  onRequestClose?: () => void;
}

export function CODStatusOverlay({ onRequestClose }: CODStatusOverlayProps = {}) {
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
      enabled: agentTasks.length > 0 || agentProjects.length > 0,
    }
  );

  if (isUnauthenticated) return null;

  const closeOverlay = React.useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }

    if (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      document.referrer &&
      window.history.length > 1
    ) {
      try {
        const referrer = new URL(document.referrer);
        if (referrer.origin === window.location.origin) {
          window.history.back();
          return;
        }
      } catch {
        // Fall through to the home fallback.
      }
    }

    void navigate({ to: '/', search: {} });
  }, [navigate, onRequestClose]);

  return (
    <Dialog open onOpenChange={(open) => !open && closeOverlay()}>
      <DialogContent
        aria-label="COD status"
        className="!max-w-[min(960px,calc(100vw-2rem))] !overflow-hidden !border !border-[var(--border-glass)] !bg-[var(--surf-overlay)] !p-0 !shadow-2xl"
      >
        <div className="max-h-[min(88vh,860px)] overflow-y-auto">
          <div className="border-b border-[var(--border-glass-soft)] px-6 py-5">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl">COD Status</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-[var(--text-primary)]">
                Readiness, constraints, and the current working envelope for the
                command center.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <GlassBadge tone="sky" size="md" className="justify-between px-3">
                <span className="uppercase tracking-[0.2em]">Tasks</span>
                <strong>{tasks?.length ?? 0}</strong>
              </GlassBadge>
              <GlassBadge tone="mint" size="md" className="justify-between px-3">
                <span className="uppercase tracking-[0.2em]">Projects</span>
                <strong>{projects?.length ?? 0}</strong>
              </GlassBadge>
              <GlassBadge tone="sun" size="md" className="justify-between px-3">
                <span className="uppercase tracking-[0.2em]">Summary</span>
                <strong>{summaryData?.summary?.length ?? 0}</strong>
              </GlassBadge>
              <GlassBadge tone="lilac" size="md" className="justify-between px-3">
                <span className="uppercase tracking-[0.2em]">Mode</span>
                <strong>{summaryData?.summary?.length ? 'Live' : 'Waiting'}</strong>
              </GlassBadge>
            </div>
          </div>

          <div className="px-6 py-5">
            <GlassSurface
              as="div"
              variant="base"
              radius="xl"
              shadow="xs"
              className="mb-4 flex flex-col gap-1.5 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                System state
              </p>
              {summaryData?.summary && summaryData.summary.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {summaryData.summary.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--text-primary)]"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-tertiary)]"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  No summary data yet. Open a task or project to seed the status
                  view.
                </p>
              )}
            </GlassSurface>

            <CodModal />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
