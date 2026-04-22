import React from 'react';

export interface NoteBodyRendererProps {
  /** Must be sanitized by the caller before passing (e.g. via sanitize-html). */
  html: string;
  className?: string;
  /**
   * When true the editor is editable. Defaults to false (readonly).
   * onChange is ignored when editable is false.
   */
  editable?: boolean;
  /** Called with the serialized HTML string whenever the document changes. */
  onChange?: (html: string) => void;
}

const NOTE_BODY_CLASS =
  'note-body prosekit-content prose prose-sm max-w-none px-6 py-5 text-[color-mix(in_srgb,var(--accent-tint,var(--text-secondary))_15%,var(--text-secondary))] leading-relaxed';

function ReadOnlyBody({
  html,
  className = '',
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={`${NOTE_BODY_CLASS} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const NoteBodyRendererEditable = React.lazy(() =>
  import('./NoteBodyRendererEditable').then((module) => ({
    default: module.NoteBodyRendererEditable,
  }))
);

export function NoteBodyRenderer({
  html,
  className = '',
  editable = false,
  onChange,
}: NoteBodyRendererProps) {
  if (!editable) {
    return <ReadOnlyBody html={html} className={className} />;
  }

  return (
    <React.Suspense fallback={<ReadOnlyBody html={html} className={className} />}>
      <NoteBodyRendererEditable
        html={html}
        className={className}
        onChange={onChange}
      />
    </React.Suspense>
  );
}
