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
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_DIR = join(__dirname, '../dist/client');
const VIEWER_PREFIX = '/_viewer/';

/** Minimal MIME map for Vite build output. */
const MIME = {
  '.js':    'application/javascript; charset=utf-8',
  '.mjs':   'application/javascript; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.html':  'text/html; charset=utf-8',
  '.json':  'application/json; charset=utf-8',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.eot':   'application/vnd.ms-fontobject',
  '.map':   'application/json',
};

const { default: app } = await import('../dist/server/server.js');

const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8000);

const httpServer = createServer(async (req, res) => {
  // ── Static asset serving for /_viewer/ prefix ─────────────────────────────
  // Vite builds client assets into dist/client/ with base='/_viewer/'.
  // Strip the prefix and serve directly from the filesystem so the SSR
  // handler never has to render asset paths.
  if (req.url?.startsWith(VIEWER_PREFIX)) {
    const rel = req.url.slice(VIEWER_PREFIX.length).split('?')[0]; // strip query
    const filePath = join(CLIENT_DIR, rel);
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath).toLowerCase();
      const mime = MIME[ext] ?? 'application/octet-stream';
      // Content-hashed assets are safe to cache indefinitely.
      const isHashed = /\.[a-f0-9]{8,}\./.test(rel);
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': isHashed
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      });
      createReadStream(filePath).pipe(res);
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

  if (req.url?.startsWith('/api/')) {
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

  const host = req.headers.host ?? `${HOST}:${PORT}`;
  const url = `http://${host}${req.url}`;
  const request = new Request(url, requestInit);

  let response;
  try {
    response = await app.fetch(request);
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
