import React, { useState, useCallback } from 'react';
import { PrimaryButton, SecondaryButton } from '../ui';
import { createNote, type WriteNoteResult } from '../../lib/api/notes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NOTE_TYPES = [
  { value: 'note', label: 'Note', path: 'notes/' },
  { value: 'task', label: 'Task', path: 'notes/tasks/' },
  { value: 'decision', label: 'Decision', path: 'notes/knowledge/decisions/' },
  { value: 'spec', label: 'Spec', path: 'notes/specs/' },
  { value: 'goal', label: 'Goal', path: 'notes/goals/' },
  { value: 'issue', label: 'Issue', path: 'notes/issues/' },
  { value: 'report', label: 'Report', path: 'notes/reports/' },
] as const;

export type NoteTypeValue = (typeof NOTE_TYPES)[number]['value'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const LABEL = 'block text-xs font-medium text-[var(--text-secondary)] mb-1';
const INPUT =
  'w-full rounded-lg border border-[var(--border-glass)] bg-[var(--surf-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary/30 transition';
const TEXTAREA =
  'w-full resize-none rounded-lg border border-[var(--border-glass)] bg-[var(--surf-elevated)] px-3 py-2 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary/30 transition leading-relaxed';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface NoteCreateFormProps {
  /** Called when the note is successfully created. */
  onCreated?: (result: WriteNoteResult) => void;
  /** Called when the user cancels. */
  onCancel?: () => void;
  /** Pre-fill the note type selector. */
  defaultType?: NoteTypeValue;
}

export function NoteCreateForm({
  onCreated,
  onCancel,
  defaultType = 'note',
}: NoteCreateFormProps) {
  const [title, setTitle] = useState('');
  const [noteType, setNoteType] = useState<NoteTypeValue>(defaultType);
  const [status, setStatus] = useState('');
  const [tags, setTags] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = slugify(title);

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!slug) {
      setError('Title must produce a valid slug.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const frontmatter: Record<string, string | string[]> = {
        title: title.trim(),
        type: noteType,
      };
      if (status.trim()) frontmatter.status = status.trim();
      if (tagList.length > 0) frontmatter.tags = tagList;

      const result = await createNote(
        { noteType, slug },
        { frontmatter, content: body }
      );

      if (result.status === 'rejected') {
        setError(result.guardrail?.reason ?? 'Write was blocked by guardrail.');
        return;
      }

      onCreated?.(result);
    } catch (err) {
      setError((err as Error).message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }, [title, slug, noteType, status, tags, body, onCreated]);

  return (
    <div className="flex flex-col gap-5 px-6 py-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="ncf-title">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="ncf-title"
            type="text"
            className={INPUT}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            disabled={saving}
            autoFocus
          />
          {slug && (
            <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
              Slug: <span className="font-mono">{slug}</span>
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className={LABEL} htmlFor="ncf-type">
            Type
          </label>
          <select
            id="ncf-type"
            className={INPUT}
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as NoteTypeValue)}
            disabled={saving}
          >
            {NOTE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} — {t.path}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className={LABEL} htmlFor="ncf-status">
            Status
          </label>
          <input
            id="ncf-status"
            type="text"
            className={INPUT}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="e.g. draft, active, todo"
            disabled={saving}
          />
        </div>

        {/* Tags */}
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="ncf-tags">
            Tags{' '}
            <span className="font-normal text-[var(--text-tertiary)]">
              (comma-separated)
            </span>
          </label>
          <input
            id="ncf-tags"
            type="text"
            className={INPUT}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1, tag2, tag3"
            disabled={saving}
          />
        </div>
      </div>

      {/* Body */}
      <div>
        <label className={LABEL} htmlFor="ncf-body">
          Content{' '}
          <span className="font-normal text-[var(--text-tertiary)]">
            (markdown)
          </span>
        </label>
        <textarea
          id="ncf-body"
          className={TEXTAREA}
          rows={16}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write markdown content here…"
          disabled={saving}
          spellCheck={false}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <PrimaryButton onClick={() => void handleCreate()} disabled={saving}>
          {saving ? 'Creating…' : 'Create Note'}
        </PrimaryButton>
        {onCancel && (
          <SecondaryButton onClick={onCancel} disabled={saving}>
            Cancel
          </SecondaryButton>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
