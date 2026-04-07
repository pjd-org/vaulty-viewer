import React, { useCallback, useEffect, useReducer } from 'react';
import { useStepExtractorQuery } from '../lib/queries/agents';
import { createFileRoute } from '@tanstack/react-router';
import {
  INTENT_TEMPLATES,
  getTemplate,
  type IntentType,
  type ThreadRecord,
} from '../../src/lib/huey-intents';
import { useHydrated } from '../../src/hooks/useHydrated';
import {
  HueyContextRail,
  HueyWorkspace,
  HueyAssistantProvider,
} from '../components/huey';
import { useThread, useThreadRuntime } from '@assistant-ui/react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THREADS_STORAGE_KEY = 'huey-threads';
const MAX_HISTORY = 40;
const INITIAL_THREAD_ID = 'huey-thread-initial';

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
    const raw = localStorage.getItem(THREADS_STORAGE_KEY);
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
  return `huey-thread-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// State — messages/sending/cancelled moved to @assistant-ui/react runtime
// ---------------------------------------------------------------------------

export type HueyState = {
  threads: ThreadRecord[];
  threadId: string;
  activeIntent: IntentType | null;
};

export type HueyAction =
  | { type: 'THREADS_REFRESHED'; threads: ThreadRecord[] }
  | { type: 'NEW_THREAD'; threadId: string }
  | { type: 'SWITCH_THREAD'; threadId: string }
  | { type: 'SET_INTENT'; intent: IntentType | null };

export function hueyReducer(state: HueyState, action: HueyAction): HueyState {
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

export const Route = createFileRoute('/huey')({
  component: HueyRoute,
});

function HueyRoute() {
  const hydrated = useHydrated();
  const [{ threads, threadId, activeIntent }, dispatch] = useReducer(
    hueyReducer,
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
    window.addEventListener('huey-threads-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('huey-threads-updated', refresh);
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

  return (
    <HueyAssistantProvider
      threadId={threadId}
      onThreadIdChange={handleThreadIdChange}
    >
      <HueyRouteInner
        threads={threads}
        threadId={threadId}
        activeIntent={activeIntent}
        onNewThread={newThread}
        onSwitchThread={switchThread}
        onSetIntent={(intent) => dispatch({ type: 'SET_INTENT', intent })}
        onFirstMessage={(record) => {
          saveThread(record);
          dispatch({ type: 'THREADS_REFRESHED', threads: loadThreads() });
          window.dispatchEvent(new Event('huey-threads-updated'));
        }}
      />
    </HueyAssistantProvider>
  );
}

// ---------------------------------------------------------------------------
// HueyRouteInner — lives inside AssistantRuntimeProvider, uses runtime hooks
// ---------------------------------------------------------------------------

interface HueyRouteInnerProps {
  threads: ThreadRecord[];
  threadId: string;
  activeIntent: IntentType | null;
  onNewThread: () => void;
  onSwitchThread: (id: string) => void;
  onSetIntent: (intent: IntentType | null) => void;
  onFirstMessage: (record: ThreadRecord) => void;
}

function HueyRouteInner({
  threads,
  threadId,
  activeIntent,
  onNewThread,
  onSwitchThread,
  onSetIntent,
  onFirstMessage,
}: HueyRouteInnerProps) {
  const thread = useThread();
  const threadRuntime = useThreadRuntime();

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || thread.isRunning) return;
      // Pre-hydration guard: threadId is still the SSR placeholder
      if (threadId === INITIAL_THREAD_ID) return;

      const effectiveIntent = activeIntent ?? 'freeform';
      const template = getTemplate(effectiveIntent);

      let prompt: string;
      let displayText: string;

      if (effectiveIntent === 'freeform') {
        prompt = text;
        displayText = text;
      } else {
        const mainField = template.fields[0]?.key ?? 'message';
        prompt = template.buildPrompt({ [mainField]: text });
        displayText = `[${template.label}] ${text}`;
      }

      // Persist thread to history on first message
      if (thread.messages.length === 0) {
        const record: ThreadRecord = {
          id: threadId,
          title: displayText.slice(0, 60),
          intent: activeIntent,
          emoji: INTENT_EMOJIS[effectiveIntent] ?? '💬',
          timestamp: Date.now(),
        };
        onFirstMessage(record);
      }

      threadRuntime.append({
        role: 'user',
        content: [{ type: 'text', text: prompt }],
      });
    },
    [
      thread.isRunning,
      thread.messages.length,
      activeIntent,
      threadId,
      threadRuntime,
      onFirstMessage,
    ]
  );

  const handleCancel = useCallback(() => {
    threadRuntime.cancelRun();
  }, [threadRuntime]);

  // Map @assistant-ui/react ThreadMessage[] → ChatMessage[] for HueyWorkspace
  const messages = thread.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content
        .filter((p) => p.type === 'text')
        .map((p) => (p as { type: 'text'; text: string }).text)
        .join('\n'),
    }));

  const lastAssistantText =
    [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';

  const { data: extractedSteps } = useStepExtractorQuery(lastAssistantText, {
    enabled: !thread.isRunning && lastAssistantText.length > 80,
  });

  return (
    <main className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 pb-6 flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-7rem)] lg:h-[calc(100vh-7rem)]">
      <div className="w-full lg:w-[250px] shrink-0">
        <HueyContextRail
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
        <HueyWorkspace
          messages={messages}
          loading={thread.isRunning}
          onSend={handleSend}
          onCancel={handleCancel}
          activeIntent={activeIntent}
          intentTemplate={activeIntent ? getTemplate(activeIntent) : null}
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
