import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { useStepExtractorQuery } from '../lib/queries/agents';
import { createFileRoute } from '@tanstack/react-router';
import {
  INTENT_TEMPLATES,
  getTemplate,
  type IntentType,
  type ThreadRecord,
} from '../../src/lib/primary-agent-intents';
import { useHydrated } from '../../src/hooks/useHydrated';
import {
  PrimaryAgentContextRail,
  PrimaryAgentWorkspace,
  PrimaryAgentAssistantProvider,
} from '../components/primary-agent';
import { useThread } from '@assistant-ui/react';

import { useWorkSurface, useHomeSurface } from '../lib/viewer-adapter';
import type { PrimaryAgentContext } from '../../src/lib/primary-agent-adapter';
import type { NextAction } from '../../src/lib/focus-logic';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THREADS_STORAGE_KEY = 'primary-agent-threads';
const LEGACY_THREADS_STORAGE_KEY = 'huey-threads';
const MAX_HISTORY = 40;
const INITIAL_THREAD_ID = 'primary-agent-thread-initial';

const INTENT_EMOJIS: Record<string, string> = {
  plan_next_step: '🧭',
  review_spec: '📋',
  debug_blocker: '🐛',
  generate_code: '⚡',
  summarize_state: '📊',
  freeform: '💬',
};

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function loadThreads(): ThreadRecord[] {
  try {
    const raw =
      localStorage.getItem(THREADS_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_THREADS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ThreadRecord[]) : [];
  } catch {
    return [];
  }
}

function saveThread(record: ThreadRecord) {
  try {
    const threads = loadThreads().filter((t) => t.id !== record.id);
    const updated = [record, ...threads].slice(0, MAX_HISTORY);
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

function createThreadId(): string {
  return `primary-agent-thread-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type PrimaryAgentState = {
  threads: ThreadRecord[];
  threadId: string;
  activeIntent: IntentType | null;
};

export type PrimaryAgentAction =
  | { type: 'THREADS_REFRESHED'; threads: ThreadRecord[] }
  | { type: 'NEW_THREAD'; threadId: string }
  | { type: 'SWITCH_THREAD'; threadId: string }
  | { type: 'SET_INTENT'; intent: IntentType | null };

export function primaryAgentReducer(
  state: PrimaryAgentState,
  action: PrimaryAgentAction
): PrimaryAgentState {
  switch (action.type) {
    case 'THREADS_REFRESHED':
      return { ...state, threads: action.threads };
    case 'NEW_THREAD':
      return {
        ...state,
        threadId: action.threadId,
        activeIntent: null,
      };
    case 'SWITCH_THREAD':
      return {
        ...state,
        threadId: action.threadId,
        activeIntent: null,
      };
    case 'SET_INTENT':
      return { ...state, activeIntent: action.intent };
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/primary-agent')({
  component: PrimaryAgentRoute,
});

function PrimaryAgentRoute() {
  const hydrated = useHydrated();
  const [{ threads, threadId, activeIntent }, dispatch] = useReducer(
    primaryAgentReducer,
    {
      threads: [],
      threadId: INITIAL_THREAD_ID,
      activeIntent: null,
    }
  );

  useEffect(() => {
    if (!hydrated) return;
    dispatch({ type: 'THREADS_REFRESHED', threads: loadThreads() });
    dispatch({ type: 'NEW_THREAD', threadId: createThreadId() });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const refresh = () =>
      dispatch({ type: 'THREADS_REFRESHED', threads: loadThreads() });
    window.addEventListener('storage', refresh);
    window.addEventListener('primary-agent-threads-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('primary-agent-threads-updated', refresh);
    };
  }, [hydrated]);

  const newThread = useCallback(() => {
    dispatch({ type: 'NEW_THREAD', threadId: createThreadId() });
  }, []);

  const switchThread = useCallback((id: string) => {
    dispatch({ type: 'SWITCH_THREAD', threadId: id });
  }, []);

  const handleThreadIdChange = useCallback((id: string) => {
    dispatch({ type: 'SWITCH_THREAD', threadId: id });
  }, []);

  // Stable refs so PrimaryAgentAssistantProvider never needs to recreate the model adapter.
  const activeIntentRef = useRef<string | null>(activeIntent);
  activeIntentRef.current = activeIntent;

  const { data: workSurface } = useWorkSurface();
  const { data: homeSurface } = useHomeSurface();

  const contextRef = useRef<PrimaryAgentContext | null>(null);
  const workTasks: NextAction[] = workSurface?.tasks ?? [];
  const homeTasks: NextAction[] = homeSurface?.tasks ?? [];
  const allTasks = workTasks.length > 0 ? workTasks : homeTasks;
  const notes = [
    ...(homeSurface?.snapshots?.knowledge ?? []),
    ...(homeSurface?.contextTail ?? []),
  ];
  const inbox = homeSurface?.pressureBand ?? [];
  contextRef.current =
    allTasks.length > 0 || notes.length > 0 || inbox.length > 0
      ? { tasks: allTasks, notes, inbox }
      : null;

  return (
    <PrimaryAgentAssistantProvider
      threadId={threadId}
      onThreadIdChange={handleThreadIdChange}
      getIntent={() => activeIntentRef.current}
      getContext={() => contextRef.current}
    >
      <PrimaryAgentRouteInner
        threads={threads}
        threadId={threadId}
        activeIntent={activeIntent}
        onNewThread={newThread}
        onSwitchThread={switchThread}
        onSetIntent={(intent) => dispatch({ type: 'SET_INTENT', intent })}
        onFirstMessage={(record) => {
          saveThread(record);
          dispatch({ type: 'THREADS_REFRESHED', threads: loadThreads() });
          window.dispatchEvent(new Event('primary-agent-threads-updated'));
        }}
      />
    </PrimaryAgentAssistantProvider>
  );
}

// ---------------------------------------------------------------------------
// PrimaryAgentRouteInner — lives inside AssistantRuntimeProvider, uses runtime hooks
// ---------------------------------------------------------------------------

interface PrimaryAgentRouteInnerProps {
  threads: ThreadRecord[];
  threadId: string;
  activeIntent: IntentType | null;
  onNewThread: () => void;
  onSwitchThread: (id: string) => void;
  onSetIntent: (intent: IntentType | null) => void;
  onFirstMessage: (record: ThreadRecord) => void;
}

function PrimaryAgentRouteInner({
  threads,
  threadId,
  activeIntent,
  onNewThread,
  onSwitchThread,
  onSetIntent,
  onFirstMessage,
}: PrimaryAgentRouteInnerProps) {
  const thread = useThread();

  /**
   * The composer primitives handle send internally via the runtime.
   * We hook into the thread state to persist the thread record on first message.
   */
  useEffect(() => {
    // When the thread gets its first message, save the thread record.
    // thread.messages updates after the first user turn is appended.
    if (thread.messages.length !== 1) return;
    const firstMsg = thread.messages[0];
    if (!firstMsg || firstMsg.role !== 'user') return;
    if (threadId === INITIAL_THREAD_ID) return;

    const effectiveIntent = activeIntent ?? 'freeform';
    const displayText = firstMsg.content
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join(' ')
      .slice(0, 60);

    const record: ThreadRecord = {
      id: threadId,
      title: displayText,
      intent: activeIntent,
      emoji: INTENT_EMOJIS[effectiveIntent] ?? '💬',
      timestamp: Date.now(),
    };
    onFirstMessage(record);
  }, [thread.messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const lastAssistantText =
    [...thread.messages]
      .reverse()
      .find((m) => m.role === 'assistant')
      ?.content.filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join('\n') ?? '';

  const { data: extractedSteps } = useStepExtractorQuery(lastAssistantText, {
    enabled: !thread.isRunning && lastAssistantText.length > 80,
  });

  const { data: workSurface } = useWorkSurface();
  const { data: homeSurface } = useHomeSurface();

  const contextSummary = {
    taskCount: workSurface?.total ?? 0,
    noteCount:
      (homeSurface?.snapshots?.knowledge?.length ?? 0) +
      (homeSurface?.contextTail?.length ?? 0),
    inboxPending: homeSurface?.pressureBand?.length ?? 0,
  };

  return (
    <main className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 pb-6 flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-7rem)] lg:h-[calc(100vh-7rem)]">
      <div className="w-full lg:w-[250px] shrink-0">
        <PrimaryAgentContextRail
          threads={threads}
          activeThreadId={threadId}
          onSelectThread={onSwitchThread}
          onNewThread={onNewThread}
          intentTemplates={INTENT_TEMPLATES}
          activeIntent={activeIntent}
          onSelectIntent={(t) => onSetIntent(activeIntent === t ? null : t)}
        />
      </div>
      <div className="w-full flex-1 min-w-0">
        <PrimaryAgentWorkspace
          intentTemplate={activeIntent ? getTemplate(activeIntent) : null}
          contextSummary={contextSummary}
        />
      </div>

      {/* Step extractor panel — only shown when steps are available */}
      {extractedSteps && extractedSteps.steps.length > 0 && (
        <div className="w-full lg:w-[300px] shrink-0 overflow-y-auto">
          <div className="rounded-[28px] bg-white/60 backdrop-blur-sm border border-slate-200/60 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Extracted steps
            </p>
            <ol className="space-y-2">
              {extractedSteps.steps.map((step, i) => (
                <li key={i} className="text-sm space-y-0.5">
                  <p className="font-medium text-slate-800">{step.title}</p>
                  <p className="text-slate-600">{step.action}</p>
                  {step.expected_result && (
                    <p className="text-xs text-slate-500">
                      → {step.expected_result}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </main>
  );
}
