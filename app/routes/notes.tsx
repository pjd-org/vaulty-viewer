import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { WorkspaceScaffold } from '../components/layout/WorkspaceScaffold';
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
      <p className="py-12 text-center text-sm text-slate-500">
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

  // Otherwise use the audience/collection endpoint
  const audienceFilter = (collection as CollectionFilter) ?? '';
  const audienceKey = audienceFilter || 'human';
  const browseQuery = useQuery({
    ...getKnowledgeByAudienceQueryOptions(
      audienceKey as 'human' | 'agent' | 'bubble'
    ),
    enabled: !searchEnabled,
  });

  const isLoading = searchEnabled
    ? searchQuery.isLoading
    : browseQuery.isLoading;
  const error = searchEnabled ? searchQuery.error : browseQuery.error;
  const notes: KnowledgeNoteRef[] = searchEnabled
    ? (searchQuery.data ?? [])
    : (browseQuery.data ?? []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void navigate({ search: (prev) => ({ ...prev, q: draftQ || undefined }) });
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
          className="flex-1 rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/8"
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
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:bg-white/8"
          >
            ✕
          </button>
        )}
      </form>

      {/* Results */}
      {isLoading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-400" role="alert">
          {error.message}
        </p>
      ) : (
        <NoteGrid notes={notes} />
      )}
    </div>
  );

  const asideContent = (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-slate-500">
          Collection
        </p>
        <div className="flex flex-col gap-1">
          {COLLECTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleCollection(opt.value as CollectionFilter)}
              className={[
                'rounded-lg px-3 py-2 text-left text-sm transition',
                audienceFilter === opt.value && !searchEnabled
                  ? 'bg-sky-400/15 text-sky-300'
                  : 'text-slate-400 hover:bg-white/8 hover:text-slate-200',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!searchEnabled && (
        <div className="pt-2">
          <p className="text-[11px] text-slate-600">
            Use the search bar to find notes by content or tags.
          </p>
        </div>
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
      asideTitle="Filter"
      aside={asideContent}
    />
  );
}
