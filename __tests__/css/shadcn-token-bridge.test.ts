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

/** Extract the @layer base block from the bridge CSS. */
function getLayerBase(css: string): string {
  const match = css.match(/@layer base\s*\{([\s\S]*?)\n\}/);
  return match ? match[1] : css;
}

/** Get the first resolved (light-mode) value of a CSS custom property. */
function firstTokenValue(css: string, prop: string): string | null {
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escaped}\\s*:\\s*([^;\\n]+)\\s*;`);
  const match = css.match(regex);
  return match ? match[1].trim() : null;
}

const layerBase = getLayerBase(bridgeCss);

describe('shadcn token bridge — AC#4 regression gate (Button secondary ≠ green)', () => {
  it('--secondary is bridged to --color-surface-2, not a green token', () => {
    // The bridge must explicitly route --secondary through --color-surface-2
    expect(bridgeCss).toMatch(/--secondary\s*:\s*var\(--color-surface-2\)/);
  });

  it('--secondary is not bridged to --color-success (green guard)', () => {
    expect(layerBase).not.toMatch(/--secondary\s*:\s*var\(--color-success\)/);
  });

  it('--secondary is not bridged to --vault-secondary (green guard)', () => {
    // --vault-secondary resolves to --vault-accent-3 → --color-success → #34c759
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
  it('--muted is bridged to --color-surface-2, not a green/accent token', () => {
    expect(bridgeCss).toMatch(/--muted\s*:\s*var\(--color-surface-2\)/);
  });

  it('--muted is not bridged to --color-success (green guard)', () => {
    expect(layerBase).not.toMatch(/--muted\s*:\s*var\(--color-success\)/);
  });

  it('--muted is not bridged to --vault-secondary (green guard)', () => {
    expect(layerBase).not.toMatch(/--muted\s*:\s*var\(--vault-secondary\)/);
  });

  it('--muted and --secondary both resolve through the same surface token', () => {
    const secondaryBridge = firstTokenValue(
      bridgeCss.match(/@layer base[\s\S]*?\n\}/)?.[0] ?? bridgeCss,
      '--secondary'
    );
    const mutedBridge = firstTokenValue(
      bridgeCss.match(/@layer base[\s\S]*?\n\}/)?.[0] ?? bridgeCss,
      '--muted'
    );
    // Both must trace through --color-surface-2 (not diverge to different tokens)
    expect(secondaryBridge).toBe('var(--color-surface-2)');
    expect(mutedBridge).toBe('var(--color-surface-2)');
  });
});
