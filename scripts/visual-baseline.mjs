#!/usr/bin/env node
/**
 * Visual baseline for the Viewer.
 *
 * Captures deterministic screenshots per route per breakpoint and compares them
 * against committed references.
 *
 * Usage:
 *   node scripts/visual-baseline.mjs                  compare against references
 *   node scripts/visual-baseline.mjs --update         write references (ONLY on
 *                                                     a deliberate, reviewed change)
 *
 * Exit codes: 0 = match, 1 = mismatch, 2 = could not run.
 *
 * Updating a baseline to make a failure go away is how visual regression
 * testing becomes decoration. --update is for accepting an intended change,
 * and the diff should be reviewed like any other.
 *
 * Determinism: fixed viewport, fixed device scale, animations disabled, reduced
 * motion, caret hidden, and a font-load settle. Anything still non-deterministic
 * is reported rather than retried into agreement.
 */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const ROUTES = ['/', '/inbox', '/explorer', '/archive', '/knowledge', '/notes', '/agent-shell', '/settings'];
const BREAKPOINTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

function parseArgs(argv) {
  const args = { baseUrl: 'http://localhost:8000', update: false, routes: null };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--update') args.update = true;
    else if (value === '--routes') args.routes = argv[++i];
    else if (!value.startsWith('--')) positional.push(value);
  }
  if (positional[0]) args.baseUrl = positional[0];
  return args;
}

const args = parseArgs(process.argv.slice(2));
const routes = args.routes ? args.routes.split(',').filter(Boolean) : ROUTES;
const refDir = join(ROOT, '.lamiliss', 'visual', 'reference');
const outDir = join(ROOT, '.lamiliss', 'out', 'visual');

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const browser = await chromium.launch({ headless: true });
const captured = [];
const failures = [];

for (const breakpoint of BREAKPOINTS) {
  const context = await browser.newContext({
    viewport: { width: breakpoint.width, height: breakpoint.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    colorScheme: 'light',
  });

  for (const route of routes) {
    const page = await context.newPage();
    const slug = route === '/' ? 'root' : route.replace(/^\//, '').replace(/\//g, '-');
    const file = `${slug}--${breakpoint.name}.png`;

    try {
      const response = await page.goto(`${args.baseUrl}${route}`, {
        // networkidle, not domcontentloaded: the shell paints immediately and
        // then live data hydrates into it. A fixed delay captured whichever
        // frame happened to be on screen, so 5 of 24 captures differed on an
        // UNCHANGED app — a baseline that cannot tell a regression from a race.
        waitUntil: 'networkidle',
        timeout: 45_000,
      });
      await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
      // Settle any post-hydration layout shift before capturing.
      await page.waitForTimeout(600);

      const shot = await page.screenshot({
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
      });

      if (args.update) {
        await mkdir(refDir, { recursive: true });
        await writeFile(join(refDir, file), shot);
        captured.push({ file, route, breakpoint: breakpoint.name, mode: 'written' });
        continue;
      }

      const refPath = join(refDir, file);
      if (!(await exists(refPath))) {
        failures.push(`${file}: no reference (run with --update to create)`);
        captured.push({ file, route, breakpoint: breakpoint.name, mode: 'missing-reference' });
        continue;
      }

      const ref = await readFile(refPath);
      if (Buffer.compare(ref, shot) === 0) {
        captured.push({ file, route, breakpoint: breakpoint.name, mode: 'match' });
      } else {
        await mkdir(outDir, { recursive: true });
        await writeFile(join(outDir, file), shot);
        failures.push(`${file}: differs from reference (actual written to .lamiliss/out/visual)`);
        captured.push({ file, route, breakpoint: breakpoint.name, mode: 'mismatch' });
      }
    } catch (error) {
      failures.push(`${file}: ${String(error.message).slice(0, 160)}`);
      captured.push({ file, route, breakpoint: breakpoint.name, mode: 'error' });
    } finally {
      await page.close();
    }
  }

  await context.close();
}

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl: args.baseUrl,
  mode: args.update ? 'update' : 'compare',
  captures: captured,
  failures,
  verdict: failures.length === 0 ? 'pass' : 'fail',
};

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

if (args.update) {
  console.log(`  WROTE ${captured.length} reference(s) to ${refDir}`);
  console.log('  Review the diff before committing — a baseline is a claim about intent.');
  process.exit(0);
}

const mismatches = captured.filter((c) => c.mode !== 'match').length;
if (mismatches > 0) {
  console.error(`  FAIL — ${mismatches} of ${captured.length} capture(s) did not match:`);
  for (const line of failures) console.error(`    ${line}`);
  process.exit(1);
}

console.log(`  PASS — ${captured.length} capture(s) match their references.`);
