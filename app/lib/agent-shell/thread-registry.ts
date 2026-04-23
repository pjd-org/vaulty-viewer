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
import { useEffect } from 'react';
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
const IS_BROWSER = typeof window !== 'undefined';
let hasHydratedFromStorage = !IS_BROWSER;

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
  // Start empty for SSR + client first render determinism.
  threads: [],
});

// Persist to localStorage on every state change
threadRegistryStore.subscribe(() => {
  if (!hasHydratedFromStorage) return;
  saveToStorage(threadRegistryStore.state.threads);
});

function hydrateFromStorageIfNeeded(): void {
  if (!IS_BROWSER || hasHydratedFromStorage) return;
  hasHydratedFromStorage = true;

  const persisted = loadFromStorage();
  if (persisted.length === 0) return;

  threadRegistryStore.setState((s) => ({
    threads: mergeThreads(s.threads, persisted),
  }));
}

// ── Registry API ──────────────────────────────────────────────────────────────

export const ThreadRegistry = {
  hydrateFromStorage(): void {
    hydrateFromStorageIfNeeded();
  },

  /**
   * Create or update a thread entry.
   * On update, only non-empty fields overwrite existing values.
   */
  upsert(entry: Partial<ThreadEntry> & { id: string }): void {
    hydrateFromStorageIfNeeded();
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
    hydrateFromStorageIfNeeded();
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
    hydrateFromStorageIfNeeded();
    threadRegistryStore.setState(() => ({ threads: [] }));
  },
} as const;

// ── React hook ────────────────────────────────────────────────────────────────

export function useThreadRegistry(): ThreadEntry[] {
  const state = useStore(threadRegistryStore);

  useEffect(() => {
    ThreadRegistry.hydrateFromStorage();
  }, []);

  return state.threads;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mergeThreads(
  current: ThreadEntry[],
  persisted: ThreadEntry[]
): ThreadEntry[] {
  const toEpoch = (iso: string) => {
    const parsed = Date.parse(iso);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const byId = new Map<string, ThreadEntry>();
  const combined = [...persisted, ...current];

  for (const entry of combined) {
    const existing = byId.get(entry.id);
    if (!existing) {
      byId.set(entry.id, entry);
      continue;
    }

    const existingTs = toEpoch(existing.updatedAt);
    const candidateTs = toEpoch(entry.updatedAt);
    if (candidateTs >= existingTs) {
      byId.set(entry.id, entry);
    }
  }

  return [...byId.values()]
    .sort((a, b) => toEpoch(b.updatedAt) - toEpoch(a.updatedAt))
    .slice(0, MAX_THREADS);
}

function truncate(str: string, max: number): string {
  const trimmed = str.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}…` : trimmed;
}
