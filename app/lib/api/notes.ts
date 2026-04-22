import { apiFetch } from '../../../src/utils/api';

// ---------------------------------------------------------------------------
// Types — mirror write_note_unified MCP tool schema
// ---------------------------------------------------------------------------

export type FrontmatterValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | Record<string, unknown>;

export type NoteTarget = {
  path?: string;
  id?: string;
  noteType?: string;
  slug?: string;
};

export type CreatePayload = {
  frontmatter?: Record<string, FrontmatterValue>;
  content?: string;
};

export type UpdatePayload = {
  frontmatter?: Record<string, FrontmatterValue | null>;
  sections?: Array<{ section: string; replacement: string }>;
};

export type PatchOperation =
  | {
      type: 'replace';
      search: string;
      replacement?: string;
      skipCodeBlocks?: boolean;
      matchCount?: number;
    }
  | { type: 'insert'; line: number; replacement?: string }
  | {
      type: 'delete';
      search: string;
      matchCount?: number;
      skipCodeBlocks?: boolean;
    }
  | { type: 'replace_section'; section: string; replacement: string }
  | {
      type: 'update_frontmatter';
      frontmatter: Record<string, FrontmatterValue | null>;
    };

export type PatchPayload = {
  operations: PatchOperation[];
};

export type WriteNoteOptions = {
  idempotencyKey?: string;
};

export type WriteNoteResult = {
  status: 'written' | 'staged' | 'rejected';
  canonicalPath?: string;
  stagePath?: string;
  errorCode?: string;
  guardrail?: { reason: string };
};

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

async function callWriteNoteUnified(
  body: Record<string, unknown>
): Promise<WriteNoteResult> {
  const res = await apiFetch('/api/v1/tools/write_note_unified/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        `write_note_unified failed (${res.status})`
    );
  }

  const json = await res.json();
  // API wraps result: { success, tool, result: { structuredContent } }
  const sc = (json?.result?.structuredContent ??
    json?.result ??
    json) as WriteNoteResult;
  return sc;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Create a new note. */
export async function createNote(
  target: NoteTarget,
  payload: CreatePayload,
  options?: WriteNoteOptions
): Promise<WriteNoteResult> {
  return callWriteNoteUnified({ mode: 'create', target, payload, options });
}

/** Overwrite frontmatter fields and/or named sections of an existing note. */
export async function updateNote(
  target: NoteTarget,
  payload: UpdatePayload,
  options?: WriteNoteOptions
): Promise<WriteNoteResult> {
  return callWriteNoteUnified({ mode: 'update', target, payload, options });
}

/** Apply granular patch operations (replace/insert/delete/replace_section/update_frontmatter). */
export async function patchNote(
  target: NoteTarget,
  operations: PatchOperation[],
  options?: WriteNoteOptions
): Promise<WriteNoteResult> {
  return callWriteNoteUnified({
    mode: 'patch',
    target,
    payload: { operations },
    options,
  });
}
