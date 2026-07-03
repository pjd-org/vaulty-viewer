'use client';

/**
 * agent-shell/chat-input.tsx
 *
 * Chat composer wrapper + optional file attachment row.
 *
 * - Send disabled while running (shows abort instead)
 * - File attachment clips are shown as dismissible chips above the textarea
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import type { AttachedFile, RunStatus } from '../../lib/agent-shell/types';
import { ChatComposer } from '../chat-kit/ChatComposer';
import type { ChatRuntimeState } from '../chat-kit/accent';

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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isRunning = status === 'running';
  const canSend = !isRunning && !disabled && text.trim().length > 0;

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

  const runtimeState: ChatRuntimeState =
    status === 'running'
      ? 'running'
      : status === 'error'
        ? 'error'
        : 'idle';

  const runtimeDetail =
    status === 'running'
      ? 'Executing agent run'
      : status === 'error'
        ? 'Run failed'
        : status === 'done'
          ? 'Run complete'
          : 'Ready for next prompt';

  const attachmentChips =
    files.length > 0 ? (
      <div className="flex flex-wrap gap-1.5 px-1">
        {files.map((f, i) => (
          <span
            key={`${f.name}-${i}`}
            className={cn(
              'flex items-center gap-1.5 rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)]'
            )}
          >
            <span className="max-w-[160px] truncate">{f.name}</span>
            <button
              type="button"
              aria-label={`Remove ${f.name}`}
              onClick={() => removeFile(i)}
              className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    ) : null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <ChatComposer
        value={text}
        placeholder={placeholder}
        isRunning={isRunning}
        attachments={attachmentChips}
        runtimeState={runtimeState}
        runtimeDetail={runtimeDetail}
        onChange={setText}
        onSend={() => {
          if (canSend) submit();
        }}
        onCancel={onAbort}
        onAttach={() => fileInputRef.current?.click()}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}
