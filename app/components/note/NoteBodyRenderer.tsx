import React, { useEffect, useRef, useMemo } from 'react';
import {
  createEditor,
  union,
  htmlFromNode,
  defineHistory,
} from 'prosekit/core';
import { ProseKit, useDocChange, useEditor } from '@prosekit/react';
import { defineDoc } from '@prosekit/extensions/doc';
import { defineText } from '@prosekit/extensions/text';
import { defineParagraph } from '@prosekit/extensions/paragraph';
import { defineHeading } from '@prosekit/extensions/heading';
import { defineBold } from '@prosekit/extensions/bold';
import { defineItalic } from '@prosekit/extensions/italic';
import { defineUnderline } from '@prosekit/extensions/underline';
import { defineStrike } from '@prosekit/extensions/strike';
import { defineCode } from '@prosekit/extensions/code';
import { defineCodeBlock } from '@prosekit/extensions/code-block';
import { defineBlockquote } from '@prosekit/extensions/blockquote';
import { defineList } from '@prosekit/extensions/list';
import { defineHardBreak } from '@prosekit/extensions/hard-break';
import { defineHorizontalRule } from '@prosekit/extensions/horizontal-rule';
import { defineReadonly } from '@prosekit/extensions/readonly';

// lucide-animated — icons with hover animation
import {
  BoldIcon,
  type BoldIconHandle,
  ItalicIcon,
  type ItalicIconHandle,
  UnderlineIcon,
  type UnderlineIconHandle,
  ListIcon,
  type ListIconHandle,
  UndoIcon,
  type UndoIconHandle,
  RedoIcon,
  type RedoIconHandle,
} from 'lucide-animated';

// lucide-react v1 — static icons for items not in lucide-animated
import {
  StrikethroughIcon,
  CodeIcon,
  TextQuoteIcon,
  Heading2Icon,
  Heading3Icon,
  ListOrderedIcon,
} from 'lucide-react';

// ── Extension setup ───────────────────────────────────────────────────────────

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

// The full editable extension — used to derive command types for the Toolbar.
const EDITABLE_EXTENSION = union([
  defineDoc(),
  defineText(),
  defineParagraph(),
  defineHeading(),
  defineBold(),
  defineItalic(),
  defineUnderline(),
  defineStrike(),
  defineCode(),
  defineCodeBlock(),
  defineBlockquote(),
  defineList(),
  defineHardBreak(),
  defineHorizontalRule(),
  defineHistory(),
]);

type EditableExtension = typeof EDITABLE_EXTENSION;

function buildExtension(editable: boolean) {
  if (editable) return EDITABLE_EXTENSION;
  return union([
    defineDoc(),
    defineText(),
    defineParagraph(),
    defineHeading(),
    defineBold(),
    defineItalic(),
    defineUnderline(),
    defineStrike(),
    defineCode(),
    defineCodeBlock(),
    defineBlockquote(),
    defineList(),
    defineHardBreak(),
    defineHorizontalRule(),
    defineHistory(),
    defineReadonly(),
  ]);
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
// Rendered inside <ProseKit editor={editor}> so useEditor() resolves with types.

const BTN =
  'inline-flex items-center justify-center h-7 w-7 rounded-md text-[color-mix(in_srgb,var(--accent-tint,var(--text-secondary))_60%,var(--text-secondary))] hover:bg-[var(--surf-elevated)] hover:text-[color-mix(in_srgb,var(--accent-tint,var(--text-primary))_80%,var(--text-primary))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none';

/** Animated toolbar button — wraps a lucide-animated icon with ref-based trigger */
function AnimatedBtn<
  H extends { startAnimation: () => void; stopAnimation: () => void },
>({
  title,
  iconRef,
  icon,
  onPress,
}: {
  title: string;
  iconRef: React.RefObject<H | null>;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={BTN}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focus
        onPress();
      }}
    >
      {icon}
    </button>
  );
}

/** Static toolbar button — wraps a lucide-react static icon */
function StaticBtn({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={BTN}
      onMouseDown={(e) => {
        e.preventDefault();
        onPress();
      }}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div className="mx-0.5 h-4 w-px bg-[var(--border-glass-soft)] shrink-0" />
  );
}

const ICON_SIZE = 14;

function Toolbar() {
  const editor = useEditor<EditableExtension>({ update: true });

  // Refs for lucide-animated icons
  const boldRef = useRef<BoldIconHandle>(null);
  const italicRef = useRef<ItalicIconHandle>(null);
  const underlineRef = useRef<UnderlineIconHandle>(null);
  const listRef = useRef<ListIconHandle>(null);
  const undoRef = useRef<UndoIconHandle>(null);
  const redoRef = useRef<RedoIconHandle>(null);

  return (
    <div
      role="toolbar"
      aria-label="Formatting toolbar"
      className="flex items-center gap-0.5 flex-wrap px-3 py-2 border-b border-[var(--border-glass-soft)] bg-[color-mix(in_srgb,var(--surf-utility)_60%,transparent)]"
    >
      {/* ── Inline marks ── */}
      <AnimatedBtn
        title="Bold"
        iconRef={boldRef}
        icon={<BoldIcon ref={boldRef} size={ICON_SIZE} />}
        onPress={() => editor.commands.toggleBold()}
      />
      <AnimatedBtn
        title="Italic"
        iconRef={italicRef}
        icon={<ItalicIcon ref={italicRef} size={ICON_SIZE} />}
        onPress={() => editor.commands.toggleItalic()}
      />
      <AnimatedBtn
        title="Underline"
        iconRef={underlineRef}
        icon={<UnderlineIcon ref={underlineRef} size={ICON_SIZE} />}
        onPress={() => editor.commands.toggleUnderline()}
      />
      <StaticBtn
        title="Strikethrough"
        icon={<StrikethroughIcon size={ICON_SIZE} />}
        onPress={() => editor.commands.toggleStrike()}
      />
      <StaticBtn
        title="Inline code"
        icon={<CodeIcon size={ICON_SIZE} />}
        onPress={() => editor.commands.toggleCode()}
      />
      <StaticBtn
        title="Blockquote"
        icon={<TextQuoteIcon size={ICON_SIZE} />}
        onPress={() => editor.commands.toggleBlockquote()}
      />

      <ToolbarDivider />

      {/* ── Block: headings ── */}
      <StaticBtn
        title="Heading 2"
        icon={<Heading2Icon size={ICON_SIZE} />}
        onPress={() => editor.commands.toggleHeading({ level: 2 })}
      />
      <StaticBtn
        title="Heading 3"
        icon={<Heading3Icon size={ICON_SIZE} />}
        onPress={() => editor.commands.toggleHeading({ level: 3 })}
      />

      <ToolbarDivider />

      {/* ── Lists ── */}
      <AnimatedBtn
        title="Bullet list"
        iconRef={listRef}
        icon={<ListIcon ref={listRef} size={ICON_SIZE} />}
        onPress={() => editor.commands.toggleList({ kind: 'bullet' })}
      />
      <StaticBtn
        title="Ordered list"
        icon={<ListOrderedIcon size={ICON_SIZE} />}
        onPress={() => editor.commands.toggleList({ kind: 'ordered' })}
      />

      <ToolbarDivider />

      {/* ── History ── */}
      <AnimatedBtn
        title="Undo"
        iconRef={undoRef}
        icon={<UndoIcon ref={undoRef} size={ICON_SIZE} />}
        onPress={() => editor.commands.undo()}
      />
      <AnimatedBtn
        title="Redo"
        iconRef={redoRef}
        icon={<RedoIcon ref={redoRef} size={ICON_SIZE} />}
        onPress={() => editor.commands.redo()}
      />
    </div>
  );
}

// ── EditorContent ─────────────────────────────────────────────────────────────

function EditorContent({
  editor,
  onChange,
  className,
  suppressChange,
  editable,
}: {
  editor: ReturnType<typeof createEditor>;
  onChange?: (html: string) => void;
  className: string;
  suppressChange: React.MutableRefObject<boolean>;
  editable: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    return editor.mount(el);
  }, [editor]);

  useDocChange(() => {
    if (!onChange || suppressChange.current) return;
    try {
      const html = htmlFromNode(editor.view.state.doc);
      onChange(html);
    } catch {
      // schema mismatch — skip
    }
  });

  return (
    <div
      ref={mountRef}
      role={editable ? 'textbox' : undefined}
      aria-multiline={editable ? 'true' : undefined}
      className={`note-body prosekit-content prose prose-sm max-w-none px-6 py-5 text-[color-mix(in_srgb,var(--accent-tint,var(--text-secondary))_15%,var(--text-secondary))] leading-relaxed [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[1rem] ${className}`}
    />
  );
}

// ── NoteBodyRenderer ──────────────────────────────────────────────────────────

export function NoteBodyRenderer({
  html,
  className = '',
  editable = false,
  onChange,
}: NoteBodyRendererProps) {
  const editor = useMemo(
    () => createEditor({ extension: buildExtension(editable) }),
    [editable]
  );
  const suppressChange = useRef(false);

  // Sync incoming html into the editor (initial load + external updates)
  useEffect(() => {
    if (!html.trim()) return;
    const container = document.createElement('div');
    container.innerHTML = html;
    try {
      suppressChange.current = true;
      editor.setContent(container);
    } catch {
      // setContent may throw if schema doesn't support some nodes — swallow silently
    } finally {
      suppressChange.current = false;
    }
  }, [editor, html]);

  return (
    <ProseKit editor={editor}>
      <div className={className}>
        {editable && <Toolbar />}
        <EditorContent
          editor={editor}
          onChange={editable ? onChange : undefined}
          className="transition-all duration-300 ease-out"
          suppressChange={suppressChange}
          editable={editable}
        />
      </div>
    </ProseKit>
  );
}
