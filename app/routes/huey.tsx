import React, { useCallback, useEffect, useReducer } from 'react';
import { useStepExtractorQuery } from '../lib/queries/agents';
import { createFileRoute } from '@tanstack/react-router';
import { apiFetch } from '../../src/utils/api';
import {
  INTENT_TEMPLATES,
  getTemplate,
  type IntentType,
  type ThreadRecord,
} from '../../src/lib/huey-intents';
import {
  buildHueyAgentServerRunPath,
  parseHueyAgentServerRunResponse,
} from '../../src/lib/huey-agent-server';
import { useHydrated } from '../../src/hooks/useHydrated';
import {
  HueyContextRail,
  HueyWorkspace,
  HueyAssistantProvider,
} from '../components/huey';
import type { ChatMessage } from '../components/huey';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvokeResponse = {
  ok?: boolean;
  result?: string;
  threadId?: string;
  thread_id?: string;
  thread?: {
    id?: string;
  };
  run?: {
    output?: {
      result?: string;
      next_action?: string | null;
      tool_results_degraded?: boolean;
    };
  };
  next_action?: string | null;
  tool_results_degraded?: boolean;
};

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
// State
// ---------------------------------------------------------------------------

type HueyState = {
  threads: ThreadRecord[];
  messages: ChatMessage[];
  threadId: string;
  sending: boolean;
  activeIntent: IntentType | null;
};

type HueyAction =
  | { type: 'THREADS_REFRESHED'; threads: ThreadRecord[] }
  | { type: 'NEW_THREAD'; threadId: string }
  | { type: 'SWITCH_THREAD'; threadId: string }
  | {
      type: 'SEND_START';
      userMsg: ChatMessage;
      threadId: string;
      threads: ThreadRecord[];
    }
  | { type: 'SEND_DONE'; assistantMsg: ChatMessage; threadId: string }
  | { type: 'SEND_FAIL'; errorMsg: ChatMessage }
  | { type: 'SET_INTENT'; intent: IntentType | null };

function hueyReducer(state: HueyState, action: HueyAction): HueyState {
  switch (action.type) {
    case 'THREADS_REFRESHED':
      return { ...state, threads: action.threads };
    case 'NEW_THREAD':
      return {
        ...state,
        threadId: action.threadId,
        messages: [],
        activeIntent: null,
      };
    case 'SWITCH_THREAD':
      return {
        ...state,
        threadId: action.threadId,
        messages: [],
        activeIntent: null,
      };
    case 'SEND_START':
      return {
        ...state,
        sending: true,
        threadId: action.threadId,
        threads: action.threads,
        messages: [...state.messages, action.userMsg],
      };
    case 'SEND_DONE':
      return {
        ...state,
        sending: false,
        threadId: action.threadId,
        messages: [...state.messages, action.assistantMsg],
      };
    case 'SEND_FAIL':
      return {
        ...state,
        sending: false,
        messages: [...state.messages, action.errorMsg],
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

function createMessage(
  role: ChatMessage['role'],
  content: string,
  meta?: string
): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    meta,
  };
}

function HueyRoute() {
  const hydrated = useHydrated();
  const [{ threads, messages, threadId, sending, activeIntent }, dispatch] =
    useReducer(hueyReducer, {
      threads: [],
      messages: [],
      threadId: INITIAL_THREAD_ID,
      sending: false,
      activeIntent: null,
    });

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

  const handleSend = async (text: string) => {
    if (!text.trim() || sending) return;

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

    const effectiveThreadId =
      threadId === INITIAL_THREAD_ID ? createThreadId() : threadId;
    let nextThreadId = effectiveThreadId;
    let updatedThreads = threads;

    // Persist thread to history on first message
    if (messages.length === 0) {
      const record: ThreadRecord = {
        id: effectiveThreadId,
        title: displayText.slice(0, 60),
        intent: activeIntent,
        emoji: INTENT_EMOJIS[effectiveIntent] ?? '💬',
        timestamp: Date.now(),
      };
      saveThread(record);
      updatedThreads = loadThreads();
      window.dispatchEvent(new Event('huey-threads-updated'));
    }

    dispatch({
      type: 'SEND_START',
      userMsg: createMessage('user', displayText),
      threadId: effectiveThreadId,
      threads: updatedThreads,
    });

    try {
      const requestBody = {
        thread_id: effectiveThreadId,
        mode: 'repo+spec',
        messages: [{ role: 'user', content: prompt }],
      };
      const response = await apiFetch(
        buildHueyAgentServerRunPath(effectiveThreadId),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      let payload = (await response
        .json()
        .catch(() => null)) as InvokeResponse | null;

      if (!response.ok && (response.status === 429 || response.status >= 500)) {
        try {
          const fallbackBody = JSON.stringify({
            ...requestBody,
            mode: 'repo+spec',
            model: 'gpt-5-mini',
          });
          const fallbackResp = await apiFetch(
            buildHueyAgentServerRunPath(effectiveThreadId),
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: fallbackBody,
            }
          );
          payload = (await fallbackResp
            .json()
            .catch(() => null)) as InvokeResponse | null;
          if (fallbackResp.ok) {
            payload = {
              ...(payload || {}),
              threadId:
                payload?.threadId ||
                payload?.thread_id ||
                payload?.thread?.id ||
                effectiveThreadId,
            };
          }
        } catch {
          // ignore and fall through
        }
      }

      if (!response.ok && !payload) {
        throw new Error(`Huey request failed (${response.status})`);
      }

      const parsed = parseHueyAgentServerRunResponse(
        payload,
        effectiveThreadId
      );
      nextThreadId = parsed.threadId;

      dispatch({
        type: 'SEND_DONE',
        assistantMsg: createMessage(
          'assistant',
          parsed.assistantText,
          parsed.meta
        ),
        threadId: nextThreadId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Huey request failed';
      dispatch({
        type: 'SEND_FAIL',
        errorMsg: createMessage('system', `Request failed: ${msg}`),
      });
    }
  };

  const lastAssistantText =
    [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';

  const { data: extractedSteps } = useStepExtractorQuery(lastAssistantText, {
    enabled: !sending && lastAssistantText.length > 80,
  });

  return (
    <HueyAssistantProvider>
      <main className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 pb-6 flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-7rem)] lg:h-[calc(100vh-7rem)]">
        <div className="w-full lg:w-[250px] shrink-0">
          <HueyContextRail
            threads={threads}
            activeThreadId={threadId}
            onSelectThread={switchThread}
            onNewThread={newThread}
            intentTemplates={INTENT_TEMPLATES}
            activeIntent={activeIntent}
            onSelectIntent={(t) =>
              dispatch({
                type: 'SET_INTENT',
                intent: activeIntent === t ? null : t,
              })
            }
          />
        </div>
        <div className="w-full flex-1 min-w-0">
          <HueyWorkspace
            messages={messages}
            loading={sending}
            onSend={handleSend}
            activeIntent={activeIntent}
            intentTemplate={activeIntent ? getTemplate(activeIntent) : null}
          />
        </div>

        {/* Step extractor panel — only shown when steps are available */}
        {extractedSteps && extractedSteps.steps.length > 0 && (
          <div className="w-full lg:w-[300px] shrink-0 overflow-y-auto">
            <div className="genie-surface genie-surface--utility rounded-[28px] p-4 space-y-3">
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
    </HueyAssistantProvider>
  );
}
