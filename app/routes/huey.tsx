import React, { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { apiFetch } from '../../src/utils/api'
import {
  INTENT_TEMPLATES,
  getTemplate,
  isIntentComplete,
  type IntentType,
  type IntentTemplate,
} from '../../src/lib/huey-intents'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  next_action?: string | null
  tool_results_degraded?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INITIAL_MESSAGE_CONTENT =
  'Huey is ready. Select an intent or type freely.'

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

function makeInitialMessages(): ChatMessage[] {
  return [createMessage('assistant', INITIAL_MESSAGE_CONTENT, 'Connected through Tensura supervisor')]
}

function renderMarkdown(content: string): string {
  const raw = marked.parse(content, { async: false }) as string
  return sanitizeHtml(raw, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'code', 'pre', 'kbd', 'mark'],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      code: ['class'],
      pre: ['class'],
    },
  })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HueyHeader({
  threadId,
  activeIntent,
  onNewThread,
  sending,
}: {
  threadId: string
  activeIntent: IntentType | null
  onNewThread: () => void
  sending: boolean
}) {
  const intentLabel = activeIntent
    ? INTENT_TEMPLATES.find((t) => t.id === activeIntent)?.label
    : null

  return (
    <header className="huey-header">
      <div className="huey-header__identity">
        <h1 className="huey-header__title">Huey</h1>
        {intentLabel && (
          <span className="huey-header__intent-chip">{intentLabel}</span>
        )}
      </div>
      <div className="huey-header__meta">
        <span className="huey-header__thread" title={threadId}>
          {threadId.length > 28 ? `…${threadId.slice(-20)}` : threadId}
        </span>
        <button
          className="huey-header__new-thread"
          onClick={onNewThread}
          disabled={sending}
        >
          New thread
        </button>
        <Link to="/" className="pill pill--ghost">← Focus</Link>
      </div>
    </header>
  )
}

function IntentSelector({ onSelect }: { onSelect: (id: IntentType) => void }) {
  const primary = INTENT_TEMPLATES.filter((t) => t.id !== 'freeform')
  const freeform = INTENT_TEMPLATES.find((t) => t.id === 'freeform')!

  return (
    <div className="huey-intent-surface">
      <p className="huey-intent-surface__label">What do you want to do?</p>
      <div className="huey-intent-grid">
        {primary.map((t) => (
          <button
            key={t.id}
            className="huey-intent-btn"
            onClick={() => onSelect(t.id)}
          >
            <span className="huey-intent-btn__label">{t.label}</span>
            <span className="huey-intent-btn__desc">{t.description}</span>
          </button>
        ))}
      </div>
      <button
        className="huey-intent-btn huey-intent-btn--freeform"
        onClick={() => onSelect(freeform.id)}
      >
        <span className="huey-intent-btn__label">{freeform.label}</span>
        <span className="huey-intent-btn__desc">{freeform.description}</span>
      </button>
    </div>
  )
}

function DynamicInput({
  template,
  values,
  onChange,
  onSend,
  onBack,
  sending,
  error,
}: {
  template: IntentTemplate
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  onSend: () => void
  onBack: () => void
  sending: boolean
  error: string | null
}) {
  const canSend = !sending && isIntentComplete(template, values)

  const set = (key: string, value: string) => onChange({ ...values, [key]: value })

  return (
    <div className="huey-dynamic-input">
      <div className="huey-dynamic-input__header">
        <span className="huey-dynamic-input__intent">{template.label}</span>
        <button className="huey-dynamic-input__back" onClick={onBack}>
          ← Change
        </button>
      </div>

      <div className="huey-dynamic-input__fields">
        {template.fields.map((field) => (
          <div key={field.key} className="huey-field">
            <label className="huey-field__label" htmlFor={`huey-field-${field.key}`}>
              {field.label}
              {!field.required && <span className="huey-field__optional"> (optional)</span>}
            </label>
            {field.multiline ? (
              <textarea
                id={`huey-field-${field.key}`}
                className="huey-field__input huey-field__input--textarea"
                value={values[field.key] ?? ''}
                onChange={(e) => set(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={field.id === 'freeform' ? 5 : 3}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend) {
                    e.preventDefault()
                    onSend()
                  }
                }}
              />
            ) : (
              <input
                id={`huey-field-${field.key}`}
                type="text"
                className="huey-field__input"
                value={values[field.key] ?? ''}
                onChange={(e) => set(field.key, e.target.value)}
                placeholder={field.placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSend) {
                    e.preventDefault()
                    onSend()
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="huey-dynamic-input__footer">
        <span className="huey-composer__hint">
          {template.id === 'freeform' ? 'Cmd/Ctrl+Enter to send' : 'Enter or Cmd+Enter to send'}
        </span>
        <button
          className="na-card__btn na-card__btn--start"
          onClick={onSend}
          disabled={!canSend}
        >
          {sending ? 'Sending…' : 'Send to Huey'}
        </button>
      </div>

      {error && <p className="huey-composer__error">{error}</p>}
    </div>
  )
}

function PostResponseActions() {
  return (
    <div className="huey-post-actions">
      <Link to="/" className="chip chip--tag huey-post-action">
        View next actions →
      </Link>
      <Link to="/" className="chip chip--tag huey-post-action" onClick={() => {
        // Signal to Focus page to open session panel
        sessionStorage.setItem('huey-open-session', '1')
      }}>
        Start session →
      </Link>
      <Link to="/kanban" className="chip chip--tag huey-post-action">
        Open board →
      </Link>
    </div>
  )
}

function ChatTimeline({
  messages,
  sending,
}: {
  messages: ChatMessage[]
  sending: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  return (
    <div className="huey-chat__timeline" ref={ref}>
      {messages.map((message) => (
        <article key={message.id} className={`huey-bubble huey-bubble--${message.role}`}>
          <div className="huey-bubble__header">
            <strong>
              {message.role === 'assistant' ? 'Huey' : message.role === 'user' ? 'You' : message.role}
            </strong>
            {message.meta ? <span>{message.meta}</span> : null}
          </div>
          {message.role === 'assistant' ? (
            <>
              <div
                className="huey-bubble__body"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
              />
              <PostResponseActions />
            </>
          ) : (
            <p>{message.content}</p>
          )}
        </article>
      ))}
      {sending && (
        <article className="huey-bubble huey-bubble--assistant huey-bubble--pending">
          <div className="huey-bubble__header">
            <strong>Huey</strong>
            <span>thinking</span>
          </div>
          <p>Working on it…</p>
        </article>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/huey')({
  component: HueyRoute,
})

function HueyRoute() {
  const [messages, setMessages] = useState<ChatMessage[]>(makeInitialMessages)
  const [threadId, setThreadId] = useState('huey-viewer-thread')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIntent, setActiveIntent] = useState<IntentType | null>(null)
  const [intentValues, setIntentValues] = useState<Record<string, string>>({})

  const newThread = () => {
    setThreadId(`huey-viewer-thread-${Date.now()}`)
    setMessages(makeInitialMessages())
    setError(null)
    setActiveIntent(null)
    setIntentValues({})
  }

  const resetIntent = () => {
    setActiveIntent(null)
    setIntentValues({})
    setError(null)
  }

  const selectIntent = (id: IntentType) => {
    setActiveIntent(id)
    setIntentValues({})
    setError(null)
  }

  const sendMessage = async () => {
    if (!activeIntent || sending) return

    const template = getTemplate(activeIntent)
    if (!isIntentComplete(template, intentValues)) return

    const prompt = template.buildPrompt(intentValues)
    if (!prompt.trim()) return

    const displayText =
      activeIntent === 'freeform'
        ? intentValues.message ?? prompt
        : `[${template.label}] ${Object.values(intentValues).filter(Boolean).join(' · ')}`

    const userMessage = createMessage('user', displayText)
    setMessages((prev) => [...prev, userMessage])
    setIntentValues({})
    setSending(true)
    setError(null)

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
        payload && typeof payload.result === 'string' && payload.result.trim()
          ? payload.result
          : 'Huey responded without text.'

      const metaParts = [`Thread ${nextThreadId}`]
      if (payload?.next_action) metaParts.push(`Next: ${payload.next_action}`)
      if (payload?.tool_results_degraded) metaParts.push('Degraded tools')

      setMessages((prev) => [
        ...prev,
        createMessage('assistant', assistantText, metaParts.join(' · ')),
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Huey request failed'
      setError(msg)
      setMessages((prev) => [
        ...prev,
        createMessage('system', `Request failed: ${msg}`),
      ])
    } finally {
      setSending(false)
    }
  }

  const template = activeIntent ? getTemplate(activeIntent) : null

  return (
    <main className="page huey-page">
      <HueyHeader
        threadId={threadId}
        activeIntent={activeIntent}
        onNewThread={newThread}
        sending={sending}
      />

      <section className="huey-shell">
        <div className="huey-input-surface">
          {!activeIntent ? (
            <IntentSelector onSelect={selectIntent} />
          ) : (
            <DynamicInput
              template={template!}
              values={intentValues}
              onChange={setIntentValues}
              onSend={sendMessage}
              onBack={resetIntent}
              sending={sending}
              error={error}
            />
          )}
        </div>

        <ChatTimeline messages={messages} sending={sending} />
      </section>
    </main>
  )
}
