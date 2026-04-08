import React from 'react';
import { Link } from '@tanstack/react-router';
import {
  toNoteSearchPath,
  formatNoteLabel,
  stripMarkdownExtension,
} from '../lib/note-logic';

/** Returns true if the title is a YAML artifact or otherwise non-displayable. */
function isBadTitle(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length === 0 ||
    trimmed === '>-' ||
    trimmed === '>' ||
    trimmed === '-' ||
    /^[^a-zA-Z0-9]+$/.test(trimmed)
  );
}

/** Derives a human-readable label from a vault path. */
function labelFromPath(path: string): string {
  const slug = stripMarkdownExtension(path).split('/').pop() ?? path;
  return formatNoteLabel(slug) || 'Untitled';
}

interface KnowledgeNoteCardProps {
  path: string;
  title: string;
  audience?: string | null;
  domain?: string;
  tags?: string[];
  status?: string;
  workspaceLink?: boolean;
  workspaceTo?: string;
  workspaceParams?: Record<string, string>;
  selected?: boolean;
  workspaceSearch?: Record<string, unknown>;
}

const audienceColor: Record<string, string> = {
  human: 'bg-sky-100 text-sky-700',
  agent: 'bg-violet-100 text-violet-700',
  bubble: 'bg-emerald-100 text-emerald-700',
};

const maturityColor: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-500',
  stable: 'bg-emerald-100 text-emerald-700',
  deprecated: 'bg-red-100 text-red-600',
};

export function KnowledgeNoteCard({
  path,
  title,
  audience,
  domain,
  tags,
  status,
  workspaceLink = false,
  workspaceTo,
  workspaceParams,
  selected = false,
  workspaceSearch,
}: KnowledgeNoteCardProps) {
  const to = workspaceLink ? (workspaceTo ?? '/knowledge') : '/note';
  const search = workspaceLink
    ? { ...(workspaceSearch ?? {}), noteId: path }
    : { p: toNoteSearchPath(path) };

  const displayTitle = isBadTitle(title) ? labelFromPath(path) : title;

  return (
    <Link
      to={to}
      params={workspaceLink ? workspaceParams : undefined}
      search={search}
      aria-current={selected ? 'page' : undefined}
      className={[
        'group block p-4 rounded-xl border transition-all duration-[var(--vault-duration-snappy)]',
        selected
          ? 'border-sky-300/60 bg-sky-50 shadow-vault-sm'
          : 'bg-white/80 border-slate-200 hover:border-sky-300/60 hover:shadow-vault-sm',
      ].join(' ')}
    >
      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {audience && audienceColor[audience] && (
          <span
            className={`font-manrope text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${audienceColor[audience]}`}
          >
            {audience}
          </span>
        )}
        {status && maturityColor[status] && (
          <span
            className={`font-manrope text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${maturityColor[status]}`}
          >
            {status}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-space-grotesk font-semibold text-sm text-slate-800 leading-snug group-hover:text-sky-700 transition-colors line-clamp-2">
        {displayTitle}
      </h3>

      {/* Domain + tags */}
      {(domain || (tags && tags.length > 0)) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {domain && (
            <span className="font-manrope text-[10px] px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded">
              {domain}
            </span>
          )}
          {tags &&
            tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="font-manrope text-[10px] px-1.5 py-0.5 bg-black/5 text-slate-500 rounded"
              >
                #{tag}
              </span>
            ))}
          {tags && tags.length > 3 && (
            <span className="font-manrope text-[10px] text-slate-400">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-3">
        <span className="font-manrope text-[10px] uppercase tracking-widest text-sky-700 opacity-0 group-hover:opacity-100 transition-opacity">
          Open →
        </span>
      </div>
    </Link>
  );
}

export default KnowledgeNoteCard;
