/**
 * routes/api/agent-shell.run.agent-runner.ts
 *
 * API route: POST /api/agent-shell/run/agent-runner
 */

import { createFileRoute } from '@tanstack/react-router';
import { dispatchAgentRun } from '@/app/server/agent-shell/run-dispatcher';
import type { AgentExecutionMode } from '@/app/lib/agent-shell/types';

export const Route = createFileRoute('/api/agent-shell/run/agent-runner')({
  POST: async ({ request }) => {
    const body = await request.json();
    const runRequest = {
      mode: 'agent_runner' as AgentExecutionMode,
      message: body.message as string,
      threadId: body.threadId as string | undefined,
      files: body.files as string[] | undefined,
    };

    const stream = dispatchAgentRun(runRequest);

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  },
});
