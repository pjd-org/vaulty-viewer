/**
 * routes/api/agent-shell.run.prompt-runner.ts
 *
 * API route: POST /api/agent-shell/run/prompt-runner
 */

import { createFileRoute } from '@tanstack/react-router';
import { dispatchAgentRun } from '@/app/server/agent-shell/run-dispatcher';
import type {
  AgentExecutionMode,
  RunAgentRequest,
} from '@/app/lib/agent-shell/types';

export const Route = createFileRoute('/api/agent-shell/run/prompt-runner')({});

export async function POST({ request }: { request: Request }) {
  const body = (await request.json()) as Partial<RunAgentRequest>;
  const runRequest: RunAgentRequest = {
    mode: 'prompt_runner' as AgentExecutionMode,
    message: body.message as string,
    threadId: body.threadId,
    files: body.files,
  };

  const stream = dispatchAgentRun(runRequest);

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
