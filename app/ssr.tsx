import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';
import {
  agentRunResponse,
  parseRunRequest,
  registerModeAdapter,
} from '../app/server/agent-shell/run-dispatcher';
import { deepAgentAdapter } from '../app/server/agent-shell/run-deepagent';
import { agentRunnerAdapter } from '../app/server/agent-shell/run-agent-runner';
import { promptRunnerAdapter } from '../app/server/agent-shell/run-prompt-runner';
import type { AgentExecutionMode } from '../app/lib/agent-shell/types';

// Register real adapters — replaces Phase 2 stubs
registerModeAdapter('deepagent', deepAgentAdapter);
registerModeAdapter('agent_runner', agentRunnerAdapter);
registerModeAdapter('prompt_runner', promptRunnerAdapter);

const AGENT_SHELL_PREFIX = '/api/agent-shell/run';
const MODE_BY_PATH_SUFFIX: Record<string, AgentExecutionMode> = {
  '/deepagent': 'deepagent',
  '/agent-runner': 'agent_runner',
  '/prompt-runner': 'prompt_runner',
};

function resolveModeFromPath(pathname: string): AgentExecutionMode | null {
  for (const [suffix, mode] of Object.entries(MODE_BY_PATH_SUFFIX)) {
    if (pathname.endsWith(suffix)) return mode;
  }
  return null;
}

const startHandler = createStartHandler(defaultStreamHandler);

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Intercept POST /api/agent-shell/run/* before the SSR renderer
  if (request.method === 'POST' && pathname.startsWith(AGENT_SHELL_PREFIX)) {
    const mode = resolveModeFromPath(pathname);
    if (!mode) {
      return new Response(JSON.stringify({ error: 'Unknown agent-shell mode' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parsed = await parseRunRequest(request.clone(), { mode });
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
