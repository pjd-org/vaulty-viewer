import React, { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { apiFetch } from '../../src/utils/api'

type ChatRole = 'user' | 'assistant' | 'system'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  meta?: string
}

type InvokeResponse = {
  ok?: boolean
  result?: string
  threadId?: string
  thread_id?: string
}

const createMessage = (
  role: ChatRole,
  content: string,
  meta?: string
): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  meta,
})

export const Route = createFileRoute('/huey')({
  component: HueyRoute,
})

function HueyRoute() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      'assistant',
      'Huey is ready. Ask for planning, repo work, vault operations, or note triage.',
      'Connected through Tensura'
    ),
  ])
  const [input, setInput] = useState('')
  const [threadId, setThreadId] = useState<string>('huey-viewer-thread')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    timelineRef.current?.scrollTo({
      top: timelineRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, sending])

  const sendMessage = async () => {
    const prompt = input.trim()
    if (!prompt || sending) return

    const userMessage = createMessage('user', prompt)
    setMessages((current) => [...current, userMessage])
    setInput('')
    setSending(true)
    setError(null)

    try {
      const response = await apiFetch('/tensura/v1/agents/invoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const payload = (await response.json().catch(() => null)) as InvokeResponse | null
      if (!response.ok) {
        throw new Error(
          payload && typeof payload.result === 'string'
            ? payload.result
            : `Huey request failed (${response.status})`
        )
      }

      const nextThreadId =
        (payload && typeof payload.threadId === 'string' && payload.threadId) ||
        (payload && typeof payload.thread_id === 'string' && payload.thread_id) ||
        threadId
      setThreadId(nextThreadId)

      const assistantText =
        payload && typeof payload.result === 'string' && payload.result.trim().length > 0
          ? payload.result
          : 'Huey responded without text.'

      setMessages((current) => [
        ...current,
        createMessage('assistant', assistantText, `Thread ${nextThreadId}`),
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Huey request failed'
      setError(message)
      setMessages((current) => [
        ...current,
        createMessage('system', `Request failed: ${message}`),
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="page huey-page">
      <header className="huey-hero">
        <div>
          <p className="eyebrow">Huey Control Surface</p>
          <h1>Chat with Huey, directly in Viewer</h1>
          <p className="lede">
            This route talks to Tensura without going through the OpenCode web UI, so we keep the
            workflow inside the product and remove agent-selection friction.
          </p>
        </div>
        <div className="huey-hero__meta">
          <span className="api-badge api-badge--online">Tensura route</span>
          <a
            href="/tensura/opencode"
            className="huey-linkout"
            target="_blank"
            rel="noreferrer noopener"
          >
            Open OpenCode fallback
          </a>
        </div>
      </header>

      <section className="huey-shell">
        <aside className="huey-sidebar">
          <div className="huey-sidebar__card">
            <h2>Session</h2>
            <p className="huey-sidebar__value">{threadId}</p>
            <p className="huey-sidebar__hint">Tensura agent invoke thread id</p>
          </div>
          <div className="huey-sidebar__card">
            <h2>Use cases</h2>
            <ul className="huey-sidebar__list">
              <li>Plan the next implementation step</li>
              <li>Review a spec or task before promotion</li>
              <li>Draft repo changes with vault context</li>
              <li>Summarize what is blocked right now</li>
            </ul>
          </div>
        </aside>

        <section className="huey-chat">
          <div className="huey-chat__timeline" ref={timelineRef}>
            {messages.map((message) => (
              <article
                key={message.id}
                className={`huey-bubble huey-bubble--${message.role}`}
              >
                <div className="huey-bubble__header">
                  <strong>{message.role === 'assistant' ? 'Huey' : message.role}</strong>
                  {message.meta ? <span>{message.meta}</span> : null}
                </div>
                <p>{message.content}</p>
              </article>
            ))}
            {sending ? (
              <article className="huey-bubble huey-bubble--assistant huey-bubble--pending">
                <div className="huey-bubble__header">
                  <strong>Huey</strong>
                  <span>thinking</span>
                </div>
                <p>Working on it...</p>
              </article>
            ) : null}
          </div>

          <div className="huey-composer">
            <label className="huey-composer__label" htmlFor="huey-input">
              Message
            </label>
            <textarea
              id="huey-input"
              className="huey-composer__input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Huey to plan, inspect, explain, or act..."
              rows={4}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
            />
            <div className="huey-composer__footer">
              <span className="huey-composer__hint">Send with Cmd/Ctrl + Enter</span>
              <button
                type="button"
                className="huey-composer__send"
                onClick={() => void sendMessage()}
                disabled={sending || input.trim().length === 0}
              >
                {sending ? 'Sending...' : 'Send to Huey'}
              </button>
            </div>
            {error ? <p className="huey-composer__error">{error}</p> : null}
          </div>
        </section>
      </section>
    </main>
  )
}
