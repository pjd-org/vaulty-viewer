/**
 * Viewer V2 — selection context, information level, and persistence.
 *
 * Contract from notes/projects/vaulty/decisions/viewer-contextual-ambient-focus:
 *
 *   - Ambient background follows the SELECTED item, never hover.
 *   - Selection transitions ~300ms and honors prefers-reduced-motion.
 *   - Keyboard and pointer selection are equivalent.
 *   - Keyboard FOCUS visibility is independent of selection: tabbing through
 *     cards must not repaint the workspace, and moving selection must not
 *     steal focus.
 *   - Information level (Focus/Standard/Deep) is independent of ambient colour.
 *
 * Why selection and hover are separate state: if hover drove the ambient, the
 * workspace would strobe as the pointer crosses a list. That is the specific
 * failure this decision exists to prevent, so hover is deliberately not wired
 * to anything global here.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  DEFAULT_INFORMATION_LEVEL,
  INFORMATION_LEVELS,
  type InformationLevel,
  type InformationLevelSpec,
  type PressureBandRole,
  type ThemeMode,
} from './pressure-band';

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export const PREFERENCES_STORAGE_KEY = 'vaulty.viewer.v2.preferences';

export interface ViewerPreferences {
  theme: ThemeMode;
  informationLevel: InformationLevel;
  /** Inspector/panel visibility is independent of information level. */
  inspectorOpen: boolean;
}

export const DEFAULT_PREFERENCES: ViewerPreferences = {
  theme: 'soft-light',
  informationLevel: DEFAULT_INFORMATION_LEVEL,
  inspectorOpen: true,
};

/**
 * Read persisted preferences.
 *
 * Unknown or malformed values fall back to the default rather than throwing:
 * a corrupted preference must not make the Viewer unusable. Every field is
 * validated individually so one bad key does not discard the others.
 */
export function readPreferences(
  storage: Pick<Storage, 'getItem'> | undefined = typeof window === 'undefined'
    ? undefined
    : window.localStorage
): ViewerPreferences {
  if (!storage) return { ...DEFAULT_PREFERENCES };
  try {
    const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_PREFERENCES };
    const record = parsed as Record<string, unknown>;

    const theme: ThemeMode =
      record.theme === 'soft-dark' || record.theme === 'soft-light'
        ? record.theme
        : DEFAULT_PREFERENCES.theme;

    const informationLevel: InformationLevel =
      record.informationLevel === 'focus' ||
      record.informationLevel === 'standard' ||
      record.informationLevel === 'deep'
        ? record.informationLevel
        : DEFAULT_PREFERENCES.informationLevel;

    const inspectorOpen =
      typeof record.inspectorOpen === 'boolean'
        ? record.inspectorOpen
        : DEFAULT_PREFERENCES.inspectorOpen;

    return { theme, informationLevel, inspectorOpen };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/** Persist preferences. A quota or privacy-mode failure must not break the UI. */
export function writePreferences(
  prefs: ViewerPreferences,
  storage: Pick<Storage, 'setItem'> | undefined = typeof window === 'undefined'
    ? undefined
    : window.localStorage
): void {
  if (!storage) return;
  try {
    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Persistence is a convenience, not a correctness requirement.
  }
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export interface Selection {
  /** Stable id of the selected record. */
  id: string;
  /** Semantic role driving the ambient tint. */
  role: PressureBandRole;
}

export interface ViewerV2ContextValue {
  preferences: ViewerPreferences;
  setTheme: (theme: ThemeMode) => void;
  setInformationLevel: (level: InformationLevel) => void;
  toggleInspector: () => void;
  /** Capability flags for the active level. */
  level: InformationLevelSpec;
  /** Current selection, or null. Ambient is neutral when null. */
  selection: Selection | null;
  /** Select a record. Equivalent from pointer and keyboard. */
  select: (selection: Selection | null) => void;
  /** Clear selection (Escape). */
  clearSelection: () => void;
}

const ViewerV2Context = createContext<ViewerV2ContextValue | null>(null);

/**
 * Read the design-system context.
 *
 * Degrades to inert defaults rather than throwing when no provider is present.
 * A route must not crash because a wrapper is missing: the provider is mounted
 * at the root, but routes are also rendered standalone in tests and in error
 * boundaries, and a thrown error there would turn a missing theme into a blank
 * screen. Defaults mean "no ambient, default level" — the route still works.
 */
export function useViewerV2(): ViewerV2ContextValue {
  const ctx = useContext(ViewerV2Context);
  if (ctx) return ctx;
  return FALLBACK_CONTEXT;
}

const FALLBACK_CONTEXT: ViewerV2ContextValue = {
  preferences: { ...DEFAULT_PREFERENCES },
  setTheme: () => undefined,
  setInformationLevel: () => undefined,
  toggleInspector: () => undefined,
  level: INFORMATION_LEVELS[DEFAULT_INFORMATION_LEVEL],
  selection: null,
  select: () => undefined,
  clearSelection: () => undefined,
};

/** Information-level capabilities only, for components that do not need the rest. */
export function useInformationLevel(): InformationLevelSpec {
  return useViewerV2().level;
}

/**
 * Selection state for a route.
 *
 * Routes use this to render their own cards. It writes to the shared context,
 * so ambient tint and route-local highlighting cannot disagree.
 */
export function useSelection(): {
  selection: Selection | null;
  select: (selection: Selection | null) => void;
  isSelected: (id: string) => boolean;
} {
  const { selection, select } = useViewerV2();
  return {
    selection,
    select,
    isSelected: useCallback((id: string) => selection?.id === id, [selection]),
  };
}

export interface ViewerV2ProviderProps {
  children: React.ReactNode;
  /** Override for tests and SSR, where localStorage may be absent. */
  initialPreferences?: ViewerPreferences;
}

export function ViewerV2Provider({
  children,
  initialPreferences,
}: ViewerV2ProviderProps): React.ReactElement {
  const [preferences, setPreferences] = useState<ViewerPreferences>(
    () => initialPreferences ?? readPreferences()
  );
  const [selection, setSelection] = useState<Selection | null>(null);

  // Persist on change. Runs after mount so SSR and the pre-paint theme script
  // do not race each other.
  useEffect(() => {
    writePreferences(preferences);
  }, [preferences]);

  // Escape clears selection. Deliberately does not move focus: clearing a
  // selection must not yank the caret away from wherever the user is.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelection(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setPreferences((prev) => ({ ...prev, theme }));
  }, []);

  const setInformationLevel = useCallback((informationLevel: InformationLevel) => {
    setPreferences((prev) => ({ ...prev, informationLevel }));
  }, []);

  const toggleInspector = useCallback(() => {
    setPreferences((prev) => ({ ...prev, inspectorOpen: !prev.inspectorOpen }));
  }, []);

  const select = useCallback((next: Selection | null) => {
    setSelection(next);
  }, []);

  const clearSelection = useCallback(() => setSelection(null), []);

  const value = useMemo<ViewerV2ContextValue>(
    () => ({
      preferences,
      setTheme,
      setInformationLevel,
      toggleInspector,
      level: INFORMATION_LEVELS[preferences.informationLevel],
      selection,
      select,
      clearSelection,
    }),
    [preferences, setTheme, setInformationLevel, toggleInspector, selection, select, clearSelection]
  );

  return <ViewerV2Context.Provider value={value}>{children}</ViewerV2Context.Provider>;
}
