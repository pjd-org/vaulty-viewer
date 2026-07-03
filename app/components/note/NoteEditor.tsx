import React, { useState, useCallback } from 'react';
import { SecondaryButton, PrimaryButton } from '../ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NoteEditDraft {
  title: string;
  type: string;
  status: string;
  tags: string; // comma-separated string for editing
  body: string; // raw markdown
}

export interface NoteEditorSaveResult {
  frontmatter: Record<string, string | string[] | null>;
  body: string;
  bodyChanged: boolean;
}

export interface NoteEditorProps {
  /** Initial values to populate the editor. */
  initial: NoteEditDraft;
  /** Called when the user confirms save. */
  onSave: (result: NoteEditorSaveResult) => void | Promise<void>;
  /** Called when the user cancels. */
  onCancel: () => void;
  /** When true, the Save button shows a spinner. */
  saving?: boolean;
  /** Error message to display below the actions. */
  error?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LABEL = 'block text-xs font-medium text-[var(--text-secondary)] mb-1';
const INPUT =
  'w-full rounded-lg border border-[var(--border-glass)] bg-[var(--surf-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary/30 transition';
const TEXTAREA =
  'w-full resize-none rounded-lg border border-[var(--border-glass)] bg-[var(--surf-elevated)] px-3 py-2 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary/30 transition leading-relaxed';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NoteEditor({
  initial,
  onSave,
  onCancel,
  saving = false,
  error = null,
}: NoteEditorProps) {
  const [draft, setDraft] = useState<NoteEditDraft>(initial);

  const set = useCallback(
    (key: keyof NoteEditDraft) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDraft((prev) => ({ ...prev, [key]: e.target.value }));
      },
    []
  );

  const handleSave = useCallback(() => {
    const tags = draft.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const frontmatter: Record<string, string | string[] | null> = {};
    if (draft.title !== initial.title) frontmatter.title = draft.title;
    if (draft.type !== initial.type) frontmatter.type = draft.type || null;
    if (draft.status !== initial.status)
      frontmatter.status = draft.status || null;
    const initialTags = initial.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (JSON.stringify(tags) !== JSON.stringify(initialTags)) {
      frontmatter.tags = tags;
    }

    void onSave({
      frontmatter,
      body: draft.body,
      bodyChanged: draft.body !== initial.body,
    });
  }, [draft, initial, onSave]);

  return (
    <div className="flex flex-col gap-5 px-6 py-5">
      {/* ── Frontmatter fields ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="ne-title">
            Title
          </label>
          <input
            id="ne-title"
            type="text"
            className={INPUT}
            value={draft.title}
            onChange={set('title')}
            placeholder="Note title"
            disabled={saving}
          />
        </div>

        {/* Type */}
        <div>
          <label className={LABEL} htmlFor="ne-type">
            Type
          </label>
          <input
            id="ne-type"
            type="text"
            className={INPUT}
            value={draft.type}
            onChange={set('type')}
            placeholder="e.g. task, note, log, decision"
            disabled={saving}
          />
        </div>

        {/* Status */}
        <div>
          <label className={LABEL} htmlFor="ne-status">
            Status
          </label>
          <input
            id="ne-status"
            type="text"
            className={INPUT}
            value={draft.status}
            onChange={set('status')}
            placeholder="e.g. draft, active, done"
            disabled={saving}
          />
        </div>

        {/* Tags */}
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="ne-tags">
            Tags{' '}
            <span className="font-normal text-[var(--text-tertiary)]">
              (comma-separated)
            </span>
          </label>
          <input
            id="ne-tags"
            type="text"
            className={INPUT}
            value={draft.tags}
            onChange={set('tags')}
            placeholder="tag1, tag2, tag3"
            disabled={saving}
          />
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div>
        <label className={LABEL} htmlFor="ne-body">
          Content{' '}
          <span className="font-normal text-[var(--text-tertiary)]">
            (markdown)
          </span>
        </label>
        <textarea
          id="ne-body"
          className={TEXTAREA}
          rows={20}
          value={draft.body}
          onChange={set('body')}
          placeholder="Write markdown content here…"
          disabled={saving}
          spellCheck={false}
        />
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </PrimaryButton>
        <SecondaryButton onClick={onCancel} disabled={saving}>
          Cancel
        </SecondaryButton>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
