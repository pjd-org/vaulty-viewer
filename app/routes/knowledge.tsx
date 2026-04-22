import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { WorkspaceScaffold } from '../components/layout';
import KnowledgeNoteCard from '../../src/components/KnowledgeNoteCard';
import {
  useKnowledgeByAudience,
  useKnowledgeSurface,
  type KnowledgeNoteRef,
} from '../lib/viewer-adapter';
import { knowledgeSearchParams } from '../../src/lib/routes/search-params';
import { KnowledgeWorkspaceSurface } from '../components/knowledge/KnowledgeWorkspaceSurface';
import { cn } from '@/src/lib/utils';

export const Route = createFileRoute('/knowledge')({
  validateSearch: knowledgeSearchParams,
  component: KnowledgeRoute,
});

type AudienceFilter = 'all' | 'human' | 'agent' | 'bubble';
type MaturityFilter = '' | 'draft' | 'stable' | 'deprecated';

function getDomains(notes: KnowledgeNoteRef[]) {
  return Array.from(
    new Set(notes.map((note) => note.domain).filter(Boolean))
  ).sort();
}

function KnowledgeRoute() {
  const { data: surface } = useKnowledgeSurface();
  const { data: humanNotes = [], isLoading: loadingHuman } =
    useKnowledgeByAudience('human');
  const { data: agentNotes = [], isLoading: loadingAgent } =
    useKnowledgeByAudience('agent');
  const { data: bubbleNotes = [], isLoading: loadingBubble } =
    useKnowledgeByAudience('bubble');

  const [audience, setAudience] = React.useState<AudienceFilter>('all');
  const [domain, setDomain] = React.useState('');
  const [maturity, setMaturity] = React.useState<MaturityFilter>('');
  const [page, setPage] = React.useState(1);
  const pageSize = 6;

  const loading = loadingHuman || loadingAgent || loadingBubble;
  const allNotes = React.useMemo(
    () => [...humanNotes, ...agentNotes, ...bubbleNotes],
    [humanNotes, agentNotes, bubbleNotes]
  );

  const domains = React.useMemo(() => getDomains(allNotes), [allNotes]);

  const filtered = React.useMemo(() => {
    return allNotes.filter((note) => {
      if (audience !== 'all' && (note.audience ?? 'human') !== audience)
        return false;
      if (domain && note.domain !== domain) return false;
      if (maturity && note.status !== maturity) return false;
      return true;
    });
  }, [allNotes, audience, domain, maturity]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  React.useEffect(() => {
    setPage(1);
  }, [audience, domain, maturity]);

  const metricCards = [
    {
      label: 'Context',
      value: String(surface?.selectedContext.length ?? 0),
      hint: 'network',
    },
    {
      label: 'Entities',
      value: String(surface?.linkedEntities.length ?? 0),
      hint: 'linked notes',
    },
    {
      label: 'Templates',
      value: String(surface?.suggestedTemplates.length ?? 0),
      hint: 'discoverable',
    },
    {
      label: 'Actions',
      value: String(surface?.suggestedActions.length ?? 0),
      hint: 'authoring',
    },
  ];

  return (
    <WorkspaceScaffold
      title="Knowledge"
      subtitle="Workspace"
      primaryTitle="Workspace"
      primarySubtitle="Note library"
      primary={
        <div className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => (
              <div
                key={metric.label}
                className="px-4 py-3 rounded-xl border border-[var(--border-glass-soft)] bg-[var(--surf-utility)]"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                  {metric.value}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                  {metric.hint}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setAudience((current) =>
                  current === 'all'
                    ? 'human'
                    : current === 'human'
                      ? 'agent'
                      : current === 'agent'
                        ? 'bubble'
                        : 'all'
                )
              }
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
                'bg-white/10 backdrop-blur-sm border border-white/20 text-white/80',
                'hover:bg-white/15 hover:text-white cursor-pointer'
              )}
            >
              Audience: {audience}
            </button>

            {/* Quick-links */}
            <Link
              to="/knowledge"
              search={{ q: 'search' }}
              className="rounded-full bg-white/8 backdrop-blur-sm border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/15 hover:text-white transition-all duration-200"
            >
              Search
            </Link>
            <Link
              to="/knowledge"
              search={{ q: 'graph' }}
              className="rounded-full bg-white/8 backdrop-blur-sm border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/15 hover:text-white transition-all duration-200"
            >
              Graph
            </Link>

            <label
              className={cn(
                'rounded-full px-3 py-1.5 text-xs',
                'bg-white/10 backdrop-blur-sm border border-white/20 text-white/80'
              )}
            >
              Domain
              <select
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                className="ml-2 bg-transparent outline-none text-white/80 [&>option]:bg-zinc-900 [&>option]:text-white"
              >
                <option value="">All</option>
                {domains.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label
              className={cn(
                'rounded-full px-3 py-1.5 text-xs',
                'bg-white/10 backdrop-blur-sm border border-white/20 text-white/80'
              )}
            >
              Maturity
              <select
                value={maturity}
                onChange={(event) =>
                  setMaturity(event.target.value as MaturityFilter)
                }
                className="ml-2 bg-transparent outline-none text-white/80 [&>option]:bg-zinc-900 [&>option]:text-white"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="stable">Stable</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-[var(--text-secondary)]">
              Loading notes…
            </div>
          ) : pageItems.length === 0 ? (
            <div className="p-6 text-sm text-[var(--text-secondary)]">
              No notes match this filter.
            </div>
          ) : (
            <div className="grid auto-rows-[150px] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((note, index) => (
                <div
                  key={note.path}
                  className={
                    index % 5 === 0
                      ? 'md:row-span-2'
                      : index % 4 === 0
                        ? 'xl:col-span-2'
                        : ''
                  }
                >
                  <KnowledgeNoteCard {...note} />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs transition-all duration-200',
                'bg-white/10 backdrop-blur-sm border border-white/20 text-white/70',
                'hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer'
              )}
            >
              Prev
            </button>
            <p className="text-xs text-white/60">
              {safePage} / {totalPages}
            </p>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs transition-all duration-200',
                'bg-white/10 backdrop-blur-sm border border-white/20 text-white/70',
                'hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer'
              )}
            >
              Next
            </button>
          </div>

          <KnowledgeWorkspaceSurface />
        </div>
      }
    />
  );
}
