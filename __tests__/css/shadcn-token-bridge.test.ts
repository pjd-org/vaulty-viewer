// @vitest-environment node
/**
 * Shadcn token bridge regression gate — AC#4 and AC#5
 *
 * These tests gate the CSS token bridge statically without a browser.
 * jsdom cannot compute CSS custom property resolution; this tests the
 * source-of-truth token files directly.
 *
 * AC#4: Button variant="secondary" background must NOT be #34c759 (success green).
 *       Gated by asserting --secondary bridges to --color-surface-2.
 * AC#5: --muted must resolve to a surface color, not an accent/green.
 *       Gated by asserting --muted bridges to --color-surface-2.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

const ROOT = resolve(__dirname, '../../../..');
const tokensCss = readFileSync(
  resolve(ROOT, 'packages/ui/src/tokens.css'),
  'utf-8'
);
const bridgeCss = readFileSync(
  resolve(ROOT, 'apps/viewer/src/styles.css'),
  'utf-8'
);
const tailwindCfg = readFileSync(
  resolve(ROOT, 'apps/viewer/tailwind.config.cjs'),
  'utf-8'
);

/**
 * Extract the contents of @layer base {...} using brace-depth counting.
 * Regex alternatives fail on nested rules (.dark, media queries, etc.).
 */
function getLayerBase(css: string): string {
  const start = css.indexOf('@layer base');
  if (start === -1) return '';
  let i = css.indexOf('{', start);
  if (i === -1) return '';
  const contentStart = i + 1;
  let depth = 1;
  i++;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return css.slice(contentStart, i - 1);
}

/**
 * Get the first defined value of a CSS custom property.
 * Returns the light-mode (:root) value since it is defined first in tokens.css.
 */
function firstTokenValue(css: string, prop: string): string | null {
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escaped}\\s*:\\s*([^;\\n]+)\\s*;`);
  const match = css.match(regex);
  return match ? match[1].trim() : null;
}

const layerBase = getLayerBase(bridgeCss);

/**
 * CSS outside @layer base — the unlayered portion that wins the cascade.
 * Unlayered :root declarations have higher specificity than @layer base,
 * so this is the slice that determines effective custom-property values.
 */
const afterLayerBase = (() => {
  const layerBaseStart = bridgeCss.indexOf('@layer base');
  if (layerBaseStart === -1) return bridgeCss;
  let i = bridgeCss.indexOf('{', layerBaseStart);
  if (i === -1) return bridgeCss;
  let depth = 1;
  i++;
  while (i < bridgeCss.length && depth > 0) {
    if (bridgeCss[i] === '{') depth++;
    else if (bridgeCss[i] === '}') depth--;
    i++;
  }
  return bridgeCss.slice(0, layerBaseStart) + bridgeCss.slice(i);
})();

// Sanity-check: layerBase must contain the known bridge entries; if empty the
// brace-counter failed and all guard tests below would be false-green.
describe('getLayerBase sanity', () => {
  it('extracts a non-empty @layer base block', () => {
    expect(layerBase.length).toBeGreaterThan(100);
  });

  it('layer base contains --background bridge entry', () => {
    expect(layerBase).toMatch(/--background\s*:/);
  });

  it('layer base contains .dark nested block (validates nesting is preserved)', () => {
    expect(layerBase).toMatch(/\.dark\s*\{/);
  });
});

describe('shadcn token bridge — AC#4 regression gate (Button secondary ≠ green)', () => {
  it('--secondary bridges to --color-surface-2 in @layer base', () => {
    expect(layerBase).toMatch(/--secondary\s*:\s*var\(--color-surface-2\)/);
  });

  it('tailwind.config secondary.DEFAULT references var(--secondary)', () => {
    // Verify the Tailwind config wires the bridge variable, not a hardcoded value
    expect(tailwindCfg).toMatch(
      /secondary[\s\S]{0,60}DEFAULT[\s\S]{0,30}var\(--secondary\)/
    );
  });

  it('--secondary is not bridged to --color-success (green guard)', () => {
    expect(layerBase).not.toMatch(/--secondary\s*:\s*var\(--color-success\)/);
  });

  it('--secondary is not bridged to --vault-secondary (green guard)', () => {
    // --vault-secondary → --vault-accent-3 → --color-success → #34c759
    expect(layerBase).not.toMatch(/--secondary\s*:\s*var\(--vault-secondary\)/);
  });

  it('--color-surface-2 first (light-mode) value is not #34c759', () => {
    const value = firstTokenValue(tokensCss, '--color-surface-2');
    expect(value).not.toBeNull();
    expect(value!.toLowerCase()).not.toBe('#34c759');
  });

  it('--color-success is exactly #34c759 (validates the green sentinel is correct)', () => {
    const value = firstTokenValue(tokensCss, '--color-success');
    expect(value).not.toBeNull();
    expect(value!.toLowerCase()).toBe('#34c759');
  });
});

describe('shadcn token bridge — AC#5 regression gate (--muted = surface, not accent)', () => {
  it('--muted bridges to --color-surface-2 in @layer base', () => {
    expect(layerBase).toMatch(/--muted\s*:\s*var\(--color-surface-2\)/);
  });

  it('--muted is not bridged to --color-success (green guard)', () => {
    expect(layerBase).not.toMatch(/--muted\s*:\s*var\(--color-success\)/);
  });

  it('--muted is not bridged to --vault-secondary (green guard)', () => {
    expect(layerBase).not.toMatch(/--muted\s*:\s*var\(--vault-secondary\)/);
  });

  it('--muted and --secondary both resolve through the same surface token', () => {
    const secondaryBridge = firstTokenValue(layerBase, '--secondary');
    const mutedBridge = firstTokenValue(layerBase, '--muted');
    expect(secondaryBridge).toBe('var(--color-surface-2)');
    expect(mutedBridge).toBe('var(--color-surface-2)');
  });
});

describe('radius token separation guard', () => {
  it('--radius is var(--vault-radius) in @layer base (vault 28px, not shadcn 0.5rem)', () => {
    expect(layerBase).toMatch(/--radius\s*:\s*var\(--vault-radius\)/);
  });

  it('--radius-shadcn is 0.5rem in @layer base (shadcn default, isolated from vault)', () => {
    expect(layerBase).toMatch(/--radius-shadcn\s*:\s*0\.5rem/);
  });

  it('--radius is not 0.5rem (guard: shadcn default must not bleed into vault radius)', () => {
    // Any assignment of --radius: 0.5rem anywhere in the bridge is a regression
    expect(bridgeCss).not.toMatch(/--radius\s*:\s*0\.5rem/);
  });

  it('--radius is var(--vault-radius) in the unlayered :root (wins the cascade over @layer base)', () => {
    // Unlayered :root has higher specificity than @layer base.
    // This is the definition that actually takes effect — guard it directly.
    expect(afterLayerBase).toMatch(/--radius\s*:\s*var\(--vault-radius\)/);
  });

  it('tailwind borderRadius.shadcn references var(--radius-shadcn), not var(--radius)', () => {
    expect(tailwindCfg).toMatch(/shadcn\s*:\s*['"]var\(--radius-shadcn\)['"]/);
  });
});

describe('P9 muted leakage guard (--muted must not be defined outside @layer base)', () => {
  it('--muted is defined only inside @layer base — not in any unlayered :root block', () => {
    // Use the module-level afterLayerBase (everything before + after @layer base).
    // Lookbehind requires a CSS property-declaration context (whitespace, semicolon,
    // or open-brace immediately before --muted). This correctly excludes class names
    // like `.run-card--muted:hover` whose preceding char is `-`, not in [\s;{].
    // No negative lookahead needed: `\s*:` already excludes `--muted-foreground:`
    // because `-` (not space or colon) follows `--muted` in that case.
    expect(afterLayerBase).not.toMatch(/(?<=[\s;{])--muted\s*:/);
  });
});
