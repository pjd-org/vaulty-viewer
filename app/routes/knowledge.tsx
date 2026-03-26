import React, { useEffect, useReducer, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { apiFetch } from '../../src/utils/api';
import KnowledgeNoteCard from '../../src/components/KnowledgeNoteCard';
import KnowledgeHealthBanner, { type GraphHealthReport } from '../../src/components/KnowledgeHealthBanner';
import { SkeletonCardGrid } from '../../src/components/Skeletons';

export const Route = createFileRoute('/knowledge')({
  component: KnowledgeRoute,
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

type AudienceData = { audience: string; notes: NoteRef[] };

function getAllDomains(notes: NoteRef[]): string[] {
  const domains = new Set<string>();
  for (const note of notes) {
    if (note.domain) domains.add(note.domain);
  }
  return Array.from(domains).sort();
}

function filterNotes(notes: NoteRef[], domain: string, maturity: string): NoteRef[] {
  return notes.filter((n) => {
    if (domain && n.domain !== domain) return false;
    if (maturity && n.status !== maturity) return false;
    return true;
  });
}

function AudienceColumn({ audience, notes, loading }: { audience: string; notes: NoteRef[]; loading: boolean }) {
  if (loading) return <SkeletonCardGrid count={3} />;
  if (notes.length === 0) {
    return <p className="knowledge-col__empty">No {audience} knowledge notes yet.</p>;
  }
  return (
    <div className="knowledge-col__notes">
      {notes.map((note) => (
        <KnowledgeNoteCard key={note.path} {...note} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type KnowledgeState = {
  health: GraphHealthReport | null;
  healthLoading: boolean;
  audienceData: Record<string, NoteRef[]>;
  notesLoading: boolean;
};

type KnowledgeAction =
  | { type: 'HEALTH_LOADED'; health: GraphHealthReport | null }
  | { type: 'NOTES_LOADED'; audienceData: Record<string, NoteRef[]> };

function knowledgeReducer(state: KnowledgeState, action: KnowledgeAction): KnowledgeState {
  switch (action.type) {
    case 'HEALTH_LOADED':
      return { ...state, health: action.health, healthLoading: false };
    case 'NOTES_LOADED':
      return { ...state, audienceData: action.audienceData, notesLoading: false };
  }
}

function KnowledgeRoute() {
  const [{ health, healthLoading, audienceData, notesLoading }, dispatch] = useReducer(
    knowledgeReducer,
    { health: null, healthLoading: true, audienceData: { human: [], agent: [], bubble: [] }, notesLoading: true },
  );
  const [domainFilter, setDomainFilter] = useState('');
  const [maturityFilter, setMaturityFilter] = useState('');

  useEffect(() => {
    apiFetch('/api/knowledge/health')
      .then((r) => r.json())
      .then((data) => dispatch({ type: 'HEALTH_LOADED', health: data as GraphHealthReport }))
      .catch(() => dispatch({ type: 'HEALTH_LOADED', health: null }));

    const audiences = ['human', 'agent', 'bubble'] as const;
    Promise.all(
      audiences.map((a) =>
        apiFetch(`/api/knowledge/by-audience?audience=${a}`)
          .then((r) => r.json())
          .then((data) => data as AudienceData)
          .catch(() => ({ audience: a, notes: [] } as AudienceData))
      )
    ).then((results) => {
      const map: Record<string, NoteRef[]> = {};
      for (const r of results) map[r.audience] = r.notes;
      dispatch({ type: 'NOTES_LOADED', audienceData: map });
    });
  }, []);

  const allNotes = [...(audienceData.human ?? []), ...(audienceData.agent ?? []), ...(audienceData.bubble ?? [])];
  const allDomains = getAllDomains(allNotes);

  const filteredHuman = filterNotes(audienceData.human ?? [], domainFilter, maturityFilter);
  const filteredAgent = filterNotes(audienceData.agent ?? [], domainFilter, maturityFilter);
  const filteredBubble = filterNotes(audienceData.bubble ?? [], domainFilter, maturityFilter);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Knowledge</h1>
      </header>

      <KnowledgeHealthBanner health={health} loading={healthLoading} />

      <div className="knowledge-filters">
        <label htmlFor="knowledge-domain-filter">Domain</label>
        <select
          id="knowledge-domain-filter"
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
        >
          <option value="">All domains</option>
          {allDomains.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <label htmlFor="knowledge-maturity-filter">Maturity</label>
        <select
          id="knowledge-maturity-filter"
          value={maturityFilter}
          onChange={(e) => setMaturityFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="stable">Stable</option>
          <option value="deprecated">Deprecated</option>
        </select>
      </div>

      <div className="knowledge-grid">
        <section className="knowledge-col">
          <h2 className="knowledge-col__title">Human</h2>
          <AudienceColumn audience="human" notes={filteredHuman} loading={notesLoading} />
        </section>
        <section className="knowledge-col">
          <h2 className="knowledge-col__title">Agent</h2>
          <AudienceColumn audience="agent" notes={filteredAgent} loading={notesLoading} />
        </section>
        <section className="knowledge-col">
          <h2 className="knowledge-col__title">Bubble</h2>
          <AudienceColumn audience="bubble" notes={filteredBubble} loading={notesLoading} />
        </section>
      </div>
    </main>
  );
}
