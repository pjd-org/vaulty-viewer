import React from 'react';
import { KnowledgeNoteCard } from '../../../src/components/KnowledgeNoteCard';
import type { KnowledgeNoteRef } from '../../lib/viewer-adapter';

export function NoteGrid({ notes }: { notes: KnowledgeNoteRef[] }) {
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
