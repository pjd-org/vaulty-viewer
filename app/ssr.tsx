import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';
import {
  agentRunResponse,
  parseRunRequest,
} from '../app/server/agent-shell/run-dispatcher';

const AGENT_SHELL_PREFIX = '/api/agent-shell/run';

const startHandler = createStartHandler(defaultStreamHandler);

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Intercept POST /api/agent-shell/run/* before the SSR renderer
  if (request.method === 'POST' && pathname.startsWith(AGENT_SHELL_PREFIX)) {
    const parsed = await parseRunRequest(request.clone());
    if (!parsed) {
      return new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return agentRunResponse(parsed, { signal: request.signal });
  }

  // All other requests go through the TanStack Start SSR handler
  return startHandler(request);
}
