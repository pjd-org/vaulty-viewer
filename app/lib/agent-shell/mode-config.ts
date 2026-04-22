/**
 * agent-shell/mode-config.ts
 *
 * Maps AgentExecutionMode to server endpoint, display metadata,
 * and execution characteristics.
 */

import type { AgentExecutionMode } from './types';

export type ModeConfig = {
  mode: AgentExecutionMode;
  /** Human-readable label shown in the mode switcher */
  label: string;
  /** Short description shown in tooltips / empty states */
  description: string;
  /** Server-relative path for the run dispatcher */
  endpoint: string;
  /**
   * Whether this mode exposes subagent hierarchy in the stream rail.
   * false = opaque single-node stream.
   */
  hasSubagentVisibility: boolean;
  /**
   * Whether this mode can produce async specialist runs.
   */
  supportsAsync: boolean;
  /**
   * Whether this mode requires the sandbox path to be available.
   * If true and sandbox unavailable, mode is disabled at runtime.
   */
  requiresSandbox: boolean;
};

export const MODE_CONFIGS: Record<AgentExecutionMode, ModeConfig> = {
  deepagent: {
    mode: 'deepagent',
    label: 'DeepAgent',
    description:
      'Direct Tensura / DeepAgents orchestration with full subagent visibility.',
    endpoint: '/api/agent-shell/run/deepagent',
    hasSubagentVisibility: true,
    supportsAsync: true,
    requiresSandbox: false,
  },
  agent_runner: {
    mode: 'agent_runner',
    label: 'Agent Runner',
    description:
      'Sandboxed execution with compiled-config fidelity. Fail-closed.',
    endpoint: '/api/agent-shell/run/agent-runner',
    hasSubagentVisibility: false,
    supportsAsync: false,
    requiresSandbox: true,
  },
  prompt_runner: {
    mode: 'prompt_runner',
    label: 'Prompt Runner',
    description:
      'Tensura-owned orchestration prompt path. Lightweight direct invoke.',
    endpoint: '/api/agent-shell/run/prompt-runner',
    hasSubagentVisibility: false,
    supportsAsync: false,
    requiresSandbox: false,
  },
};

export const MODE_ORDER: AgentExecutionMode[] = [
  'deepagent',
  'agent_runner',
  'prompt_runner',
];

export const DEFAULT_MODE: AgentExecutionMode = 'deepagent';

/**
 * Returns the config for a given mode.
 * Throws if mode is unknown — callers should use AgentExecutionMode type guards.
 */
export function getModeConfig(mode: AgentExecutionMode): ModeConfig {
  const config = MODE_CONFIGS[mode];
  if (!config) throw new Error(`Unknown AgentExecutionMode: ${mode}`);
  return config;
}

/**
 * Returns modes available for selection.
 * Optionally filters out modes requiring sandbox when sandbox is unavailable.
 */
export function getAvailableModes(opts?: {
  sandboxAvailable?: boolean;
}): ModeConfig[] {
  const { sandboxAvailable = true } = opts ?? {};
  return MODE_ORDER.map((m) => MODE_CONFIGS[m]).filter(
    (c) => !c.requiresSandbox || sandboxAvailable
  );
}
