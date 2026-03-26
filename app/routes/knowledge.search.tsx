import React, { useEffect, useReducer, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { apiFetch } from '../../src/utils/api';
import KnowledgeNoteCard from '../../src/components/KnowledgeNoteCard';
import KnowledgeHealthBanner, { type GraphHealthReport } from '../../src/components/KnowledgeHealthBanner';

export const Route = createFileRoute('/knowledge/search')({
  validateSearch: (search) => ({
    q: (search.q as string) ?? '',
    mode: ((search.mode as string) === 'semantic' ? 'semantic' : 'tag') as 'tag' | 'semantic',
  }),
  component: KnowledgeSearchRoute,
});

type NoteRef = {
  path: string;
  title: string;
  type?: string;
  audience?: string | null;
  domain?: string;
  tags?: string[];
  status?: string;
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type SearchState = {
  q: string;
  mode: 'tag' | 'semantic';
  results: NoteRef[];
  searching: boolean;
};

type SearchAction =
  | { type: 'SET_Q'; q: string }
  | { type: 'SET_MODE'; mode: 'tag' | 'semantic' }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_DONE'; results: NoteRef[] };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_Q': return { ...state, q: action.q };
    case 'SET_MODE': return { ...state, mode: action.mode };
    case 'SEARCH_START': return { ...state, searching: true };
    case 'SEARCH_DONE': return { ...state, searching: false, results: action.results };
  }
}

function KnowledgeSearchRoute() {
  const { q: initialQ, mode: initialMode } = Route.useSearch();
  const navigate = useNavigate({ from: '/knowledge/search' });

  const [{ q, mode, results, searching }, dispatch] = useReducer(searchReducer, {
    q: initialQ,
    mode: initialMode,
    results: [],
    searching: false,
  });
  const [health, setHealth] = useState<GraphHealthReport | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch('/api/knowledge/health')
      .then((r) => r.json())
      .then((data) => setHealth(data as GraphHealthReport))
      .catch(() => setHealth(null));
  }, []);

  const doSearch = (query: string, searchMode: 'tag' | 'semantic') => {
    if (!query.trim()) {
      dispatch({ type: 'SEARCH_DONE', results: [] });
      return;
    }
    dispatch({ type: 'SEARCH_START' });
    apiFetch(`/api/knowledge/search?q=${encodeURIComponent(query)}&mode=${searchMode}`)
      .then((r) => r.json())
      .then((data) => dispatch({ type: 'SEARCH_DONE', results: (data as { results: NoteRef[] }).results ?? [] }))
      .catch(() => dispatch({ type: 'SEARCH_DONE', results: [] }));
  };

  const handleQueryChange = (newQ: string) => {
    dispatch({ type: 'SET_Q', q: newQ });
    navigate({ search: { q: newQ, mode } });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(newQ, mode), 300);
  };

  const handleModeChange = (newMode: 'tag' | 'semantic') => {
    dispatch({ type: 'SET_MODE', mode: newMode });
    navigate({ search: { q, mode: newMode } });
    doSearch(q, newMode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSearch(q, mode);
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1>Knowledge Search</h1>
      </header>

      <KnowledgeHealthBanner health={health} loading={false} />

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
        <button type="submit" className="knowledge-search__submit">Search</button>
      </form>

      {searching && <div className="knowledge-search__loading">Searching…</div>}

      {!searching && results.length === 0 && q.trim() !== '' && (
        <p className="knowledge-search__empty">No results for "{q}".</p>
      )}

      <div className="knowledge-search__results">
        {results.map((note) => (
          <KnowledgeNoteCard key={note.path} {...note} />
        ))}
      </div>
    </main>
  );
}
