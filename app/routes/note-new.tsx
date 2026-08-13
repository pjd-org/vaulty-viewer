import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PageContainer, SoftPanel } from '../components/layout';
import { NoteCreateForm } from '../components/note';
import { stripMarkdownExtension } from '../../src/lib/note-path';
import type { WriteNoteResult } from '../lib/api/notes';

export const Route = createFileRoute('/note-new')({
  component: NoteNewRoute,
});

function NoteNewRoute() {
  const navigate = useNavigate();

  const handleCreated = (result: WriteNoteResult) => {
    const path = result.canonicalPath ?? result.stagePath ?? null;
    if (path) {
      void navigate({
        to: '/note',
        search: { p: stripMarkdownExtension(path) },
      });
    } else {
      void navigate({ to: '/notes' });
    }
  };

  return (
    <PageContainer className="max-w-3xl pb-12">
      <h1 className="sr-only">New Note</h1>
      <nav className="mb-4">
        <button
          type="button"
          onClick={() => void navigate({ to: '/notes' })}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to notes
        </button>
      </nav>

      <SoftPanel title="New Note">
        <NoteCreateForm
          onCreated={handleCreated}
          onCancel={() => void navigate({ to: '/notes' })}
        />
      </SoftPanel>
    </PageContainer>
  );
}
