/**
 * agent-shell/thread-registry.ts
 *
 * Client-side registry of agent shell threads.
 *
 * Persists to localStorage so threads survive page reloads.
 * The Tensura server holds actual thread state — this registry only stores
 * the identifiers and display metadata needed to resume a thread.
 *
 * Each ThreadEntry records:
 *   - id        : the threadId forwarded to Tensura
 *   - mode      : execution mode used when the thread was created
 *   - title     : first user message (truncated) — used as display label
 *   - preview   : last assistant message (truncated) — shown in history list
 *   - createdAt : ISO timestamp of first message
 *   - updatedAt : ISO timestamp of most recent message
 *
 * API:
 *   ThreadRegistry.upsert(entry)   — create or update
 *   ThreadRegistry.remove(id)      — delete
 *   ThreadRegistry.list()          — all entries, newest first
 *   ThreadRegistry.get(id)         — single entry or null
 *   useThreadRegistry()            — React hook, re-renders on change
 */

import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';
import type { AgentExecutionMode } from './types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ThreadEntry = {
  id: string;
  mode: AgentExecutionMode;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
};

type ThreadRegistryState = {
  threads: ThreadEntry[];
};

// ── localStorage key ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'agent-shell:threads';
const MAX_THREADS = 50;
const TITLE_MAX = 80;
const PREVIEW_MAX = 120;

// ── Persistence helpers ───────────────────────────────────────────────────────

function loadFromStorage(): ThreadEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as ThreadEntry[];
  } catch {
    return [];
  }
}

function saveToStorage(threads: ThreadEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // localStorage quota exceeded or unavailable — degrade silently
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

const threadRegistryStore = new Store<ThreadRegistryState>({
  threads: loadFromStorage(),
});

// Persist to localStorage on every state change
threadRegistryStore.subscribe(() => {
  saveToStorage(threadRegistryStore.state.threads);
});

// ── Registry API ──────────────────────────────────────────────────────────────

export const ThreadRegistry = {
  /**
   * Create or update a thread entry.
   * On update, only non-empty fields overwrite existing values.
   */
  upsert(entry: Partial<ThreadEntry> & { id: string }): void {
    threadRegistryStore.setState((s) => {
      const idx = s.threads.findIndex((t) => t.id === entry.id);
      const now = new Date().toISOString();

      if (idx === -1) {
        // New thread — require title for creation
        const newEntry: ThreadEntry = {
          id: entry.id,
          mode: entry.mode ?? 'deepagent',
          title: truncate(entry.title ?? entry.id, TITLE_MAX),
          preview: truncate(entry.preview ?? '', PREVIEW_MAX),
          createdAt: entry.createdAt ?? now,
          updatedAt: entry.updatedAt ?? now,
        };
        const threads = [newEntry, ...s.threads].slice(0, MAX_THREADS);
        return { threads };
      }

      // Update existing
      const existing = s.threads[idx];
      const updated: ThreadEntry = {
        ...existing,
        mode: entry.mode ?? existing.mode,
        title: entry.title ? truncate(entry.title, TITLE_MAX) : existing.title,
        preview:
          entry.preview !== undefined
            ? truncate(entry.preview, PREVIEW_MAX)
            : existing.preview,
        updatedAt: entry.updatedAt ?? now,
      };
      const threads = [...s.threads];
      threads[idx] = updated;
      // Bubble updated thread to top
      threads.splice(idx, 1);
      threads.unshift(updated);
      return { threads };
    });
  },

  remove(id: string): void {
    threadRegistryStore.setState((s) => ({
      threads: s.threads.filter((t) => t.id !== id),
    }));
  },

  list(): ThreadEntry[] {
    return threadRegistryStore.state.threads;
  },

  get(id: string): ThreadEntry | null {
    return threadRegistryStore.state.threads.find((t) => t.id === id) ?? null;
  },

  clear(): void {
    threadRegistryStore.setState(() => ({ threads: [] }));
  },
} as const;

// ── React hook ────────────────────────────────────────────────────────────────

export function useThreadRegistry(): ThreadEntry[] {
  const state = useStore(threadRegistryStore);
  return state.threads;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(str: string, max: number): string {
  const trimmed = str.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}…` : trimmed;
}
