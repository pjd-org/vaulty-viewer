import React from "react";

/**
 * Skeleton loading states for better perceived performance.
 */

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton--circle" />
      <div className="skeleton-card__content">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text skeleton--short" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="skeleton-stat">
      <div className="skeleton skeleton--icon" />
      <div className="skeleton-stat__content">
        <div className="skeleton skeleton--number" />
        <div className="skeleton skeleton--label" />
      </div>
    </div>
  );
}

export function SkeletonKanbanColumn() {
  return (
    <div className="skeleton-kanban-column">
      <div className="skeleton skeleton--header" />
      <div className="skeleton-kanban-cards">
        <div className="skeleton skeleton--kanban-card" />
        <div className="skeleton skeleton--kanban-card" />
        <div className="skeleton skeleton--kanban-card" />
      </div>
    </div>
  );
}

export function SkeletonGoalCard() {
  return (
    <div className="skeleton-goal">
      <div className="skeleton-goal__header">
        <div className="skeleton skeleton--badge" />
        <div className="skeleton skeleton--title" />
      </div>
      <div className="skeleton skeleton--progress" />
      <div className="skeleton skeleton--text" />
    </div>
  );
}

export function SkeletonVitals() {
  return (
    <div className="skeleton-vitals">
      <div className="skeleton skeleton--bar" />
      <div className="skeleton skeleton--bar" />
      <div className="skeleton skeleton--bar" />
    </div>
  );
}

/**
 * Grid of skeleton cards
 */
export function SkeletonCardGrid({ count = 6 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Kanban board skeleton
 */
export function SkeletonKanban() {
  return (
    <div className="kanban">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonKanbanColumn key={i} />
      ))}
    </div>
  );
}

/**
 * Goals list skeleton
 */
export function SkeletonGoalsList({ count = 4 }) {
  return (
    <div className="goals-list">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonGoalCard key={i} />
      ))}
    </div>
  );
}

export default {
  SkeletonCard,
  SkeletonStat,
  SkeletonKanbanColumn,
  SkeletonGoalCard,
  SkeletonVitals,
  SkeletonCardGrid,
  SkeletonKanban,
  SkeletonGoalsList,
};
