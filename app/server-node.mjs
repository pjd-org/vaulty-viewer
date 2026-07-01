/**
 * Node.js HTTP adapter for the TanStack Start Vite SSR build.
 *
 * dist/server/server.js exports a WinterCG-compatible { fetch } handler.
 * This script adapts it to a plain Node.js HTTP server so it can run in
 * Docker without requiring Vinxi or any additional runtime dependency.
 */
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { Buffer } from 'node:buffer';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_DIR = join(__dirname, '../dist/client');
const CLIENT_DIR_RESOLVED = resolve(CLIENT_DIR);
const VIEWER_PREFIX = '/_viewer/';
const VIEWER_API_PREFIXES = ['/api/agent-shell/run/'];

/** Minimal MIME map for Vite build output. */
const MIME = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
};

let app = null;
for (const candidate of ['../dist/server/ssr.js', '../dist/server/server.js']) {
  try {
    const mod = await import(candidate);
    app = mod?.default ?? null;
    if (app) break;
  } catch {
    // Try next candidate.
  }
}

if (!app) {
  throw new Error(
    'Viewer SSR entry not found. Expected dist/server/ssr.js or dist/server/server.js.'
  );
}

const appHandler =
  typeof app === 'function'
    ? app
    : typeof app?.fetch === 'function'
      ? app.fetch.bind(app)
      : null;

if (!appHandler) {
  throw new Error(
    'Viewer SSR entry does not expose a handler. Expected default function or { fetch }.'
  );
}

const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8000);

const httpServer = createServer(async (req, res) => {
  // ── Static asset serving for /_viewer/ prefix ─────────────────────────────
  // Vite builds client assets into dist/client/ with base='/_viewer/'.
  // Strip the prefix and serve directly from the filesystem so the SSR
  // handler never has to render asset paths.
  if (req.url?.startsWith(VIEWER_PREFIX)) {
    const rawRel = req.url.slice(VIEWER_PREFIX.length).split('?')[0]; // strip query
    let rel;
    try {
      rel = decodeURIComponent(rawRel);
    } catch (e) {
      res.writeHead(400);
      res.end('Bad request');
      return;
    }

    // Prevent absolute path usage and normalize the requested path.
    const attempted = resolve(CLIENT_DIR_RESOLVED, './' + rel);
    if (
      !attempted.startsWith(CLIENT_DIR_RESOLVED + sep) &&
      attempted !== CLIENT_DIR_RESOLVED
    ) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (existsSync(attempted) && statSync(attempted).isFile()) {
      const ext = extname(attempted).toLowerCase();
      const mime = MIME[ext] ?? 'application/octet-stream';
      // Content-hashed assets are safe to cache indefinitely.
      const isHashed = /\.[a-f0-9]{8,}\./.test(rel);
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': isHashed
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      });
      createReadStream(attempted).pipe(res);
      return;
    }
    // Asset not found — fall through to SSR (will likely 404).
  }

  // Collect request body (skip for bodyless methods)
  const bodylessMethods = new Set(['GET', 'HEAD', 'OPTIONS', 'DELETE']);
  let body = null;
  if (!bodylessMethods.has(req.method ?? 'GET')) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length) body = Buffer.concat(chunks);
  }

  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (Array.isArray(val)) val.forEach((v) => headers.append(key, v));
    else if (val != null) headers.set(key, val);
  }

  const requestInit = {
    method: req.method ?? 'GET',
    headers,
    body,
    // Required by Node.js 18+ when body is present
    ...(body ? { duplex: 'half' } : {}),
  };

  const isViewerOwnedApi = VIEWER_API_PREFIXES.some((prefix) =>
    req.url?.startsWith(prefix)
  );

  if (req.url?.startsWith('/api/') && !isViewerOwnedApi) {
    const apiProxyUrl = process.env.API_PROXY_URL?.trim();
    if (apiProxyUrl) {
      const upstreamUrl = new URL(req.url, apiProxyUrl);
      const proxyHeaders = new Headers(headers);
      proxyHeaders.delete('host');
      proxyHeaders.delete('connection');
      proxyHeaders.delete('content-length');

      try {
        const upstreamResponse = await fetch(upstreamUrl, {
          ...requestInit,
          headers: proxyHeaders,
        });

        res.statusCode = upstreamResponse.status;
        upstreamResponse.headers.forEach((val, key) => res.setHeader(key, val));

        if (upstreamResponse.body) {
          Readable.fromWeb(upstreamResponse.body).pipe(res);
        } else {
          res.end();
        }
      } catch (err) {
        console.error('[viewer] API proxy error', err);
        res.writeHead(502);
        res.end('Bad Gateway');
      }
      return;
    }
  }

  const rawHost = req.headers.host ?? `${HOST}:${PORT}`;
  const hostAllowlist = /^([a-zA-Z0-9.\-]+)(:\d+)?$/;
  const safeHost = hostAllowlist.test(String(rawHost))
    ? String(rawHost)
    : `${HOST}:${PORT}`;

  let url;
  try {
    // Use URL constructor to build a safe absolute URL for the request
    url = new URL(req.url ?? '/', `http://${safeHost}`).toString();
  } catch (err) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  const request = new Request(url, requestInit);

  let response;
  try {
    response = await appHandler(request);
  } catch (err) {
    console.error('[viewer] unhandled fetch error', err);
    res.writeHead(500);
    res.end('Internal Server Error');
    return;
  }

  res.statusCode = response.status;
  response.headers.forEach((val, key) => res.setHeader(key, val));

  if (response.body) {
    Readable.fromWeb(response.body).pipe(res);
  } else {
    res.end();
  }
});

httpServer.listen(PORT, HOST, () => {
  console.log(`[viewer] listening on http://${HOST}:${PORT}`);
});
