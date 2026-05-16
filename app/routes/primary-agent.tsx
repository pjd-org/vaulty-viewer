import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { useStepExtractorQuery } from '../lib/queries/agents';
import { createFileRoute } from '@tanstack/react-router';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/app/components/ui/resizable';
import {
  INTENT_TEMPLATES,
  getTemplate,
  type IntentType,
  type ThreadRecord,
} from '../../src/lib/primary-agent-intents';
import { useHydrated } from '../../src/hooks/useHydrated';
import { useIsMobile } from '../hooks/use-mobile';
import {
  PrimaryAgentContextRail,
  PrimaryAgentStreamRail,
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
  const isMobile = useIsMobile();

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

  const leftPane = (
    <div className="flex h-full min-h-0 flex-col gap-5 xl:flex-row">
      <div className="w-full shrink-0 xl:w-[250px]">
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
      <div className="min-w-0 flex-1">
        <PrimaryAgentWorkspace
          intentTemplate={activeIntent ? getTemplate(activeIntent) : null}
          contextSummary={contextSummary}
        />
      </div>
    </div>
  );

  const rightPane = (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
      <PrimaryAgentStreamRail threadId={threadId} />
      {extractedSteps && extractedSteps.steps.length > 0 && (
        <div className="rounded-[28px] border border-border/60 bg-card/60 p-4 flex flex-col gap-3 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Extracted steps
          </p>
          <ol className="flex flex-col gap-2">
            {extractedSteps.steps.map((step, i) => (
              <li key={i} className="text-sm flex flex-col gap-0.5">
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="text-muted-foreground">{step.action}</p>
                {step.expected_result && (
                  <p className="text-xs text-muted-foreground">
                    → {step.expected_result}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );

  return (
    <main className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-[1320px] flex-col gap-5 px-4 pb-6 sm:px-6 lg:px-8">
      <PrimaryAgentSplitSurface
        isMobile={isMobile}
        leftPane={leftPane}
        rightPane={rightPane}
      />
    </main>
  );
}

export interface PrimaryAgentSplitSurfaceProps {
  isMobile: boolean;
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
}

export function PrimaryAgentSplitSurface({
  isMobile,
  leftPane,
  rightPane,
}: PrimaryAgentSplitSurfaceProps) {
  if (isMobile) {
    return (
      <div
        data-slot="primary-agent-split-surface"
        data-layout="mobile"
        className="flex h-full min-h-0 flex-col gap-5"
      >
        {leftPane}
        {rightPane}
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      data-slot="primary-agent-split-surface"
      data-layout="desktop"
      className="h-full min-h-0 w-full gap-5"
    >
      <ResizablePanel
        defaultSize={74}
        minSize={56}
        className="min-h-0"
      >
        {leftPane}
      </ResizablePanel>
      <ResizableHandle withHandle className="mx-2" />
      <ResizablePanel
        defaultSize={26}
        minSize={22}
        className="min-h-0"
      >
        {rightPane}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
