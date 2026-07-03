/**
 * primary-agent-toolkit.tsx — Tool UI toolkit for Primary Agent chat.
 *
 * Registers three frontend tool renders:
 *   - show_plan         → renders a Plan card with todo list and progress bar
 *   - show_stats        → renders a StatsDisplay card with key metrics
 *   - show_progress     → renders a ProgressTracker with live step indicators
 *
 * Each tool is type "backend" — the server drives arguments; the client renders
 * the result using the registered render function.
 *
 * If the adapter returns no tool-call parts today the components degrade
 * gracefully to ToolFallback (handled in thread.tsx at line 268).
 */
import React from 'react';
import { Plan } from '../components/tool-ui/plan';
import { StatsDisplay } from '../components/tool-ui/stats-display';
import { ProgressTracker } from '../components/tool-ui/progress-tracker';
import {
  safeParseSerializablePlan,
  type SerializablePlan,
} from '../components/tool-ui/plan/schema';
import {
  safeParseSerializableStatsDisplay,
  type SerializableStatsDisplay,
} from '../components/tool-ui/stats-display/schema';
import {
  safeParseSerializableProgressTracker,
  type SerializableProgressTracker,
} from '../components/tool-ui/progress-tracker/schema';

export const primaryAgentToolkit = {
  show_plan: {
    type: 'backend' as const,
    description:
      'Call when you want to display a structured plan with a list of todos and a progress bar. Use for multi-step task breakdowns, project plans, or any checklist-style output.',
    render: ({ args }: { args: unknown }) => {
      const plan = safeParseSerializablePlan(args) as SerializablePlan | null;
      if (!plan) return null;
      return <Plan {...plan} />;
    },
  },

  show_stats: {
    type: 'backend' as const,
    description:
      'Call when you want to display one or more key metrics or statistics. Use for dashboards, summaries with numeric values, currency, percentages, or trend sparklines.',
    render: ({ args }: { args: unknown }) => {
      const stats = safeParseSerializableStatsDisplay(
        args
      ) as SerializableStatsDisplay | null;
      if (!stats) return null;
      return <StatsDisplay {...stats} />;
    },
  },

  show_progress: {
    type: 'backend' as const,
    description:
      'Call when you want to show the real-time status of a multi-step operation. Use for long-running workflows, pipeline steps, or any process with distinct stages that have pending/in-progress/completed/failed states.',
    render: ({ args }: { args: unknown }) => {
      const tracker = safeParseSerializableProgressTracker(
        args
      ) as SerializableProgressTracker | null;
      if (!tracker) return null;
      return <ProgressTracker {...tracker} />;
    },
  },
};
