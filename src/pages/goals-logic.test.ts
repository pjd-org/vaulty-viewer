import { describe, expect, it } from "vitest";
import { computeCounts, filterGoals, sortGoals, computeSummary, type Goal } from "./goals-logic";

const sampleGoals: Goal[] = [
  {
    id: "g1",
    status: "todo",
    progress: 20,
    eta: "2024-01-10",
    priority: 8,
    stats: { total: 5, completed: 1, totalEffort: 10, completedEffort: 2 },
  },
  {
    id: "g2",
    status: "completed",
    progress: 100,
    eta: "2024-01-05",
    priority: 5,
    stats: { total: 3, completed: 3, totalEffort: 6, completedEffort: 6 },
  },
  {
    id: "g3",
    status: "at-risk",
    progress: 40,
    eta: undefined,
    priority: 9,
    stats: { total: 4, completed: 1, totalEffort: 8, completedEffort: 2 },
  },
];

describe("computeCounts", () => {
  it("computes counts by status buckets", () => {
    const counts = computeCounts(sampleGoals);
    expect(counts).toEqual({ all: 3, active: 2, atRisk: 1, completed: 1 });
  });
});

describe("filterGoals", () => {
  it("filters active goals", () => {
    expect(filterGoals(sampleGoals, "active").map((g) => g.id)).toEqual(["g1", "g3"]);
  });

  it("filters at-risk goals", () => {
    expect(filterGoals(sampleGoals, "at-risk").map((g) => g.id)).toEqual(["g3"]);
  });

  it("filters completed goals", () => {
    expect(filterGoals(sampleGoals, "completed").map((g) => g.id)).toEqual(["g2"]);
  });
});

describe("sortGoals", () => {
  it("sorts by priority by default", () => {
    const sorted = sortGoals(sampleGoals, "priority");
    expect(sorted.map((g) => g.id)).toEqual(["g3", "g1", "g2"]);
  });

  it("sorts by progress", () => {
    const sorted = sortGoals(sampleGoals, "progress");
    expect(sorted.map((g) => g.id)).toEqual(["g2", "g3", "g1"]);
  });

  it("sorts by eta with missing values last", () => {
    const sorted = sortGoals(sampleGoals, "eta");
    expect(sorted.map((g) => g.id)).toEqual(["g2", "g1", "g3"]);
  });
});

describe("computeSummary", () => {
  it("aggregates tasks, effort, and progress safely", () => {
    const summary = computeSummary(sampleGoals);
    expect(summary).toEqual({
      totalTasks: 12,
      completedTasks: 5,
      totalEffort: 24,
      completedEffort: 10,
      overallProgress: Math.round((10 / 24) * 100),
    });
  });
});
