import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { buildColumns, normalizeTask, STATUS_COLUMNS } from "./kanban-logic";

const NOW = new Date("2024-01-08T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("normalizeTask", () => {
  it("builds links, cmsSlug, and normalizes status/priority defaults", () => {
    const result = normalizeTask({
      path: "tasks/demo.md",
      title: "Demo task",
      status: "In_Progress",
      priority: undefined,
      tags: ["alpha", "task"],
      completedAt: "2024-01-05T00:00:00Z",
      created: "2024-01-02T00:00:00Z",
    });

    expect(result.cmsSlug).toBe("tasks/demo");
    expect(result.link).toBe("/note?p=tasks%2Fdemo");
    expect(result.status).toBe("in_progress".toLowerCase());
    expect(result.priority).toBe(0);
    expect(result.completedAt).toBe(new Date("2024-01-05T00:00:00Z").getTime());
    expect(result.createdAt).toBe(new Date("2024-01-02T00:00:00Z").getTime());
  });
});

describe("buildColumns", () => {
  const baseTasks = [
    normalizeTask({ id: "1", title: "Todo A", status: "todo", tags: ["x"], projectId: "p1" }),
    normalizeTask({ id: "2", title: "In Progress", status: "in-progress", tags: ["x", "y"], projectId: "p2" }),
    normalizeTask({ id: "3", title: "Blocked", status: "blocked", tags: ["y"], projectId: "p1" }),
    normalizeTask({ id: "4", title: "Done recent", status: "completed", completedAt: "2024-01-07T00:00:00Z", projectId: "p1", tags: ["x"] }),
    normalizeTask({ id: "5", title: "Done old", status: "completed", completedAt: "2023-12-20T00:00:00Z", projectId: "p1", tags: ["x"] }),
  ];

  it("filters by tag and project, removes stale completed, and keeps all columns when requested", () => {
    const columns = buildColumns(baseTasks, "x", "p1", true);
    expect(columns).toHaveLength(STATUS_COLUMNS.length);

    const todo = columns.find((c) => c.key === "todo");
    const done = columns.find((c) => c.key === "completed");

    expect(todo?.items.map((t) => t.id)).toEqual(["1"]);
    expect(done?.items.map((t) => t.id)).toEqual(["4"]); // old completed filtered out
  });

  it("omits completed column when showCompleted is false", () => {
    const columns = buildColumns(baseTasks, "", "", false);
    expect(columns.find((c) => c.key === "completed")).toBeUndefined();
    expect(columns).toHaveLength(STATUS_COLUMNS.length - 1);
  });
});
