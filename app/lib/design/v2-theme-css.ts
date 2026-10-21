/**
 * Viewer V2 — Pressure Band theme stylesheet.
 *
 * Generates the CSS custom properties for both themes from the token module,
 * so there is exactly one place the palette lives. Hand-writing these values
 * into CSS is how a design system silently forks.
 *
 * Applied by data attribute on <html>, so any route inherits it without
 * per-route imports.
 */
import { themeCssBlock } from '../app/lib/design/pressure-band';

export function buildViewerV2Css(): string {
  return `
/* Viewer V2 — Soft Light / Soft Dark, Pressure Band palette.
   Generated from app/lib/design/pressure-band.ts. Do not hand-edit values. */

:root,
[data-v2-theme='soft-light'] {
${themeCssBlock('soft-light')}
  color-scheme: light;
}

[data-v2-theme='soft-dark'] {
${themeCssBlock('soft-dark')}
  color-scheme: dark;
}

/* Ambient tint must not animate for users who asked for reduced motion. */
@media (prefers-reduced-motion: reduce) {
  [data-ambient],
  [data-testid='v2-selectable-card'] {
    transition: none !important;
  }
}
`.trim();
}
