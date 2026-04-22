'use client';

/**
 * agent-shell/chat-input.tsx
 *
 * Textarea + send/abort button + optional file attachment row.
 *
 * - Send disabled while running (shows abort instead)
 * - Enter submits; Shift+Enter inserts newline
 * - File attachment clips are shown as dismissible chips above the textarea
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import type { AttachedFile, RunStatus } from '../../lib/agent-shell/types';

export type ChatInputProps = {
  status: RunStatus;
  onSend: (message: string, files?: AttachedFile[]) => void;
  onAbort: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function ChatInput({
  status,
  onSend,
  onAbort,
  disabled = false,
  placeholder = 'Send a message…',
  className,
}: ChatInputProps) {
  const [text, setText] = React.useState('');
  const [files, setFiles] = React.useState<AttachedFile[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isRunning = status === 'running';
  const canSend = !isRunning && !disabled && text.trim().length > 0;

  // Auto-resize textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) submit();
    }
  }

  function submit() {
    const msg = text.trim();
    if (!msg) return;
    onSend(msg, files.length > 0 ? files : undefined);
    setText('');
    setFiles([]);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;

    const converted: AttachedFile[] = await Promise.all(
      picked.map(
        (f) =>
          new Promise<AttachedFile>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: f.name,
                mimeType: f.type || 'application/octet-stream',
                data: (reader.result as string).split(',')[1] ?? '',
              });
            reader.onerror = reject;
            reader.readAsDataURL(f);
          })
      )
    );
    setFiles((prev) => [...prev, ...converted]);
    // Reset so the same file can be re-attached
    e.target.value = '';
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* File chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {files.map((f, i) => (
            <span
              key={i}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg',
                'bg-white/10 border border-white/15 text-xs text-white/70'
              )}
            >
              <span className="max-w-[120px] truncate">{f.name}</span>
              <button
                aria-label={`Remove ${f.name}`}
                onClick={() => removeFile(i)}
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className={cn(
          'flex items-end gap-2 px-3 py-2.5 rounded-2xl',
          'bg-white/8 border border-white/15 backdrop-blur-sm',
          'focus-within:border-white/30 transition-colors duration-200'
        )}
      >
        {/* Attach button */}
        <button
          type="button"
          aria-label="Attach file"
          disabled={isRunning || disabled}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'shrink-0 h-8 w-8 flex items-center justify-center rounded-lg',
            'text-white/40 hover:text-white/70 hover:bg-white/10',
            'transition-colors duration-200',
            'disabled:pointer-events-none disabled:opacity-30',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
          )}
        >
          <PaperclipIcon />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRunning ? 'Running…' : placeholder}
          disabled={isRunning || disabled}
          rows={1}
          aria-label="Message input"
          className={cn(
            'flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/30',
            'outline-none min-h-[32px] max-h-[200px] overflow-y-auto leading-relaxed py-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Hide scrollbar
            'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10'
          )}
        />

        {/* Send / Abort */}
        {isRunning ? (
          <button
            type="button"
            aria-label="Stop generation"
            onClick={onAbort}
            className={cn(
              'shrink-0 h-8 w-8 flex items-center justify-center rounded-lg',
              'bg-red-500/30 border border-red-400/30 text-red-300',
              'hover:bg-red-500/50 transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50'
            )}
          >
            <StopIcon />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Send message"
            disabled={!canSend}
            onClick={submit}
            className={cn(
              'shrink-0 h-8 w-8 flex items-center justify-center rounded-lg',
              'bg-white/15 border border-white/20 text-white',
              'hover:bg-white/25 transition-colors duration-200',
              'disabled:pointer-events-none disabled:opacity-30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
            )}
          >
            <SendIcon />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Inline micro-icons (no external dep) ─────────────────────────────────────

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22 11 13 2 9l20-7z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
