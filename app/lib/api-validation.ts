/**
 * Runtime validation for API responses.
 *
 * Every adapter queryFn trusts API responses via TypeScript casts.
 * This module provides lightweight assertion functions that fail fast
 * when the API returns unexpected shapes, rather than silently
 * propagating corrupted data through every surface.
 *
 * Uses Zod for schema validation (already a viewer dependency).
 */
import { z } from 'zod';

// ── Next Actions ──────────────────────────────────────────────────────────────

const NextActionsResponseSchema = z.object({
  structuredContent: z
    .object({
      tasks: z.array(z.record(z.string(), z.unknown())).optional(),
    })
    .optional(),
  tasks: z.array(z.record(z.string(), z.unknown())).optional(),
});

/**
 * Validate a next-actions API response body.
 * Returns the raw task array or throws with a descriptive error.
 */
export function validateNextActionsResponse(
  body: unknown
): Record<string, unknown>[] {
  const parsed = NextActionsResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid next-actions response: ${parsed.error.issues.map((i) => i.message).join('; ')}`
    );
  }
  return parsed.data.structuredContent?.tasks ?? parsed.data.tasks ?? [];
}

/**
 * Validate a single raw task object has the minimum required shape.
 * Non-conforming fields are coerced by normalizeNextAction downstream;
 * this just ensures the object is a valid record.
 */
export function validateRawTask(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Invalid task object: expected object, got ${typeof raw}`);
  }
  return raw as Record<string, unknown>;
}

// ── Sessions ──────────────────────────────────────────────────────────────────

const SessionTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  path: z.string(),
  status: z.enum(['pending', 'in_progress', 'done', 'skipped']),
  effortScore: z.number().optional(),
});

const ActiveSessionSchema = z.object({
  id: z.string(),
  status: z.enum(['planned', 'active', 'completed', 'aborted']),
  title: z.string().optional(),
  budgetMin: z.number(),
  startedAt: z.string().optional(),
  tasks: z.array(SessionTaskSchema),
});

const SessionsResponseSchema = z.object({
  structuredContent: z
    .object({
      sessions: z.array(z.unknown()).optional(),
      session: z.unknown().optional(),
    })
    .optional(),
  sessions: z.array(z.unknown()).optional(),
  session: z.unknown().optional(),
});

/**
 * Validate a sessions list API response body.
 * Returns the raw sessions array.
 */
export function validateSessionsResponse(body: unknown): unknown[] {
  const parsed = SessionsResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid sessions response: ${parsed.error.issues.map((i) => i.message).join('; ')}`
    );
  }
  return parsed.data.structuredContent?.sessions ?? parsed.data.sessions ?? [];
}

/**
 * Validate a single session detail response body.
 * Returns the session object or null.
 */
export function validateSessionDetailResponse(body: unknown): unknown | null {
  const parsed = SessionsResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid session detail response: ${parsed.error.issues.map((i) => i.message).join('; ')}`
    );
  }
  return parsed.data.structuredContent?.session ?? parsed.data.session ?? null;
}

/**
 * Validate and parse an ActiveSession from raw data.
 * Throws if the shape doesn't match.
 */
export function validateActiveSession(
  raw: unknown
): import('../../src/lib/focus-logic').ActiveSession | null {
  if (raw === null || raw === undefined) return null;
  const parsed = ActiveSessionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid session object: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
    );
  }
  return parsed.data;
}

// ── Inbox ─────────────────────────────────────────────────────────────────────

const InboxResponseSchema = z.object({
  structuredContent: z
    .object({
      notes: z.array(z.unknown()).optional(),
      runs: z.array(z.unknown()).optional(),
      signals: z.array(z.unknown()).optional(),
    })
    .optional(),
  notes: z.array(z.unknown()).optional(),
  runs: z.array(z.unknown()).optional(),
  signals: z.array(z.unknown()).optional(),
});

/**
 * Validate an inbox API response body.
 * Returns { notes, runs, signals } arrays.
 */
export function validateInboxResponse(body: unknown): {
  notes: unknown[];
  runs: unknown[];
  signals: unknown[];
} {
  const parsed = InboxResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid inbox response: ${parsed.error.issues.map((i) => i.message).join('; ')}`
    );
  }
  const structured = parsed.data.structuredContent;
  return {
    notes: structured?.notes ?? parsed.data.notes ?? [],
    runs: structured?.runs ?? parsed.data.runs ?? [],
    signals: structured?.signals ?? parsed.data.signals ?? [],
  };
}

// ── Knowledge ─────────────────────────────────────────────────────────────────

const GraphJsonSchema = z.object({
  generated: z.string(),
  node_count: z.number(),
  edge_count: z.number(),
  nodes: z.record(z.string(), z.unknown()),
  links: z.record(z.string(), z.array(z.string())),
  backlinks: z.record(z.string(), z.array(z.string())).optional(),
  by_audience: z
    .object({
      human: z.array(z.string()),
      agent: z.array(z.string()),
      bubble: z.array(z.string()),
    })
    .optional(),
  unresolved_links: z.record(z.string(), z.array(z.string())).optional(),
});

/**
 * Validate a knowledge graph API response.
 */
export function validateGraphJson(body: unknown): void {
  const parsed = GraphJsonSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid graph response: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
    );
  }
}

const GraphHealthSchema = z.object({
  graph_generated: z.string(),
  is_stale: z.boolean(),
  node_count: z.number(),
  edge_count: z.number(),
  by_audience: z.object({
    human: z.number(),
    agent: z.number(),
    bubble: z.number(),
  }),
  unresolved_link_count: z.number(),
});

/**
 * Validate a knowledge health API response.
 */
export function validateGraphHealth(body: unknown): void {
  const parsed = GraphHealthSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(
      `Invalid graph health response: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
    );
  }
}
