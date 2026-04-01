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

const { default: app } = await import('../dist/server/server.js');

const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8000);

const httpServer = createServer(async (req, res) => {
  const host = req.headers.host ?? `${HOST}:${PORT}`;
  const url = `http://${host}${req.url}`;

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

  const request = new Request(url, {
    method: req.method ?? 'GET',
    headers,
    body,
    // Required by Node.js 18+ when body is present
    ...(body ? { duplex: 'half' } : {}),
  });

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
