import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';

import KnowledgeNoteCard from '../../../src/components/KnowledgeNoteCard';
import KnowledgeHealthBanner, {
  type GraphHealthReport,
} from '../../../src/components/KnowledgeHealthBanner';
import { SkeletonCardGrid } from '../../../src/components/Skeletons';
import { KnowledgeWorkspacePane } from './KnowledgeWorkspacePane';
import {
  useKnowledgeSurface,
  useKnowledgeHealth,
  useKnowledgeByAudience,
  type KnowledgeNoteRef,
} from '../../lib/viewer-adapter';

interface KnowledgeWorkspaceSurfaceProps {
  noteId?: string;
  mode?: 'read' | 'edit';
  projectId?: string;
  templateId?: string;
  memoryTab?: string;
  workspaceSearch?: Record<string, unknown>;
  workspaceTo?: string;
  workspaceParams?: Record<string, string>;
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

const filterPillClass =
  'flex items-center gap-1.5 rounded-full border border-[var(--border-glass)] bg-[var(--surf-utility)] px-3 py-1.5 text-xs text-[var(--text-secondary)]';
const filterLabelClass =
  'font-medium text-[var(--text-tertiary)] uppercase tracking-widest';
const filterSelectClass =
  'bg-transparent border-none text-[var(--text-secondary)] text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_28%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';
const railSectionTitleClass =
  'text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-2';
const railListItemClass = 'text-sm text-[var(--text-secondary)]';

function getAllDomains(notes: KnowledgeNoteRef[]): string[] {
  const domains = new Set<string>();
  for (const note of notes) {
    if (note.domain) domains.add(note.domain);
  }
  return Array.from(domains).sort();
}

function filterNotes(
  notes: KnowledgeNoteRef[],
  domain: string,
  maturity: string
): KnowledgeNoteRef[] {
  return notes.filter((n) => {
    if (domain && n.domain !== domain) return false;
    if (maturity && n.status !== maturity) return false;
    return true;
  });
}

const AUDIENCE_META: Record<string, { description: string; hint: string }> = {
  human: {
    description:
      'Notes authored for human review — decisions, context, guides.',
    hint: 'Add a note with audience: human in its frontmatter.',
  },
  agent: {
    description: 'Instructions and memory for agent runtime consumption.',
    hint: 'Add a note with audience: agent to surface it here.',
  },
  bubble: {
    description: 'Shared context that floats between human and agent layers.',
    hint: 'Add a note with audience: bubble to bridge both layers.',
  },
};

function AudienceColumn({
  audience,
  notes,
  loading,
  selectedNoteId,
  workspaceSearch,
  workspaceTo,
  workspaceParams,
}: {
  audience: string;
  notes: KnowledgeNoteRef[];
  loading: boolean;
  selectedNoteId?: string;
  workspaceSearch?: Record<string, unknown>;
  workspaceTo?: string;
  workspaceParams?: Record<string, string>;
}) {
  if (loading) return <SkeletonCardGrid count={3} />;
  if (notes.length === 0) {
    const meta = AUDIENCE_META[audience] ?? {
      description: `No ${audience} notes yet.`,
      hint: '',
    };
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-glass)] bg-[color-mix(in_srgb,var(--surf-utility)_60%,transparent)] p-4 flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          {audience}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          {meta.description}
        </p>
        {meta.hint && (
          <p className="text-xs text-[var(--text-tertiary)] border-l border-[var(--border-glass-soft)] pl-2">
            {meta.hint}
          </p>
        )}
        <Link
          to="/primary-agent"
          search={{}}
          className="inline-block mt-1 text-xs text-[var(--text-info)] hover:underline"
        >
          Ask Primary Agent to help author →
        </Link>
      </div>
    );
  }
  return (
    <div className="knowledge-col__notes">
      {notes.map((note) => (
        <KnowledgeNoteCard
          key={note.path}
          {...note}
          workspaceLink
          workspaceTo={workspaceTo}
          workspaceParams={workspaceParams}
          selected={selectedNoteId ? note.path === selectedNoteId : false}
          workspaceSearch={workspaceSearch}
        />
      ))}
    </div>
  );
}

export function KnowledgeWorkspaceSurface({
  noteId,
  mode,
  projectId,
  templateId,
  memoryTab,
  workspaceSearch,
  workspaceTo,
  workspaceParams,
  accentColor: _accentColor,
}: KnowledgeWorkspaceSurfaceProps) {
  const [domainFilter, setDomainFilter] = useState('');
  const [maturityFilter, setMaturityFilter] = useState('');

  const { data: health, isLoading: healthLoading } = useKnowledgeHealth();
  const { data: humanNotes = [], isLoading: humanLoading } =
    useKnowledgeByAudience('human');
  const { data: agentNotes = [], isLoading: agentLoading } =
    useKnowledgeByAudience('agent');
  const { data: bubbleNotes = [], isLoading: bubbleLoading } =
    useKnowledgeByAudience('bubble');
  const { data: adapterData, isLoading: adapterLoading } =
    useKnowledgeSurface();

  const notesLoading = humanLoading || agentLoading || bubbleLoading;

  const allNotes = [...humanNotes, ...agentNotes, ...bubbleNotes];
  const allDomains = getAllDomains(allNotes);

  const filteredHuman = filterNotes(humanNotes, domainFilter, maturityFilter);
  const filteredAgent = filterNotes(agentNotes, domainFilter, maturityFilter);
  const filteredBubble = filterNotes(bubbleNotes, domainFilter, maturityFilter);
  const allVisibleNotes = [
    ...filteredHuman,
    ...filteredAgent,
    ...filteredBubble,
  ];
  const workspaceNoteId = noteId ?? allVisibleNotes[0]?.path;
  const targetTo = workspaceTo ?? '/knowledge';

  return (
    <>
      <KnowledgeHealthBanner
        health={(health as GraphHealthReport | undefined) ?? null}
        loading={healthLoading}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Domain filter */}
            <div className={filterPillClass}>
              <span className={filterLabelClass}>Domain</span>
              <select
                id="knowledge-domain-filter"
                aria-label="Filter notes by domain"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className={filterSelectClass}
              >
                <option value="">All</option>
                {allDomains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Maturity filter */}
            <div className={filterPillClass}>
              <span className={filterLabelClass}>Maturity</span>
              <select
                id="knowledge-maturity-filter"
                aria-label="Filter notes by maturity"
                value={maturityFilter}
                onChange={(e) => setMaturityFilter(e.target.value)}
                className={filterSelectClass}
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="stable">Stable</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>

            {/* Active filter chips */}
            {(domainFilter || maturityFilter) && (
              <button
                type="button"
                onClick={() => {
                  setDomainFilter('');
                  setMaturityFilter('');
                }}
                className="btn-secondary cursor-pointer rounded-full px-3 py-1.5 text-xs transition-colors"
              >
                Clear filters ×
              </button>
            )}
          </div>

          <div className="knowledge-grid">
            <section className="knowledge-col">
              <h2 className="knowledge-col__title">Human</h2>
              <AudienceColumn
                audience="human"
                notes={filteredHuman}
                loading={notesLoading}
                selectedNoteId={workspaceNoteId}
                workspaceSearch={workspaceSearch}
                workspaceTo={targetTo}
                workspaceParams={workspaceParams}
              />
            </section>
            <section className="knowledge-col">
              <h2 className="knowledge-col__title">Agent</h2>
              <AudienceColumn
                audience="agent"
                notes={filteredAgent}
                loading={notesLoading}
                selectedNoteId={workspaceNoteId}
                workspaceSearch={workspaceSearch}
                workspaceTo={targetTo}
                workspaceParams={workspaceParams}
              />
            </section>
            <section className="knowledge-col">
              <h2 className="knowledge-col__title">Bubble</h2>
              <AudienceColumn
                audience="bubble"
                notes={filteredBubble}
                loading={notesLoading}
                selectedNoteId={workspaceNoteId}
                workspaceSearch={workspaceSearch}
                workspaceTo={targetTo}
                workspaceParams={workspaceParams}
              />
            </section>
          </div>
        </section>

        {/* ── Right column: workspace pane + adapter context rail ── */}
        <div className="flex flex-col gap-4">
          <KnowledgeWorkspacePane
            noteId={workspaceNoteId}
            mode={mode}
            projectId={projectId}
            templateId={templateId}
            memoryTab={memoryTab}
            workspaceSearch={workspaceSearch}
          />

          {/* ── Adapter context rail ────────────────────────────── */}
          {adapterLoading ? (
            <aside
              className="knowledge-adapter-rail"
              data-testid="knowledge-adapter-loading"
            >
              <p className="text-sm text-[var(--text-tertiary)]">
                Loading adapter context…
              </p>
            </aside>
          ) : adapterData ? (
            <aside className="knowledge-adapter-rail flex flex-col gap-4">
              {adapterData.selectedContext.length > 0 && (
                <section>
                  <h3 className={railSectionTitleClass}>Active context</h3>
                  <ul className="flex flex-col gap-1">
                    {adapterData.selectedContext.map((ctx) => (
                      <li key={ctx.id} className={railListItemClass}>
                        {ctx.title}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* TODO: linkedEntities render deferred — present in payload, Phase 6 will surface them. */}

              {/* suggestedTemplates intentionally omitted — always [] until API returns template metadata. */}

              {adapterData.suggestedActions.length > 0 && (
                <section>
                  <h3 className={railSectionTitleClass}>Suggested actions</h3>
                  <ul className="flex flex-col gap-1">
                    {adapterData.suggestedActions.map((action) => (
                      <li
                        key={`${action.actionType}-${action.label}`}
                        className={railListItemClass}
                      >
                        {action.label}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}
