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
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => (
              <article
                key={metric.label}
                className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-800">
                  {metric.value}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {metric.hint}
                </p>
              </article>
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
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              Audience: {audience}
            </button>

            {/* Quick-links */}
            <Link
              to="/knowledge"
              search={{ q: 'search' }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Search
            </Link>
            <Link
              to="/knowledge"
              search={{ q: 'graph' }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Graph
            </Link>

            <label className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
              Domain
              <select
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                className="ml-2 bg-transparent outline-none"
              >
                <option value="">All</option>
                {domains.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
              Maturity
              <select
                value={maturity}
                onChange={(event) =>
                  setMaturity(event.target.value as MaturityFilter)
                }
                className="ml-2 bg-transparent outline-none"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="stable">Stable</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
              Loading notes…
            </div>
          ) : pageItems.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
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

          <div className="flex items-center justify-between border-t border-slate-200/70 pt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 disabled:opacity-40"
            >
              Prev
            </button>
            <p className="text-xs text-slate-500">
              {safePage} / {totalPages}
            </p>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 disabled:opacity-40"
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
