#!/usr/bin/env node

import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const VIEWER_ROOT = resolve(HERE, '../..');
const REPO_ROOT = resolve(VIEWER_ROOT, '../..');
const manifest = JSON.parse(readFileSync(join(HERE, 'routes.json'), 'utf8'));
const totalCases = manifest.routes.length * manifest.viewports.length * manifest.themes.length;

if (process.argv.includes('--print-plan')) {
  const health = manifest.routes.find((route) => route.path === '/health');
  process.stdout.write(`${JSON.stringify({
    routes: manifest.routes.length,
    cases: totalCases,
    viewports: manifest.viewports.map(({ width, height }) => `${width}x${height}`),
    themes: manifest.themes,
    health: { path: health.path, urlPath: health.urlPath },
    pinnedCommits: manifest.pinnedCommits,
    excludedFromGate: manifest.routes
      .filter((route) => route.excludeFromGate)
      .map((route) => ({ path: route.path, reason: route.excludeFromGate })),
  })}\n`);
  process.exit(0);
}

if (totalCases !== 168) {
  throw new Error(`Manifest must describe exactly 168 cases; got ${totalCases}`);
}

const BASE_URL = process.env.VIEWER_BASE_URL || manifest.baseUrl;
const OUT_DIR = process.env.VIEWER_RELEASE_EVIDENCE_DIR ||
  '/private/tmp/viewer-v3-release-verification-2026-08-15';
const SCREENSHOT_DIR = join(OUT_DIR, 'screenshots');
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const rootEnv = readEnvFile(join(REPO_ROOT, '.env'));
const [seedUser] = JSON.parse(readFileSync(join(REPO_ROOT, 'apps/auth/src/seeds/users.json'), 'utf8'));
const email = process.env.VIEWER_RELEASE_EMAIL || rootEnv.VIEWER_RELEASE_EMAIL || seedUser.email;
const password = process.env.VIEWER_RELEASE_PASSWORD || rootEnv.VIEWER_RELEASE_PASSWORD || seedUser.password;

const browser = await chromium.launch({ headless: true });
const startedAt = new Date().toISOString();
let storageState;
try {
  storageState = await authenticate(browser, email, password);
} catch (error) {
  await browser.close();
  throw error;
}
const themeChecks = await runThemeChecks(browser, storageState);
const keyboardChecks = await runKeyboardChecks(browser, storageState);

const cases = [];
const consoleEvents = [];
for (const route of manifest.routes) {
  for (const viewport of manifest.viewports) {
    for (const theme of manifest.themes) {
      const result = await runCase(browser, storageState, route, viewport, theme);
      cases.push(result);
      consoleEvents.push(...result.console, ...result.pageErrors, ...result.network);
      process.stdout.write(`${result.exclusion ? 'EXCLUDED' : result.pass ? 'PASS' : 'FAIL'} ${result.id}\n`);
    }
  }
}

await browser.close();

const summary = {
  expectedCases: 168,
  executedCases: cases.length,
  passedCases: cases.filter((testCase) => !testCase.exclusion && testCase.pass).length,
  failedCases: cases.filter((testCase) => !testCase.exclusion && !testCase.pass).length,
  excludedCases: cases.filter((testCase) => testCase.exclusion).length,
  axeViolations: cases.filter((testCase) => !testCase.exclusion).reduce((sum, testCase) => sum + testCase.axe.violations.length, 0),
  overflowFailures: cases.filter((testCase) => !testCase.exclusion && testCase.overflow.horizontal).length,
  runtimeFailures: cases.filter((testCase) => !testCase.exclusion && (testCase.pageErrors.length || testCase.console.some((event) => event.type === 'error'))).length,
  networkFailures: cases.filter((testCase) => !testCase.exclusion && testCase.network.some((event) => event.kind === 'requestfailed' || event.status >= 500)).length,
  themeChecksPassed: themeChecks.every((check) => check.pass),
  keyboardChecksPassed: keyboardChecks.every((check) => check.pass),
};

const report = {
  task: 'viewer-v3-full-release-verification-2026-08-15',
  startedAt,
  finishedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  manifest: 'scripts/release-verification/routes.json',
  summary,
  themeChecks,
  keyboardChecks,
  cases,
};

writeJson(join(OUT_DIR, 'report.json'), report);
writeJson(join(OUT_DIR, 'console.json'), consoleEvents);
writeJson(join(OUT_DIR, 'environment.json'), await collectEnvironment(email));
writeScreenshotReview(cases);
writeKeyboardReport(keyboardChecks, themeChecks);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
process.exitCode = summary.failedCases || !summary.themeChecksPassed || !summary.keyboardChecksPassed ? 1 : 0;

async function authenticate(browserInstance, userEmail, userPassword) {
  const context = await browserInstance.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const response = await page.goto('/login', { waitUntil: 'domcontentloaded' });
  if (!response || response.status() !== 200) {
    throw new Error(`Login page unavailable: HTTP ${response?.status() ?? 'none'}`);
  }
  await page.locator('#email').fill(userEmail);
  await page.locator('#password').fill(userPassword);
  await Promise.all([
    page.waitForURL((url) => url.pathname !== '/login' && url.pathname !== '/auth/login', { timeout: 20_000 }),
    page.locator('button[type="submit"]').click(),
  ]);
  const state = await context.storageState();
  if (!state.cookies.length) {
    throw new Error(`Authentication produced no session cookie; final URL: ${page.url()}`);
  }
  await context.close();
  return state;
}

async function runCase(browserInstance, authenticatedState, route, viewport, theme) {
  const context = await browserInstance.newContext({
    baseURL: BASE_URL,
    viewport,
    colorScheme: theme === 'dark' ? 'light' : 'dark',
    storageState: route.auth ? authenticatedState : undefined,
  });
  await context.addInitScript((selectedTheme) => {
    localStorage.setItem('vault-theme', selectedTheme);
  }, theme);

  const page = await context.newPage();
  const console = [];
  const pageErrors = [];
  const network = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      console.push({ kind: 'console', type: message.type(), text: message.text() });
    }
  });
  page.on('pageerror', (error) => pageErrors.push({ kind: 'pageerror', message: error.message }));
  page.on('requestfailed', (request) => network.push({
    kind: 'requestfailed',
    url: request.url(),
    method: request.method(),
    error: request.failure()?.errorText || 'unknown',
  }));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      network.push({ kind: 'response', url: response.url(), status: response.status() });
    }
  });

  const urlPath = route.urlPath || route.path;
  let response;
  let navigationError = null;
  try {
    response = await page.goto(urlPath, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(500);
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error);
  }

  let axe = { violations: [], error: null };
  try {
    const result = await new AxeBuilder({ page }).analyze();
    axe = {
      violations: result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      })),
      error: null,
    };
  } catch (error) {
    axe = { violations: [], error: error instanceof Error ? error.message : String(error) };
  }

  const rendered = await page.evaluate((expectation) => {
    const bodyText = document.body?.innerText?.trim() || '';
    const main = document.querySelector('main');
    let marker = false;
    if (expectation.type === 'main') marker = bodyText.length >= expectation.minChars;
    if (expectation.type === 'text') marker = bodyText.includes(expectation.value);
    if (expectation.type === 'input') marker = Boolean(document.querySelector(`input[name="${expectation.name}"]`));
    if (expectation.type === 'aria-pressed') marker = Boolean(document.querySelector('[aria-pressed]'));
    return {
      marker,
      readyState: document.readyState,
      mainTextLength: main?.textContent?.trim().length || 0,
      bodyTextLength: bodyText.length,
      bodyTextSample: bodyText.slice(0, 240),
    };
  }, route.expect);

  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const width = Math.max(root.scrollWidth, document.body?.scrollWidth || 0);
    return { horizontal: width > window.innerWidth + 1, scrollWidth: width, viewportWidth: window.innerWidth };
  });
  const themeState = await page.evaluate(() => ({
    classes: [...document.documentElement.classList],
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
  }));

  const screenshot = `${safeName(route.path)}__${viewport.width}x${viewport.height}__${theme}.png`;
  await page.screenshot({ path: join(SCREENSHOT_DIR, screenshot), fullPage: true });
  const finalPath = canonicalViewerPath(new URL(page.url()).pathname);
  const finalUrl = page.url();
  const finalPathPass = [route.path, ...(route.finalPaths || [])].includes(finalPath);
  const themePass = theme === 'dark'
    ? themeState.classes.includes('dark')
    : themeState.classes.includes('light') && !themeState.classes.includes('dark');
  const hardNetworkFailures = network.filter((event) => event.kind === 'requestfailed' || event.status >= 500);
  const failures = [
    navigationError && `navigation: ${navigationError}`,
    response?.status() !== 200 && `HTTP ${response?.status() ?? 'none'}`,
    !finalPathPass && `final URL ${finalPath}`,
    !rendered.marker && 'rendered marker missing',
    axe.error && `axe: ${axe.error}`,
    axe.violations.length > 0 && `${axe.violations.length} axe violation(s)`,
    overflow.horizontal && `${overflow.scrollWidth - overflow.viewportWidth}px horizontal overflow`,
    pageErrors.length > 0 && `${pageErrors.length} page error(s)`,
    console.some((event) => event.type === 'error') && 'console error',
    hardNetworkFailures.length > 0 && `${hardNetworkFailures.length} network failure(s)`,
    !themePass && `theme mismatch: ${themeState.classes.join(' ')}`,
  ].filter(Boolean);

  await context.close();
  return {
    id: `${route.path}|${viewport.width}x${viewport.height}|${theme}`,
    route: route.path,
    urlPath,
    classification: route.auth ? (route.path === '/config' ? 'external_dependency' : 'authenticated') : 'anonymous',
    exclusion: route.excludeFromGate || null,
    viewport,
    theme,
    osColorScheme: theme === 'dark' ? 'light' : 'dark',
    httpStatus: response?.status() ?? null,
    finalUrl,
    rendered,
    axe,
    overflow,
    themeState,
    console,
    pageErrors,
    network,
    screenshot: `screenshots/${screenshot}`,
    failures,
    pass: failures.length === 0,
  };
}

async function runThemeChecks(browserInstance, authenticatedState) {
  const scenarios = [
    { name: 'explicit-dark-under-light-os', stored: 'dark', os: 'light', expected: 'dark' },
    { name: 'explicit-light-under-dark-os', stored: 'light', os: 'dark', expected: 'light' },
    { name: 'system-dark-before-and-after-hydration', stored: null, os: 'dark', expected: 'dark' },
  ];
  const results = [];
  for (const scenario of scenarios) {
    const context = await browserInstance.newContext({
      baseURL: BASE_URL,
      colorScheme: scenario.os,
      storageState: authenticatedState,
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript((stored) => {
      if (stored) localStorage.setItem('vault-theme', stored);
      else localStorage.removeItem('vault-theme');
      window.__themeTransitions = [];
      new MutationObserver(() => window.__themeTransitions.push(document.documentElement.className))
        .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }, scenario.stored);
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const before = await page.evaluate(() => window.__themeTransitions[0] || document.documentElement.className);
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
    const after = await page.evaluate(() => document.documentElement.className);
    const pass = before.split(/\s+/).includes(scenario.expected) && after.split(/\s+/).includes(scenario.expected);
    results.push({ ...scenario, before, after, pass });
    await context.close();
  }
  return results;
}

async function runKeyboardChecks(browserInstance, authenticatedState) {
  const context = await browserInstance.newContext({
    baseURL: BASE_URL,
    storageState: authenticatedState,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('/graph', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
  const checks = [];

  let focusedToggle = false;
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => ({
      text: document.activeElement?.textContent?.trim() || '',
      ariaPressed: document.activeElement?.getAttribute('aria-pressed'),
      focusVisible: document.activeElement?.matches(':focus-visible') || false,
    }));
    if (active.ariaPressed !== null) {
      const before = active.ariaPressed;
      await page.keyboard.press('Enter');
      const after = await page.evaluate(() => document.activeElement?.getAttribute('aria-pressed'));
      focusedToggle = true;
      checks.push({ name: 'graph-mode-keyboard-activation', before, after, focusVisible: active.focusVisible, pass: before !== after && active.focusVisible });
      break;
    }
  }
  if (!focusedToggle) checks.push({ name: 'graph-mode-keyboard-activation', pass: false, reason: 'No aria-pressed control reached by Tab' });

  const navigation = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      tag: active?.tagName || null,
      text: active?.textContent?.trim().slice(0, 120) || '',
      notBody: active !== document.body,
    };
  });
  checks.push({ name: 'keyboard-navigation-retains-focus', ...navigation, pass: navigation.notBody });
  await context.close();
  return checks;
}

async function collectEnvironment(authEmail) {
  const health = {};
  for (const path of ['/health', '/api/health', '/auth/health', '/tensura/health']) {
    try {
      const response = await fetch(new URL(path, BASE_URL));
      health[path] = { status: response.status, body: (await response.text()).slice(0, 500) };
    } catch (error) {
      health[path] = { error: error instanceof Error ? error.message : String(error) };
    }
  }
  return {
    capturedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    authFixture: { email: authEmail },
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    pinnedCommits: manifest.pinnedCommits,
    observedCommits: {
      superRepo: command('git', ['-C', REPO_ROOT, 'rev-parse', 'HEAD']),
      viewer: command('git', ['-C', VIEWER_ROOT, 'rev-parse', 'HEAD']),
      api: command('git', ['-C', join(REPO_ROOT, 'apps/api'), 'rev-parse', 'HEAD']),
      proxy: command('git', ['-C', join(REPO_ROOT, 'apps/proxy'), 'rev-parse', 'HEAD']),
    },
    images: Object.fromEntries(['vault-viewer', 'vault-api', 'vault-proxy', 'vault-config', 'vault-tensura'].map((image) => [
      image,
      command('/opt/podman/bin/podman', ['inspect', `localhost/${image}:latest`, '--format', '{{.Id}} {{.Created}}']),
    ])),
    health,
  };
}

function readEnvFile(path) {
  const values = {};
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

function command(binary, args) {
  try {
    return execFileSync(binary, args, { encoding: 'utf8' }).trim();
  } catch (error) {
    return `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }
}
function canonicalViewerPath(path) {
  const unmounted = path === '/_viewer' ? '/' : path.startsWith('/_viewer/') ? path.slice('/_viewer'.length) : path;
  return unmounted.length > 1 ? unmounted.replace(/\/$/, '') : unmounted;
}


function safeName(route) {
  return route === '/' ? 'index' : route.replace(/^\//, '').replaceAll('/', '__').replaceAll('_', '-');
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeScreenshotReview(results) {
  const lines = [
    '# Viewer V3 Screenshot Review',
    '',
    `Reviewer: pending`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Screenshot | Route | Viewport | Theme | Disposition | Notes |',
    '|---|---|---|---|---|---|',
    ...results.map((result) => `| ${result.screenshot} | ${result.route} | ${result.viewport.width}x${result.viewport.height} | ${result.theme} | pending | |`),
    '',
  ];
  writeFileSync(join(OUT_DIR, 'screenshot-review.md'), lines.join('\n'));
}

function writeKeyboardReport(keyboard, themes) {
  const lines = [
    '# Viewer V3 Keyboard and Theme Checks',
    '',
    '## Keyboard',
    ...keyboard.map((check) => `- [${check.pass ? 'x' : ' '}] ${check.name}: ${JSON.stringify(check)}`),
    '',
    '## Theme / OS precedence',
    ...themes.map((check) => `- [${check.pass ? 'x' : ' '}] ${check.name}: before=${JSON.stringify(check.before)}, after=${JSON.stringify(check.after)}`),
    '',
  ];
  writeFileSync(join(OUT_DIR, 'keyboard.md'), lines.join('\n'));
}
