import React, { useState } from 'react';
import { SegmentedControl } from '../ui';
import { NoteBodyRenderer } from './NoteBodyRenderer';
import { GlassSurface } from '@vault/ui';

type Mode = 'read' | 'edit';

const MODE_OPTIONS = [
  { value: 'read', label: 'Read' },
  { value: 'edit', label: 'Edit' },
];

const EDIT_SHELL_CLASSES =
  'overflow-hidden transition-all duration-300 ease-out';

export interface NoteBodyEditorProps {
  html: string;
  onChange?: (html: string) => void;
  className?: string;
  initialMode?: Mode;
  /**
   * Optional accent color (any CSS color string, e.g. "#6C63FF" or "hsl(250,80%,60%)").
   * When provided, the shell border and header background are subtly tinted with this color.
   */
  accentColor?: string;
}

export function NoteBodyEditor({
  html,
  onChange,
  className = '',
  initialMode = 'read',
  accentColor,
}: NoteBodyEditorProps) {
  const [mode, setMode] = useState<Mode>(initialMode);

  const accentStyle = accentColor
    ? ({ '--accent-tint': accentColor } as React.CSSProperties)
    : undefined;

  const borderClass = accentColor
    ? 'border-[color-mix(in_srgb,var(--accent-tint)_40%,var(--border-glass))]'
    : 'border-[var(--border-glass)]';

  const headerBg = accentColor
    ? 'bg-[color-mix(in_srgb,var(--accent-tint)_8%,color-mix(in_srgb,var(--surf-utility)_72%,transparent))]'
    : 'bg-[color-mix(in_srgb,var(--surf-utility)_72%,transparent)]';

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <GlassSurface variant="overlay" radius="2xl" shadow="lg" border="default" className={`${EDIT_SHELL_CLASSES} ${borderClass}`} style={accentStyle}>
        {/* Header bar: mode toggle */}
        <div
          className={`flex items-center justify-between gap-3 border-b border-[var(--border-glass-soft)] px-4 py-3 backdrop-blur-xl ${headerBg}`}
        >
          <SegmentedControl
            options={MODE_OPTIONS}
            value={mode}
            onChange={(v: string) => setMode(v as Mode)}
          />
          <div className="text-xs text-[var(--text-tertiary)]">
            {mode === 'edit' ? 'Edit mode' : 'Read mode'}
          </div>
        </div>

        {/* Renderer owns the toolbar when editable */}
        <NoteBodyRenderer
          html={html}
          editable={mode === 'edit'}
          onChange={onChange}
          className="bg-transparent"
        />
      </GlassSurface>
    </div>
  );
}
