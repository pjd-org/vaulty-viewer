import React, { useCallback, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  useKnowledgeHealth,
  useKnowledgeSearch,
  type KnowledgeNoteRef,
} from '../lib/viewer-adapter';
import KnowledgeNoteCard from '../../src/components/KnowledgeNoteCard';
import KnowledgeHealthBanner from '../../src/components/KnowledgeHealthBanner';
import { WorkspaceScaffold } from '../components/layout';
import { EmptyState } from '../components/ui';
import { GlassCard } from '../components/ui/glass-card';
import { GlassInput } from '../components/ui/glass-input';
import { cn } from '@/src/lib/utils';

export const Route = createFileRoute('/knowledge/search')({
  validateSearch: (search) => ({
    q: (search.q as string) ?? '',
    searchMode: ((search.searchMode as string) === 'semantic'
      ? 'semantic'
      : 'tag') as 'tag' | 'semantic',
  }),
  component: KnowledgeSearchRoute,
});

function KnowledgeSearchRoute() {
  const search = Route.useSearch();
  const initialQ = String(search.q ?? '');
  const initialMode: 'tag' | 'semantic' =
    search.searchMode === 'semantic' ? 'semantic' : 'tag';
  const navigate = useNavigate({ from: '/knowledge/search' });

  const [q, setQ] = useState<string>(initialQ);
  const [mode, setMode] = useState<'tag' | 'semantic'>(initialMode);
  const [debouncedQ, setDebouncedQ] = useState<string>(initialQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: health } = useKnowledgeHealth();
  const {
    data: results,
    isLoading: searching,
    error: searchError,
  } = useKnowledgeSearch(debouncedQ, mode);

  const commitSearch = useCallback(
    (query: string, searchMode: 'tag' | 'semantic') => {
      setDebouncedQ(query);
      navigate({ search: { q: query, searchMode } });
    },
    [navigate]
  );

  const handleQueryChange = (newQ: string) => {
    setQ(newQ);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commitSearch(newQ, mode), 300);
  };

  const handleModeChange = (newMode: 'tag' | 'semantic') => {
    setMode(newMode);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    commitSearch(q, newMode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    commitSearch(q, mode);
  };

  const displayResults: KnowledgeNoteRef[] = results ?? [];

  const toolbar = (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
      <div className="min-w-[240px] flex-1">
        <GlassInput
          type="search"
          value={q}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search knowledge notes…"
        />
      </div>
      <div className="flex overflow-hidden rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => handleModeChange('tag')}
          className={cn(
            'px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition cursor-pointer',
            mode === 'tag'
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:text-white/80'
          )}
        >
          Structural
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('semantic')}
          className={cn(
            'px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition cursor-pointer',
            mode === 'semantic'
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:text-white/80'
          )}
        >
          Semantic
        </button>
      </div>
      <button
        type="submit"
        className={cn(
          'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-200',
          'bg-white/10 backdrop-blur-sm border border-white/20 text-white/70',
          'hover:bg-white/15 hover:text-white cursor-pointer'
        )}
      >
        Search
      </button>
    </form>
  );

  const summaryItems = [
    {
      label: 'Results',
      value: searching ? '…' : String(displayResults.length),
      detail: 'Notes matching current query',
    },
    {
      label: 'Mode',
      value: mode === 'semantic' ? 'Semantic' : 'Structural',
      detail: 'Active search mode',
    },
  ] as const;

  return (
    <WorkspaceScaffold
      title="Knowledge Search"
      subtitle="Search vault notes by tag structure or semantic similarity."
      actions={toolbar}
      summaryItems={summaryItems}
      primaryTitle="Results"
      primarySubtitle={
        debouncedQ.trim()
          ? `Showing results for "${debouncedQ}"`
          : 'Enter a query to search your knowledge base.'
      }
      primary={
        <div className="flex flex-col gap-4">
          <KnowledgeHealthBanner health={health ?? null} loading={false} />

          {searchError && (
            <div
              className="rounded-[18px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300"
              role="alert"
            >
              Search failed: {searchError.message}
            </div>
          )}

          {searching && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-[18px] border border-white/10 bg-white/5"
                />
              ))}
            </div>
          )}

          {!searching &&
            !searchError &&
            displayResults.length === 0 &&
            debouncedQ.trim() !== '' && (
              <EmptyState
                title={`No results for "${debouncedQ}".`}
                description="Try a different query or switch search mode."
              />
            )}

          {!searching &&
            !searchError &&
            displayResults.length === 0 &&
            debouncedQ.trim() === '' && (
              <EmptyState
                title="Enter a search query."
                description="Structural mode matches by tag and frontmatter. Semantic mode uses vector similarity."
              />
            )}

          {!searching && displayResults.length > 0 && (
            <div className="flex flex-col gap-3">
              {displayResults.map((note) => (
                <KnowledgeNoteCard key={note.path} {...note} />
              ))}
            </div>
          )}
        </div>
      }
      asideTitle="Search Tips"
      asideSubtitle="How to get the best results."
      aside={
        <div className="flex flex-col gap-4 text-sm text-white/60">
          <GlassCard
            variant="light"
            glowEffect={false}
            className="p-4 flex flex-col gap-3"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                Structural mode
              </p>
              <p className="mt-2 text-white/60">
                Matches notes by tag, frontmatter type, or audience field. Exact
                and prefix matching.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                Semantic mode
              </p>
              <p className="mt-2 text-white/60">
                Uses vector embeddings to find conceptually similar notes even
                without exact keyword matches.
              </p>
            </div>
          </GlassCard>
        </div>
      }
    />
  );
}
