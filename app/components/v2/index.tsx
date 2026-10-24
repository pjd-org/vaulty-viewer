/**
 * Viewer V2 — shared selection primitives.
 *
 * One card, one ambient surface, used by every route. The point of the design
 * system is that a route never hand-picks a Pressure Band colour or decides for
 * itself what "selected" looks like.
 *
 * Accessibility contract, all of it deliberate:
 *
 *   - Selection is announced with aria-selected; the card is a real option in a
 *     listbox, not a div with a class.
 *   - Focus-visible is styled SEPARATELY from selection. Tabbing across a grid
 *     shows a focus ring without repainting the workspace; selecting with the
 *     keyboard or pointer moves the ambient tint without stealing focus.
 *   - Enter/Space selects. Arrow keys are left to the route, which knows its own
 *     layout (a graph is not a list).
 *   - The transition is suppressed under prefers-reduced-motion.
 */
import React from 'react';

import {
  AMBIENT_TRANSITION_MS,
  type PressureBandRole,
} from '../../lib/design/pressure-band';
import { useSelection, useViewerV2 } from '../../lib/design/viewer-v2-context';

// ---------------------------------------------------------------------------
// AmbientSurface — the workspace background that follows selection
// ---------------------------------------------------------------------------

export interface AmbientSurfaceProps {
  children: React.ReactNode;
  className?: string;
  /** Test hook; defaults to a stable id. */
  testId?: string;
}

/**
 * Workspace surface whose tint follows the current selection.
 *
 * Renders neutral when nothing is selected — never a leftover tint from the
 * previously selected item, which would imply a selection that no longer exists.
 */
export function AmbientSurface({
  children,
  className,
  testId = 'v2-ambient-surface',
}: AmbientSurfaceProps): React.ReactElement {
  const { selection } = useViewerV2();

  return (
    <div
      data-testid={testId}
      data-ambient={selection ? selection.role : 'neutral'}
      className={className}
      style={{
        backgroundColor: selection
          ? `var(--pb-${selection.role}-ambient)`
          : 'var(--v2-bg)',
        transition: `background-color var(--v2-ambient-transition, ${AMBIENT_TRANSITION_MS}ms) ease`,
        // The tint must never wash out content: it is a background hint, not a
        // surface colour for text.
        color: 'var(--v2-text)',
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SelectableCard
// ---------------------------------------------------------------------------

export interface SelectableCardProps {
  /** Stable id, used for selection identity. */
  id: string;
  /** Semantic role. Drives ambient tint AND the card's own accent. */
  role: PressureBandRole;
  /** Optional title; shown according to the active information level. */
  title?: React.ReactNode;
  /** Optional summary; shown at Standard and Deep. */
  summary?: React.ReactNode;
  /** Optional metadata; shown at Standard and Deep. */
  metadata?: React.ReactNode;
  /** Optional history; shown at Deep only. */
  history?: React.ReactNode;
  /** Alerts render at EVERY level — urgency is not a density setting. */
  alert?: React.ReactNode;
  /** Next actions render at EVERY level. */
  nextAction?: React.ReactNode;
  /**
   * Notified when this card is selected, by pointer or keyboard.
   *
   * Routes need this to open a detail panel. Without it a route would have to
   * catch clicks on a child element, which breaks as soon as the card's own
   * markup changes and misses keyboard activation entirely.
   */
  onSelect?: (id: string) => void;
  /**
   * ARIA role.
   *
   * `option` requires a listbox/group parent and a sibling set that axe can
   * verify. Most routes render cards as an ordinary list of buttons, where
   * `option` is invalid — axe reports aria-required-parent. Default to
   * `button`, which is correct standalone, and let a route opt into `option`
   * only when it provides a real listbox container.
   */
  ariaRole?: 'button' | 'option';
  children?: React.ReactNode;
  className?: string;
}

export function SelectableCard({
  id,
  role,
  title,
  summary,
  metadata,
  history,
  alert,
  nextAction,
  onSelect,
  ariaRole = 'button',
  children,
  className,
}: SelectableCardProps): React.ReactElement {
  const { level } = useViewerV2();
  const { isSelected, select } = useSelection();
  const selected = isSelected(id);

  const handleSelect = React.useCallback(() => {
    select({ id, role });
    onSelect?.(id);
  }, [id, role, select, onSelect]);

  return (
    <div
      role={ariaRole}
      {...(ariaRole === 'option'
        ? { 'aria-selected': selected }
        : { 'aria-pressed': selected })}
      tabIndex={0}
      data-testid="v2-selectable-card"
      data-selected={selected}
      data-role={role}
      onClick={handleSelect}
      onKeyDown={(event) => {
        // Enter and Space are equivalent to a click. Arrow navigation belongs
        // to the route: a graph and a list do not share a movement model.
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleSelect();
        }
      }}
      className={[
        'rounded-xl border p-4 cursor-pointer',
        // Focus ring is independent of selection: a card can be focused without
        // being selected, and selected without holding focus.
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className ?? '',
      ].join(' ')}
      style={{
        // Full-card colour change on selection, per the decision.
        backgroundColor: selected
          ? `var(--pb-${role}-ambient)`
          : 'var(--v2-surface)',
        borderColor: selected ? `var(--pb-${role}-border)` : 'var(--v2-border)',
        color: 'var(--v2-text)',
        transition: `background-color var(--v2-ambient-transition, ${AMBIENT_TRANSITION_MS}ms) ease, border-color var(--v2-ambient-transition, ${AMBIENT_TRANSITION_MS}ms) ease`,
      }}
    >
      {alert ? (
        <div data-testid="v2-card-alert" className="mb-2 text-sm font-medium">
          {alert}
        </div>
      ) : null}

      {level.showTitle && title ? (
        <div data-testid="v2-card-title" className="text-sm font-semibold">
          {title}
        </div>
      ) : null}

      {level.showSummary && summary ? (
        <div
          data-testid="v2-card-summary"
          className="mt-1 text-sm"
          style={{ color: 'var(--v2-text-muted)' }}
        >
          {summary}
        </div>
      ) : null}

      {level.showMetadata && metadata ? (
        <div data-testid="v2-card-metadata" className="mt-2 text-xs font-mono">
          {metadata}
        </div>
      ) : null}

      {level.showHistory && history ? (
        <div data-testid="v2-card-history" className="mt-2 text-xs">
          {history}
        </div>
      ) : null}

      {children}

      {level.showNextActions && nextAction ? (
        <div data-testid="v2-card-next-action" className="mt-3 text-xs font-medium">
          {nextAction}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LevelBadge / ThemeToggle — small, shared controls
// ---------------------------------------------------------------------------

export function LevelBadge(): React.ReactElement {
  const { preferences } = useViewerV2();
  return (
    <span
      data-testid="v2-level-badge"
      data-level={preferences.informationLevel}
      className="rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
      style={{ backgroundColor: 'var(--v2-surface-raised)', color: 'var(--v2-text-muted)' }}
    >
      {preferences.informationLevel}
    </span>
  );
}
