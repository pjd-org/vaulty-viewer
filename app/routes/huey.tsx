import React, { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { apiFetch } from '../../src/utils/api'
import {
  INTENT_TEMPLATES,
  getTemplate,
  type IntentType,
  type ThreadRecord,
} from '../../src/lib/huey-intents'
import { HueyContextRail, HueyWorkspace } from '../components/huey'
import type { ChatMessage } from '../components/huey'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvokeResponse = {
  ok?: boolean
  result?: string
  threadId?: string
  thread_id?: string
  next_action?: string | null
  tool_results_degraded?: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THREADS_STORAGE_KEY = 'huey-threads'
const MAX_HISTORY = 40

const INTENT_EMOJIS: Record<string, string> = {
  plan_next_step: '🧭',
  review_spec: '📋',
  debug_blocker: '🐛',
  generate_code: '⚡',
  summarize_state: '📊',
  freeform: '💬',
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function loadThreads(): ThreadRecord[] {
  try {
    const raw = localStorage.getItem(THREADS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ThreadRecord[]) : []
  } catch {
    return []
  }
}

function saveThread(record: ThreadRecord) {
  try {
    const threads = loadThreads().filter((t) => t.id !== record.id)
    const updated = [record, ...threads].slice(0, MAX_HISTORY)
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/huey')({
  component: HueyRoute,
})

function createMessage(role: ChatMessage['role'], content: string, meta?: string): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    meta,
  }
}

function HueyRoute() {
  const [threads, setThreads] = useState<ThreadRecord[]>(() => loadThreads())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [threadId, setThreadId] = useState(() => `huey-thread-${Date.now()}`)
  const [sending, setSending] = useState(false)
  const [activeIntent, setActiveIntent] = useState<IntentType | null>(null)

  useEffect(() => {
    const refresh = () => setThreads(loadThreads())
    window.addEventListener('storage', refresh)
    window.addEventListener('huey-threads-updated', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('huey-threads-updated', refresh)
    }
  }, [])

  const newThread = useCallback(() => {
    setThreadId(`huey-thread-${Date.now()}`)
    setMessages([])
    setActiveIntent(null)
  }, [])

  const switchThread = useCallback((id: string) => {
    setThreadId(id)
    setMessages([])
    setActiveIntent(null)
  }, [])

  const handleSend = async (text: string) => {
    if (!text.trim() || sending) return

    const effectiveIntent = activeIntent ?? 'freeform'
    const template = getTemplate(effectiveIntent)

    let prompt: string
    let displayText: string

    if (effectiveIntent === 'freeform') {
      prompt = text
      displayText = text
    } else {
      const mainField = template.fields[0]?.key ?? 'message'
      prompt = template.buildPrompt({ [mainField]: text })
      displayText = `[${template.label}] ${text}`
    }

    // Persist thread to history on first message
    if (messages.length === 0) {
      const record: ThreadRecord = {
        id: threadId,
        title: displayText.slice(0, 60),
        intent: activeIntent,
        emoji: INTENT_EMOJIS[effectiveIntent] ?? '💬',
        timestamp: Date.now(),
      }
      saveThread(record)
      setThreads(loadThreads())
      window.dispatchEvent(new Event('huey-threads-updated'))
    }

    setMessages((prev) => [...prev, createMessage('user', displayText)])
    setSending(true)

    try {
      const response = await apiFetch('/tensura/v1/supervisor/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          mode: 'repo+spec',
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      let payload = (await response.json().catch(() => null)) as InvokeResponse | null

      // If the primary request failed due to rate limits or server error, retry once
      // with a conservative fallback model. This helps when the default model hits
      // upstream rate limits or quota issues.
      if (!response.ok && (response.status === 429 || response.status >= 500)) {
        try {
          const fallbackBody = JSON.stringify({
            threadId,
            mode: 'repo+spec',
            model: 'gpt-5-mini',
            messages: [{ role: 'user', content: prompt }],
          })
          const fallbackResp = await apiFetch('/tensura/v1/supervisor/invoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: fallbackBody,
          })
          payload = (await fallbackResp.json().catch(() => null)) as InvokeResponse | null
          if (fallbackResp.ok) {
            // annotate that a fallback was used
            payload = { ...(payload || {}), result: payload?.result, threadId: payload?.threadId || payload?.thread_id || threadId }
          }
        } catch (fallbackErr) {
          // ignore and fall through to original error handling
          // we'll report the original response below
        }
      }

      if (!response.ok && !payload) {
        throw new Error(`Huey request failed (${response.status})`)
      }

      const nextThreadId = payload?.threadId || payload?.thread_id || threadId
      setThreadId(nextThreadId)

      const assistantText =
        payload?.result?.trim() ? payload.result : 'Huey responded without text.'

      const metaParts = [`Thread ${nextThreadId}`]
      if (payload?.next_action) metaParts.push(`Next: ${payload.next_action}`)
      if (payload?.tool_results_degraded) metaParts.push('⚠ Degraded tools')

      setMessages((prev) => [
        ...prev,
        createMessage('assistant', assistantText, metaParts.join(' · ')),
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Huey request failed'
      setMessages((prev) => [...prev, createMessage('system', `Request failed: ${msg}`)])
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="flex gap-6 h-[calc(100vh-7rem)]">
      <div className="w-[240px] shrink-0">
        <HueyContextRail
          threads={threads}
          activeThreadId={threadId}
          onSelectThread={switchThread}
          onNewThread={newThread}
          intentTemplates={INTENT_TEMPLATES}
          activeIntent={activeIntent}
          onSelectIntent={(t) => setActiveIntent(activeIntent === t ? null : t)}
        />
      </div>
      <div className="flex-1 min-w-0">
        <HueyWorkspace
          messages={messages}
          loading={sending}
          onSend={handleSend}
          activeIntent={activeIntent}
          intentTemplate={activeIntent ? getTemplate(activeIntent) : null}
        />
      </div>
    </main>
  )
}

