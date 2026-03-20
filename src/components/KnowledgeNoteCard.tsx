import React from 'react';
import { Link } from '@tanstack/react-router';

interface KnowledgeNoteCardProps {
  path: string;
  title: string;
  audience?: string | null;
  domain?: string;
  tags?: string[];
  status?: string;
}

const audienceBadgeClass: Record<string, string> = {
  human: 'knowledge-badge knowledge-badge--human',
  agent: 'knowledge-badge knowledge-badge--agent',
  bubble: 'knowledge-badge knowledge-badge--bubble',
};

const maturityBadgeClass: Record<string, string> = {
  draft: 'knowledge-badge knowledge-badge--draft',
  stable: 'knowledge-badge knowledge-badge--stable',
  deprecated: 'knowledge-badge knowledge-badge--deprecated',
};

export function KnowledgeNoteCard({ path, title, audience, domain, tags, status }: KnowledgeNoteCardProps) {
  return (
    <div className="card knowledge-note-card">
      <div className="knowledge-note-card__header">
        <Link to="/note" search={{ p: path }} className="knowledge-note-card__title">
          {title}
        </Link>
        <div className="knowledge-note-card__badges">
          {audience && audienceBadgeClass[audience] && (
            <span className={audienceBadgeClass[audience]}>{audience}</span>
          )}
          {status && maturityBadgeClass[status] && (
            <span className={maturityBadgeClass[status]}>{status}</span>
          )}
        </div>
      </div>
      {(domain || (tags && tags.length > 0)) && (
        <div className="knowledge-note-card__meta">
          {domain && <span className="tag knowledge-note-card__domain">{domain}</span>}
          {tags && tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default KnowledgeNoteCard;
