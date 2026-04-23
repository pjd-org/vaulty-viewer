import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button, GlassBadge } from '@vault/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { NoteCreateForm, type NoteTypeValue } from '../note';
import { stripMarkdownExtension } from '@/src/lib/note-path';
import type { WriteNoteResult } from '../../lib/api/notes';

type ArtifactSpec = {
  type: NoteTypeValue;
  label: string;
  description: string;
  badge: 'Blank' | 'Structured';
};

const ARTIFACTS: ArtifactSpec[] = [
  {
    type: 'note',
    label: 'Blank note',
    description: 'Start freeform with no extra structure.',
    badge: 'Blank',
  },
  {
    type: 'task',
    label: 'Task',
    description: 'Create a task artifact with task-oriented defaults.',
    badge: 'Structured',
  },
  {
    type: 'decision',
    label: 'Decision',
    description: 'Capture a decision with traceable context.',
    badge: 'Structured',
  },
  {
    type: 'spec',
    label: 'Spec',
    description: 'Start a structured specification note.',
    badge: 'Structured',
  },
  {
    type: 'goal',
    label: 'Goal',
    description: 'Write a goal artifact for an outcome or milestone.',
    badge: 'Structured',
  },
  {
    type: 'issue',
    label: 'Issue',
    description: 'Record a blocker, bug, or investigation note.',
    badge: 'Structured',
  },
  {
    type: 'report',
    label: 'Report',
    description: 'Create a report artifact for a status or summary.',
    badge: 'Structured',
  },
] as const;

interface CreateArtifactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateArtifactDialog({
  open,
  onOpenChange,
}: CreateArtifactDialogProps) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = React.useState<NoteTypeValue | null>(
    null
  );

  React.useEffect(() => {
    if (!open) {
      setSelectedType(null);
    }
  }, [open]);

  const handleCreated = React.useCallback(
    (result: WriteNoteResult) => {
      const path = result.canonicalPath ?? result.stagePath ?? null;
      setSelectedType(null);
      onOpenChange(false);

      if (path) {
        void navigate({
          to: '/note',
          search: { p: stripMarkdownExtension(path) },
        });
        return;
      }

      void navigate({ to: '/notes' });
    },
    [navigate, onOpenChange]
  );

  const handleCancel = React.useCallback(() => {
    setSelectedType(null);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleCancel()}>
      <DialogContent
        aria-label="Create artifact"
        className="!max-w-4xl !overflow-hidden !border !border-[var(--border-glass)] !bg-[var(--surf-overlay)] !p-0 !shadow-2xl"
      >
        <div className="max-h-[min(90vh,860px)] overflow-y-auto">
          {selectedType ? (
            <div>
              <DialogHeader className="border-b border-[var(--border-glass-soft)] px-6 py-5 text-left">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <DialogTitle className="text-xl">
                      Create {ARTIFACTS.find((item) => item.type === selectedType)?.label ?? 'artifact'}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-[var(--text-secondary)]">
                      Start with the matching artifact defaults. You can keep it
                      blank or fill in the structured fields before saving.
                    </DialogDescription>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="!rounded-full"
                    onClick={() => setSelectedType(null)}
                  >
                    Change type
                  </Button>
                </div>
              </DialogHeader>

              <NoteCreateForm
                key={selectedType}
                defaultType={selectedType}
                onCreated={handleCreated}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <div className="px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl">
                  Create artifact
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-[var(--text-secondary)]">
                  Choose a blank note or a structured artifact type. The form
                  opens with the matching defaults.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {ARTIFACTS.map((artifact) => (
                  <button
                    key={artifact.type}
                    type="button"
                    onClick={() => setSelectedType(artifact.type)}
                    className="group flex min-h-[108px] flex-col justify-between rounded-3xl border border-[var(--border-glass)] bg-[var(--surf-elevated)] px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--a-sky)_28%,var(--border-glass))] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_28%,transparent)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {artifact.label}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                          {artifact.description}
                        </p>
                      </div>
                      <GlassBadge
                        tone={artifact.badge === 'Blank' ? 'mint' : 'sky'}
                        size="sm"
                        className="shrink-0"
                      >
                        {artifact.badge}
                      </GlassBadge>
                    </div>
                    <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-secondary)]">
                      Open form
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-[var(--border-glass-soft)] pt-4 sm:flex-row sm:items-center">
                <p className="text-xs text-[var(--text-tertiary)]">
                  Need to browse first? Jump to the notes library and create from there.
                </p>
                <Button asChild variant="secondary" size="sm" className="!rounded-full">
                  <Link to="/notes">Browse notes</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
