import React, { useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { WorkspaceScaffold } from '../components/layout/WorkspaceScaffold';
import { RouteLoadingState } from '../components/ui';
import { KnowledgeNoteCard } from '../../src/components/KnowledgeNoteCard';
import { notesSearchParams } from '../../src/lib/routes/search-params';
import {
  getKnowledgeByAudienceQueryOptions,
  getKnowledgeSearchQueryOptions,
  type KnowledgeNoteRef,
} from '../lib/viewer-adapter';

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

// ---------------------------------------------------------------------------
// NoteGrid
// ---------------------------------------------------------------------------

function NoteGrid({ notes }: { notes: KnowledgeNoteRef[] }) {
  if (notes.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No notes found.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {notes.map((note) => (
        <KnowledgeNoteCard
          key={note.path}
          path={note.path}
          title={note.title}
          audience={note.audience}
          domain={note.domain}
          tags={note.tags}
          status={note.status}
        />
      ))}
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
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={draftQ}
          onChange={(e) => setDraftQ(e.target.value)}
          placeholder="Search notes…"
          className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted/60"
        >
          Search
        </button>
        {q && (
          <button
            type="button"
            onClick={() => {
              setDraftQ('');
              void navigate({ search: (prev) => ({ ...prev, q: undefined }) });
            }}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/60"
          >
            ✕
          </button>
        )}
      </form>

      <div className="space-y-3 rounded-2xl border border-border bg-card/75 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Collection
          </p>
          {COLLECTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleCollection(opt.value as CollectionFilter)}
              className={[
                'rounded-lg px-3 py-2 text-left text-sm transition',
                audienceFilter === opt.value && !searchEnabled
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {!searchEnabled && (
          <p className="text-xs text-muted-foreground">
            Use the search bar to find notes by content or tags.
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <RouteLoadingState label="Loading notes index..." />
      ) : error ? (
        <p className="py-8 text-center text-sm text-destructive" role="alert">
          {error.message}
        </p>
      ) : (
        <NoteGrid notes={notes} />
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
