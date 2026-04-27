import React, { useMemo, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { WorkspaceScaffold } from '../components/layout/WorkspaceScaffold';
import { EmptyState, RouteLoadingState } from '../components/ui';
import { KnowledgeNoteCard } from '../../src/components/KnowledgeNoteCard';
import { notesSearchParams } from '../../src/lib/routes/search-params';
import {
  getKnowledgeByAudienceQueryOptions,
  getKnowledgeSearchQueryOptions,
  type KnowledgeNoteRef,
} from '../lib/viewer-adapter';
import { GlassCard } from '../components/ui/glass-card';
import { GlassInput } from '../components/ui/glass-input';
import { cn } from '@/src/lib/utils';

export const Route = createFileRoute('/notes')({
  validateSearch: notesSearchParams,
  component: NotesRoute,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLLECTION_OPTIONS = [
  { value: '' as const, label: 'All' },
  { value: 'human' as const, label: 'Human' },
  { value: 'agent' as const, label: 'Agent' },
  { value: 'bubble' as const, label: 'Bubble' },
] as const;

type CollectionFilter = 'human' | 'agent' | 'bubble' | '';

const PAGE_SIZE = 18;

// ---------------------------------------------------------------------------
// NoteGrid
// ---------------------------------------------------------------------------

function NoteGrid({
  notes,
  page,
  onPage,
}: {
  notes: KnowledgeNoteRef[];
  page: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(notes.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = notes.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No notes found."
        description="Create a note or clear the current filter."
        action={
          <Link
            to="/note-new"
            className="inline-flex rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
          >
            New Note
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
            <KnowledgeNoteCard
              path={note.path}
              title={note.title}
              audience={note.audience}
              domain={note.domain}
              tags={note.tags}
              status={note.status}
            />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => onPage(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs transition-all duration-200',
              'bg-white/10 backdrop-blur-sm border border-white/20 text-white/70',
              'hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer'
            )}
          >
            ← Prev
          </button>
          <p className="text-xs text-white/60">
            {safePage} / {totalPages} · {notes.length} notes
          </p>
          <button
            type="button"
            onClick={() => onPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            aria-label="Next page"
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs transition-all duration-200',
              'bg-white/10 backdrop-blur-sm border border-white/20 text-white/70',
              'hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer'
            )}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

function NotesRoute() {
  const navigate = useNavigate({ from: '/notes' });
  const { q, collection } = Route.useSearch();

  const [draftQ, setDraftQ] = useState(q ?? '');
  const [page, setPage] = useState(1);

  // If a search query is active, use the search endpoint
  const searchEnabled = (q ?? '').trim().length > 0;
  const searchQuery = useQuery({
    ...getKnowledgeSearchQueryOptions(q ?? '', 'semantic'),
    enabled: searchEnabled,
  });

  // Otherwise use the audience/collection endpoint.
  // When audienceFilter is '' ("All"), fetch all three audiences in parallel
  // and merge — never silently fall back to human-only.
  const audienceFilter = (collection as CollectionFilter) ?? '';
  const humanQuery = useQuery({
    ...getKnowledgeByAudienceQueryOptions('human'),
    enabled: !searchEnabled && audienceFilter === '',
  });
  const agentQuery = useQuery({
    ...getKnowledgeByAudienceQueryOptions('agent'),
    enabled: !searchEnabled && audienceFilter === '',
  });
  const bubbleQuery = useQuery({
    ...getKnowledgeByAudienceQueryOptions('bubble'),
    enabled: !searchEnabled && audienceFilter === '',
  });
  const singleQuery = useQuery({
    ...getKnowledgeByAudienceQueryOptions(
      (audienceFilter || 'human') as 'human' | 'agent' | 'bubble'
    ),
    enabled: !searchEnabled && audienceFilter !== '',
  });

  const allNotes: KnowledgeNoteRef[] = useMemo(() => {
    if (audienceFilter !== '') return [];
    const seen = new Set<string>();
    const merged: KnowledgeNoteRef[] = [];
    for (const note of [
      ...(humanQuery.data ?? []),
      ...(agentQuery.data ?? []),
      ...(bubbleQuery.data ?? []),
    ]) {
      if (!seen.has(note.path)) {
        seen.add(note.path);
        merged.push(note);
      }
    }
    return merged;
  }, [audienceFilter, humanQuery.data, agentQuery.data, bubbleQuery.data]);

  const isLoading = searchEnabled
    ? searchQuery.isLoading
    : audienceFilter === ''
      ? humanQuery.isLoading || agentQuery.isLoading || bubbleQuery.isLoading
      : singleQuery.isLoading;
  const error = searchEnabled
    ? searchQuery.error
    : audienceFilter === ''
      ? (humanQuery.error ?? agentQuery.error ?? bubbleQuery.error)
      : singleQuery.error;
  const notes: KnowledgeNoteRef[] = searchEnabled
    ? (searchQuery.data ?? [])
    : audienceFilter === ''
      ? allNotes
      : (singleQuery.data ?? []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void navigate({
      search: (prev) => ({
        ...prev,
        q: draftQ || undefined,
        // Clear collection when search becomes active — they must not coexist
        collection: draftQ ? undefined : prev.collection,
      }),
    });
  };

  const handleCollection = (value: CollectionFilter) => {
    setPage(1);
    void navigate({
      search: (prev) => ({
        ...prev,
        collection: value || undefined,
        q: undefined,
      }),
    });
    setDraftQ('');
  };

  const summaryItems = [
    { label: 'Notes', value: isLoading ? '…' : String(notes.length) },
    {
      label: 'View',
      value: searchEnabled ? 'Search' : audienceFilter || 'All',
    },
  ] as const;

  const primaryContent = (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <div className="min-w-0 flex-1">
          <GlassInput
            type="search"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="Search notes…"
            className="min-w-0"
          />
        </div>
        <button
          type="submit"
          className={cn(
            'rounded-xl px-4 py-2 text-sm transition-all duration-200',
            'bg-white/10 backdrop-blur-sm border border-white/20 text-white/70',
            'hover:bg-white/15 hover:text-white cursor-pointer'
          )}
        >
          Search
        </button>
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setDraftQ('');
              void navigate({ search: (prev) => ({ ...prev, q: undefined }) });
            }}
            className={cn(
              'rounded-xl px-3 py-2 text-sm transition-all duration-200',
              'bg-white/10 backdrop-blur-sm border border-white/20 text-white/60',
              'hover:bg-white/15 hover:text-white cursor-pointer'
            )}
          >
            ✕
          </button>
        )}
      </form>

      <GlassCard variant="light" glowEffect={false} className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/60">
            Collection
          </p>
          {COLLECTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleCollection(opt.value as CollectionFilter)}
              className={cn(
                'rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 cursor-pointer',
                audienceFilter === opt.value && !searchEnabled
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/60 hover:bg-white/10 hover:text-white/80'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {!searchEnabled && (
          <p className="mt-2 text-xs text-white/60">
            Use the search bar to find notes by content or tags.
          </p>
        )}
      </GlassCard>

      {/* Results */}
      {isLoading ? (
        <RouteLoadingState label="Loading notes index..." />
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-300" role="alert">
          {error.message}
        </p>
      ) : (
        <NoteGrid notes={notes} page={page} onPage={setPage} />
      )}
    </div>
  );

  return (
    <WorkspaceScaffold
      title="Notes"
      subtitle="Browse and search vault notes."
      summaryItems={summaryItems}
      primaryTitle={searchEnabled ? `Results for "${q}"` : 'Notes'}
      primary={primaryContent}
    />
  );
}
