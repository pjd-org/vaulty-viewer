import { create } from 'zustand';

export type ModalId = string | null;

export type ThemePreference = 'light' | 'dark' | 'system';

/** Single source of truth for the localStorage key used to persist theme. */
export const THEME_STORAGE_KEY = 'vault-theme';

/** Single source of truth for the localStorage key used to persist density. */
export const DENSITY_STORAGE_KEY = 'vault-density';

const VALID_THEMES: readonly ThemePreference[] = ['light', 'dark', 'system'];

function readThemePreference(): ThemePreference {
  // try/catch guards against SecurityError on iOS private browsing where
  // localStorage is defined but localStorage.getItem() throws.
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return VALID_THEMES.includes(raw as ThemePreference)
      ? (raw as ThemePreference)
      : 'system';
  } catch {
    return 'system';
  }
}

type LayoutDensity = 'compact' | 'comfortable' | 'spacious';

const VALID_DENSITIES: readonly LayoutDensity[] = [
  'compact',
  'comfortable',
  'spacious',
];

function readDensityPreference(): LayoutDensity {
  try {
    const raw = localStorage.getItem(DENSITY_STORAGE_KEY);
    return VALID_DENSITIES.includes(raw as LayoutDensity)
      ? (raw as LayoutDensity)
      : 'comfortable';
  } catch {
    return 'comfortable';
  }
}

type RightPanelMode = 'hidden' | 'peek' | 'pinned';
type DetailPanelMode = 'collapsed' | 'split' | 'overlay';
type SurfaceKey =
  | 'home'
  | 'inbox'
  | 'actions'
  | 'automation'
  | 'knowledge'
  | 'project'
  | 'timeline';

interface UIState {
  theme: ThemePreference;
  layout: {
    leftSidebarCollapsed: boolean;
    rightPanelMode: RightPanelMode;
    density: LayoutDensity;
    activeSurface: SurfaceKey;
    mobileNavOpen: boolean;
  };
  command: {
    paletteOpen: boolean;
    query: string;
    highlightedIndex: number;
    suggestions: string[];
    recentCommands: string[];
    draft: string;
  };
  filters: Record<string, Record<string, unknown>>;
  selection: { entityId: string | null; entityType: string | null };
  detailPanel: {
    mode: DetailPanelMode;
    pinned: boolean;
    fallbackContent: string | null;
  };
  verification: {
    latestId: string | null;
    visible: boolean;
    pinned: boolean;
    phase: 'idle' | 'pending' | 'resolved' | 'failed';
  };
  activeModal: ModalId;
  inbox: {
    currentBucket: string | null;
    bulkSelection: string[];
    actionSafetyGate: boolean;
  };
  actions: {
    evaluationMode: string;
    simulationPreviewOpen: boolean;
    submissionPending: boolean;
  };
  automation: {
    autoRefresh: boolean;
    activeSubview: string | null;
    inspectionDrawerOpen: boolean;
  };
  knowledge: {
    activeTab: string;
    noteEditorMode: 'read' | 'edit';
    rawFrontmatterMode: boolean;
    currentNoteId: string | null;
    currentTemplateId: string | null;
    noteDraft: string;
    templateDraft: string;
    compareRevisionId: string | null;
  };
  project: {
    currentProjectSlug: string | null;
    activeTab: string | null;
    scopedQuickCreateType: string | null;
    showOnlyProjectLinkedContent: boolean;
  };
  timeline: {
    liveMode: boolean;
    playbackWindow: string | null;
    selectedEventDetailMode: string | null;
  };
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  setVerificationVisible: (visible: boolean) => void;
  setVerificationPhase: (
    phase: 'idle' | 'pending' | 'resolved' | 'failed',
    latestId?: string | null
  ) => void;
  setVerificationRailPinned: (pinned: boolean) => void;
  toggleVerificationRailPinned: () => void;
  setTheme: (theme: ThemePreference) => void;
  setDensity: (density: LayoutDensity) => void;
  toggleLeftSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: readThemePreference(),
  layout: {
    leftSidebarCollapsed: false,
    rightPanelMode: 'peek',
    density: readDensityPreference(),
    activeSurface: 'home',
    mobileNavOpen: false,
  },
  command: {
    paletteOpen: false,
    query: '',
    highlightedIndex: 0,
    suggestions: [],
    recentCommands: [],
    draft: '',
  },
  filters: {},
  selection: { entityId: null, entityType: null },
  detailPanel: { mode: 'split', pinned: false, fallbackContent: null },
  verification: {
    latestId: null,
    visible: false,
    pinned: false,
    phase: 'idle',
  },
  activeModal: null,
  inbox: { currentBucket: null, bulkSelection: [], actionSafetyGate: false },
  actions: {
    evaluationMode: 'ranked',
    simulationPreviewOpen: false,
    submissionPending: false,
  },
  automation: {
    autoRefresh: false,
    activeSubview: null,
    inspectionDrawerOpen: false,
  },
  knowledge: {
    activeTab: 'notes',
    noteEditorMode: 'read',
    rawFrontmatterMode: false,
    currentNoteId: null,
    currentTemplateId: null,
    noteDraft: '',
    templateDraft: '',
    compareRevisionId: null,
  },
  project: {
    currentProjectSlug: null,
    activeTab: null,
    scopedQuickCreateType: null,
    showOnlyProjectLinkedContent: false,
  },
  timeline: {
    liveMode: true,
    playbackWindow: null,
    selectedEventDetailMode: null,
  },
  openCommandPalette: () =>
    set((state) => ({ command: { ...state.command, paletteOpen: true } })),
  closeCommandPalette: () =>
    set((state) => ({ command: { ...state.command, paletteOpen: false } })),
  toggleCommandPalette: () =>
    set((state) => ({
      command: { ...state.command, paletteOpen: !state.command.paletteOpen },
    })),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  setVerificationVisible: (visible) =>
    set((state) => ({ verification: { ...state.verification, visible } })),
  setVerificationPhase: (phase, latestId) => {
    set((state) => ({
      verification: {
        ...state.verification,
        phase,
        latestId:
          typeof latestId === 'undefined'
            ? state.verification.latestId
            : latestId,
        // visible stays true for pending/resolved/failed; only idle hides the rail.
        // Verification must remain visible until explicitly dismissed — never auto-toast.
        visible: phase !== 'idle',
      },
    }));
  },
  setVerificationRailPinned: (pinned) =>
    set((state) => ({ verification: { ...state.verification, pinned } })),
  toggleVerificationRailPinned: () =>
    set((state) => ({
      verification: {
        ...state.verification,
        pinned: !state.verification.pinned,
      },
    })),
  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined')
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    set({ theme });
  },
  setDensity: (density) => {
    if (typeof localStorage !== 'undefined')
      localStorage.setItem(DENSITY_STORAGE_KEY, density);
    set((state) => ({ layout: { ...state.layout, density } }));
  },
  toggleLeftSidebar: () =>
    set((state) => ({
      layout: {
        ...state.layout,
        leftSidebarCollapsed: !state.layout.leftSidebarCollapsed,
      },
    })),
}));
