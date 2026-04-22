/**
 * server/agent-shell/run-agent-runner.ts
 *
 * Agent Runner mode adapter.
 * Delegates to sandboxStreamAdapter.
 *
 * Register this module's adapter with the dispatcher to activate
 * the agent_runner mode. Until the sandbox API is available, this
 * emits a run.error explaining the mode is not yet connected.
 */

export { sandboxStreamAdapter as agentRunnerAdapter } from './sandbox-stream-adapter';
