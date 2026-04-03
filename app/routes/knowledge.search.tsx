import React, { useCallback, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  useKnowledgeHealth,
  useKnowledgeSearch,
  type KnowledgeNoteRef,
} from '../lib/viewer-adapter';
import KnowledgeNoteCard from '../../src/components/KnowledgeNoteCard';
import KnowledgeHealthBanner from '../../src/components/KnowledgeHealthBanner';

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
  // Debounced query that actually triggers the search
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

  return (
    <main className="page">
      <header className="page-header">
        <h1>Knowledge Search</h1>
      </header>

      <KnowledgeHealthBanner health={health ?? null} loading={false} />

      <form className="knowledge-search__form" onSubmit={handleSubmit}>
        <input
          type="search"
          className="knowledge-search__input"
          value={q}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search knowledge notes…"
        />
        <div className="knowledge-search__mode-toggle">
          <button
            type="button"
            className={`knowledge-search__mode-btn${mode === 'tag' ? ' knowledge-search__mode-btn--active' : ''}`}
            onClick={() => handleModeChange('tag')}
          >
            Structural
          </button>
          <button
            type="button"
            className={`knowledge-search__mode-btn${mode === 'semantic' ? ' knowledge-search__mode-btn--active' : ''}`}
            onClick={() => handleModeChange('semantic')}
          >
            Semantic
          </button>
        </div>
        <button type="submit" className="knowledge-search__submit">
          Search
        </button>
      </form>

      {searchError && (
        <div className="knowledge-search__error" role="alert">
          <p>Search failed: {searchError.message}</p>
        </div>
      )}

      {searching && <div className="knowledge-search__loading">Searching…</div>}

      {!searching &&
        !searchError &&
        displayResults.length === 0 &&
        debouncedQ.trim() !== '' && (
          <p className="knowledge-search__empty">
            No results for "{debouncedQ}".
          </p>
        )}

      <div className="knowledge-search__results">
        {displayResults.map((note) => (
          <KnowledgeNoteCard key={note.path} {...note} />
        ))}
      </div>
    </main>
  );
}
