/**
 * Viewer V2 — Pressure Band design tokens.
 *
 * Source of truth: notes/knowledge/decisions/2026-10-21-vaulty-viewer-pressure-band-palette
 * and notes/projects/vaulty/decisions/viewer-contextual-ambient-focus.
 *
 * The hex values below are the approved swatches verbatim. They are design
 * tokens, not measured production values, and the decision note says so
 * explicitly. Do not "correct" them to match a screenshot.
 *
 * Semantics are fixed and must not be reassigned: Critical and High carry
 * meaning wherever they appear. Using Critical as a decorative accent would
 * silently turn an alarm colour into wallpaper.
 */

export type PressureBandRole = 'critical' | 'high' | 'total' | 'source';

export type ThemeMode = 'soft-light' | 'soft-dark';

export type InformationLevel = 'focus' | 'standard' | 'deep';

/** Approved Pressure Band swatches, per theme. */
export const PRESSURE_BAND: Record<
  ThemeMode,
  Record<PressureBandRole, string>
> = {
  'soft-light': {
    critical: '#F1C9C0',
    high: '#F2D9B3',
    total: '#C9DBDF',
    source: '#D0E0D0',
  },
  'soft-dark': {
    critical: '#724B48',
    high: '#746044',
    total: '#3F5960',
    source: '#425E51',
  },
};

/**
 * Ambient surface tint per role.
 *
 * The decision requires a *softly tinted* workspace background, not a
 * full-screen fill of the accent. These are the approved swatches at low
 * opacity so text contrast survives on top of them.
 */
export const AMBIENT_ALPHA: Record<ThemeMode, number> = {
  'soft-light': 0.35,
  'soft-dark': 0.5,
};

/** Neutral base surfaces. Warm/low-glare per the decision. */
export const SURFACES: Record<
  ThemeMode,
  { background: string; surface: string; surfaceRaised: string; border: string; text: string; textMuted: string }
> = {
  'soft-light': {
    background: '#F7F5F2',
    surface: '#FFFDFB',
    surfaceRaised: '#FFFFFF',
    border: '#E3DED7',
    text: '#2B2A28',
    textMuted: '#6B6862',
  },
  'soft-dark': {
    background: '#1A1B1D',
    surface: '#232528',
    surfaceRaised: '#2A2D31',
    border: '#3A3D42',
    text: '#EDEBE7',
    textMuted: '#A5A29C',
  },
};

/** Ambient transition. The decision specifies ~300ms. */
export const AMBIENT_TRANSITION_MS = 300;

/** Default information level. The decision specifies Focus. */
export const DEFAULT_INFORMATION_LEVEL: InformationLevel = 'focus';

/**
 * What each information level reveals.
 *
 * Expressed as capability flags rather than per-route conditionals so every
 * route behaves identically. Focus still shows alerts and next actions — the
 * decision is explicit that minimising information must not hide urgency.
 */
export interface InformationLevelSpec {
  /** Show the record's title/primary line. */
  showTitle: boolean;
  /** Show summary/description text. */
  showSummary: boolean;
  /** Show metadata rows (ids, dates, provenance). */
  showMetadata: boolean;
  /** Show history/timeline/provenance detail. */
  showHistory: boolean;
  /** Alerts and next actions are visible at EVERY level. */
  showAlerts: boolean;
  showNextActions: boolean;
}

export const INFORMATION_LEVELS: Record<InformationLevel, InformationLevelSpec> = {
  focus: {
    showTitle: true,
    showSummary: false,
    showMetadata: false,
    showHistory: false,
    // Never hidden: urgency is not a density setting.
    showAlerts: true,
    showNextActions: true,
  },
  standard: {
    showTitle: true,
    showSummary: true,
    showMetadata: true,
    showHistory: false,
    showAlerts: true,
    showNextActions: true,
  },
  deep: {
    showTitle: true,
    showSummary: true,
    showMetadata: true,
    showHistory: true,
    showAlerts: true,
    showNextActions: true,
  },
};

/** CSS custom-property name for a role's accent. */
export function accentVar(role: PressureBandRole): string {
  return `var(--pb-${role})`;
}

/** CSS custom-property name for a role's ambient tint. */
export function ambientVar(role: PressureBandRole): string {
  return `var(--pb-${role}-ambient)`;
}

/**
 * Build the CSS custom properties for a theme.
 *
 * Emitted once and consumed by every route, so no route hand-picks colours.
 */
export function themeCssVariables(mode: ThemeMode): Record<string, string> {
  const surfaces = SURFACES[mode];
  const band = PRESSURE_BAND[mode];
  const alpha = AMBIENT_ALPHA[mode];

  const vars: Record<string, string> = {
    '--v2-bg': surfaces.background,
    '--v2-surface': surfaces.surface,
    '--v2-surface-raised': surfaces.surfaceRaised,
    '--v2-border': surfaces.border,
    '--v2-text': surfaces.text,
    '--v2-text-muted': surfaces.textMuted,
    '--v2-ambient-transition': `${AMBIENT_TRANSITION_MS}ms`,
  };

  for (const role of Object.keys(band) as PressureBandRole[]) {
    vars[`--pb-${role}`] = band[role];
    vars[`--pb-${role}-ambient`] = hexToRgba(band[role], alpha);
    // Selection needs a border that reads against the tinted card without
    // shouting; the swatch itself is too pale for a 1px line on light.
    vars[`--pb-${role}-border`] = hexToRgba(band[role], mode === 'soft-light' ? 0.9 : 1);
  }

  return vars;
}

/** Serialize a theme's variables into a CSS rule body. */
export function themeCssBlock(mode: ThemeMode): string {
  const vars = themeCssVariables(mode);
  return Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
}

/** #RRGGBB + alpha -> rgba(). Kept local so this module has no dependencies. */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
