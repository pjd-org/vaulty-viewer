import React, { useEffect, useMemo, useReducer } from 'react';
import { Link } from '@tanstack/react-router';
import sanitizeHtml from 'sanitize-html';

import { apiFetch } from '../../../src/utils/api';
import {
  formatNoteLabel,
  getLifecycleContext,
  renderNoteMarkdown,
  stripMarkdownExtension,
  toApiNotePath,
  toNoteSearchPath,
  type NoteLifecycle,
} from '../../../src/lib/note-logic';
import { toNoteHeaderDisplay } from '../../lib/display';
import { NoteBodyRenderer, NoteHeader, NoteMetaRail } from '../note';
import { SoftPanel } from '../layout';
import { EmptyState, SoftChip } from '../ui';

interface RelatedNote {
  path: string;
  score: number;
  reasons?: string[];
}

interface LoadedNote {
  path: string;
  searchPath: string;
  title: string;
  tags: string[];
  collection: string;
  content: string;
  html: string;
  frontmatter: Record<string, unknown>;
  lifecycle: NoteLifecycle;
}

interface WorkspaceState {
  note: LoadedNote | null;
  relatedNotes: RelatedNote[];
  loading: boolean;
  error: string | null;
}

type WorkspaceAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'LOAD_DONE'; note: LoadedNote; relatedNotes: RelatedNote[] }
  | { type: 'CLEAR' };

interface KnowledgeWorkspacePaneProps {
  noteId?: string;
  mode?: 'read' | 'edit';
  projectId?: string;
  templateId?: string;
  memoryTab?: string;
  workspaceSearch?: Record<string, unknown>;
}

const sanitizeOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'code',
    'pre',
    'kbd',
    'mark',
    'details',
    'summary',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    code: ['class'],
    pre: ['class'],
    '*': ['class', 'id'],
  },
} as const;

function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction
): WorkspaceState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_ERROR':
      return {
        note: null,
        relatedNotes: [],
        loading: false,
        error: action.error,
      };
    case 'LOAD_DONE':
      return {
        note: action.note,
        relatedNotes: action.relatedNotes,
        loading: false,
        error: null,
      };
    case 'CLEAR':
      return { note: null, relatedNotes: [], loading: false, error: null };
  }
}

function getStringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function KnowledgeWorkspacePane({
  noteId,
  mode = 'read',
  projectId,
  templateId,
  memoryTab,
  workspaceSearch,
}: KnowledgeWorkspacePaneProps) {
  const [{ note, relatedNotes, loading, error }, dispatch] = useReducer(
    workspaceReducer,
    {
      note: null,
      relatedNotes: [],
      loading: false,
      error: null,
    }
  );

  useEffect(() => {
    const requestedPath = noteId ? toNoteSearchPath(noteId) : null;

    if (!requestedPath) {
      dispatch({ type: 'CLEAR' });
      return;
    }

    let cancelled = false;
    dispatch({ type: 'LOAD_START' });

    const loadNote = async () => {
      const apiPath = toApiNotePath(requestedPath);
      const encodedPath = encodeURIComponent(apiPath);

      const [noteResponse, relatedResponse] = await Promise.all([
        apiFetch(`/api/v1/notes/${encodedPath}`),
        apiFetch(`/api/v1/graph/related/${encodedPath}?limit=8`),
      ]);

      if (!noteResponse.ok) {
        throw new Error(`Note not found: ${requestedPath}`);
      }

      const noteResult = await noteResponse.json();
      const structured = noteResult.structuredContent || {};
      const frontmatter = (structured.frontmatter || {}) as Record<
        string,
        unknown
      >;
      const resolvedPath = getStringValue(structured.path) || apiPath;
      const rawContent = getStringValue(structured.content) || '';
      const lifecycle = getLifecycleContext(resolvedPath, frontmatter);

      const loadedNote: LoadedNote = {
        path: resolvedPath,
        searchPath: stripMarkdownExtension(resolvedPath),
        title:
          getStringValue(frontmatter.title) ||
          formatNoteLabel(
            stripMarkdownExtension(resolvedPath).split('/').pop() || ''
          ),
        tags: Array.isArray(frontmatter.tags)
          ? frontmatter.tags.map((tag) => String(tag))
          : [],
        collection: stripMarkdownExtension(resolvedPath).split('/')[0] ?? '',
        content: rawContent,
        html: renderNoteMarkdown(rawContent),
        frontmatter,
        lifecycle,
      };

      const relatedResult = relatedResponse.ok
        ? await relatedResponse.json()
        : null;
      const nextRelated: RelatedNote[] = (relatedResult?.structuredContent
        ?.related ??
        relatedResult?.related ??
        []) as RelatedNote[];

      if (!cancelled) {
        dispatch({
          type: 'LOAD_DONE',
          note: loadedNote,
          relatedNotes: nextRelated,
        });
      }
    };

    void loadNote().catch((err) => {
      if (!cancelled) {
        dispatch({
          type: 'LOAD_ERROR',
          error:
            err instanceof Error
              ? err.message
              : 'Unable to load the selected note.',
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [noteId]);

  const modeLabel = mode === 'edit' ? 'Edit mode' : 'Read mode';
  const summaryChips = useMemo(
    () =>
      [
        <SoftChip key="mode" label={modeLabel} variant="default" />,
        projectId ? (
          <SoftChip
            key="project"
            label={`Project ${projectId}`}
            variant="default"
          />
        ) : null,
        templateId ? (
          <SoftChip
            key="template"
            label={`Template ${templateId}`}
            variant="default"
          />
        ) : null,
        memoryTab ? (
          <SoftChip
            key="memory"
            label={`Memory ${memoryTab}`}
            variant="default"
          />
        ) : null,
      ].filter(Boolean),
    [memoryTab, modeLabel, projectId, templateId]
  );

  const selectedLabel = note ? note.title : 'Select a note';

  return (
    <div className="space-y-4">
      <SoftPanel
        variant="utility"
        title="Active note"
        subtitle="Authoring workspace and context operations"
      >
        <div className="flex flex-wrap gap-2">{summaryChips}</div>

        {!noteId && (
          <EmptyState
            title="Select a note from the browser"
            description="Open a note on the left to load its editor, metadata, and related references."
          />
        )}

        {loading && (
          <EmptyState
            title="Loading note"
            description="Fetching the selected note and its related references."
          />
        )}

        {!loading && error && (
          <EmptyState title="Note unavailable" description={error} />
        )}

        {!loading && !error && note && (
          <div className="space-y-4 animate-fade-in">
            <NoteHeader
              display={toNoteHeaderDisplay({
                title: note.title,
                type: getStringValue(note.frontmatter.type),
                status: getStringValue(note.frontmatter.status),
                path: note.path,
              })}
              extraActions={
                <>
                  <Link
                    to="/note"
                    search={{ p: note.searchPath }}
                    className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-black/5"
                  >
                    Open full editor
                  </Link>
                  <Link
                    to="/knowledge/search"
                    search={
                      ((prev: Record<string, unknown>) => ({
                        ...prev,
                        q: note.title,
                        mode: 'semantic',
                      })) as never
                    }
                    className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-black/5"
                  >
                    Search around note
                  </Link>
                  <Link
                    to="/knowledge/graph"
                    className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-black/5"
                  >
                    Open graph
                  </Link>
                </>
              }
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.9fr)]">
              <SoftPanel
                variant="utility"
                title="Preview"
                subtitle={selectedLabel}
              >
                <NoteBodyRenderer
                  html={sanitizeHtml(note.html, sanitizeOptions)}
                />
              </SoftPanel>

              <NoteMetaRail
                frontmatter={note.frontmatter}
                lifecycle={note.lifecycle}
                relatedNotes={relatedNotes}
                path={note.path}
                workspaceLink
                workspaceSearch={workspaceSearch}
              />
            </div>

            <SoftPanel
              variant="utility"
              title="Workspace actions"
              subtitle="Context operations for the selected note"
            >
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/note"
                  search={{ p: note.searchPath }}
                  className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-black/5"
                >
                  Open note in editor
                </Link>
                <Link
                  to="/knowledge/search"
                  search={
                    ((prev: Record<string, unknown>) => ({
                      ...prev,
                      q: note.title,
                      mode: 'semantic',
                    })) as never
                  }
                  className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-black/5"
                >
                  Search related context
                </Link>
                <Link
                  to="/knowledge/graph"
                  className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-black/5"
                >
                  Open knowledge graph
                </Link>
              </div>
            </SoftPanel>
          </div>
        )}
      </SoftPanel>
    </div>
  );
}
