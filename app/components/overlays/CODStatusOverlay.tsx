import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, GlassSurface } from '@vault/ui';
import { CodModal } from '../cod';
import { useSystemSummarizerQuery } from '../../lib/queries/agents';
import { fetchAllTasks } from '../../lib/api/tasks';
import { fetchProjects } from '../../lib/api/projects';
import { useLoginRedirectOnUnauthenticated } from '../../hooks/use-login-redirect';

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
    <div
      className="fixed inset-0 z-[8500] flex items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--vault-ink)_24%,transparent)] px-4 py-4 backdrop-blur-md sm:px-6 sm:py-6"
      onClick={closeOverlay}
    >
      <GlassSurface
        as="section"
        variant="overlay"
        radius="2xl"
        shadow="lg"
        className="relative w-full max-w-[980px] overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="COD"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full border-transparent text-[var(--text-secondary)] hover:bg-[var(--surf-utility)] hover:text-[var(--text-primary)]"
          onClick={closeOverlay}
          aria-label="Close COD"
        >
          ✕
        </Button>
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto px-5 pb-5 pt-16 sm:px-6 sm:pb-6 flex flex-col gap-4">
          <GlassSurface
            as="header"
            variant="base"
            radius="2xl"
            shadow={false}
            className="p-6"
            style={{
              background:
                'linear-gradient(90deg, color-mix(in srgb, var(--a-sky) 18%, transparent) 0%, color-mix(in srgb, var(--a-lilac) 14%, transparent) 100%)',
            }}
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                COD command center
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                Readiness
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Can you work now, and under what constraints?
              </p>
            </div>
          </GlassSurface>
          {summaryData?.summary && summaryData.summary.length > 0 && (
            <GlassSurface
              as="div"
              variant="base"
              radius="xl"
              shadow="xs"
              className="flex flex-col gap-1.5 p-4"
            >
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  System State
                </p>
                <ul className="flex flex-col gap-1">
                  {summaryData.summary.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </GlassSurface>
          )}
          <CodModal />
        </div>
      </GlassSurface>
    </div>
  );
}
