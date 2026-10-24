#!/usr/bin/env node
/**
 * Accessibility baseline for the Viewer.
 *
 * Runs axe against the real, served application. This is deliberately NOT a
 * vitest test: axe needs a live document in a real browser, and jsdom has no
 * layout engine, so an in-process test would report passes it cannot justify.
 *
 * Usage:
 *   node scripts/a11y-baseline.mjs [baseUrl]
 *   node scripts/a11y-baseline.mjs http://localhost:8000 --routes /explorer
 *
 * Exit codes: 0 = no violations at or above the threshold, 1 = violations,
 * 2 = could not run (which is a failure, not a pass).
 *
 * A baseline is a floor, not a certificate. It records what the current UI
 * violates so regressions are visible; it does not mean the UI is accessible.
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const DEFAULT_ROUTES = [
  '/',
  '/inbox',
  '/explorer',
  '/archive',
  '/knowledge',
  '/notes',
  '/agent-shell',
  '/settings',
];

/** Impacts that fail the run. 'minor'/'moderate' are reported, not fatal. */
const FAILING_IMPACTS = new Set(['critical', 'serious']);

function parseArgs(argv) {
  const args = { baseUrl: 'http://localhost:8000', routes: null, out: null };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--routes') args.routes = argv[++i];
    else if (value === '--out') args.out = argv[++i];
    else if (!value.startsWith('--')) positional.push(value);
  }
  if (positional[0]) args.baseUrl = positional[0];
  return args;
}

const args = parseArgs(process.argv.slice(2));
const routes = args.routes ? args.routes.split(',').filter(Boolean) : DEFAULT_ROUTES;
const outPath = args.out
  ? join(ROOT, args.out)
  : join(ROOT, '.lamiliss', 'out', 'a11y', 'baseline.json');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const results = [];

for (const route of routes) {
  const url = `${args.baseUrl}${route}`;
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error.message).slice(0, 200)));

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // Let hydration settle: axe against a half-rendered tree reports phantom
    // violations that are not real once the app mounts.
    await page.waitForTimeout(1_200);

    const analysis = await new AxeBuilder({ page }).analyze();
    results.push({
      route,
      status: response?.status() ?? 0,
      passes: analysis.passes.length,
      violations: analysis.violations.map((v) => ({
        id: v.id,
        impact: v.impact ?? 'unknown',
        help: v.help,
        nodes: v.nodes.length,
      })),
      pageErrors,
    });
  } catch (error) {
    // A route that cannot be analyzed is a failure, not a skip.
    results.push({
      route,
      status: 0,
      passes: 0,
      violations: [{ id: 'unreachable', impact: 'critical', help: String(error.message).slice(0, 200), nodes: 1 }],
      pageErrors,
    });
  } finally {
    await page.close();
  }
}

await context.close();
await browser.close();

const failing = results.flatMap((r) =>
  r.violations
    .filter((v) => FAILING_IMPACTS.has(v.impact))
    .map((v) => `${r.route}: ${v.id} (${v.impact}) — ${v.help} [${v.nodes} node(s)]`)
);

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl: args.baseUrl,
  routes: results,
  failingImpacts: [...FAILING_IMPACTS],
  failing,
  verdict: failing.length === 0 ? 'pass' : 'fail',
};

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

for (const r of results) {
  const worst = r.violations.length === 0
    ? 'clean'
    : r.violations.map((v) => `${v.id}(${v.impact})`).join(', ');
  console.log(`  ${r.route} [${r.status}] passes=${r.passes} violations=${r.violations.length} — ${worst}`);
}

if (failing.length > 0) {
  console.error(`\n  FAIL — ${failing.length} violation(s) at critical/serious impact:`);
  for (const line of failing) console.error(`    ${line}`);
  console.error(`\n  Baseline written to ${outPath}`);
  process.exit(1);
}

console.log(`\n  PASS — no critical/serious violations across ${results.length} route(s).`);
console.log(`  Baseline written to ${outPath}`);
