import React, { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { SoftPanel } from '../layout'
import { PrimaryButton } from '../ui'
import type { IntentTemplate, IntentType } from '../../../src/lib/huey-intents'

// ---------------------------------------------------------------------------
// Types (exported for use in route)
// ---------------------------------------------------------------------------

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  meta?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function PostResponseActions() {
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      <Link to="/" className="text-xs text-[#4f8cff] hover:underline">
        View next actions →
      </Link>
      <Link
        to="/"
        className="text-xs text-[#4f8cff] hover:underline"
        onClick={() => { sessionStorage.setItem('huey-open-session', '1') }}
      >
        Start session →
      </Link>
      <Link to="/kanban" className="text-xs text-[#4f8cff] hover:underline">
        Open board →
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HueyWorkspaceProps {
  messages: ChatMessage[]
  loading: boolean
  onSend: (text: string) => void
  activeIntent: IntentType | null
  intentTemplate: IntentTemplate | null
}

export function HueyWorkspace({
  messages,
  loading,
  onSend,
  intentTemplate,
}: HueyWorkspaceProps) {
  const [inputText, setInputText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = () => {
    const text = inputText.trim()
    if (!text || loading) return
    setInputText('')
    onSend(text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <SoftPanel className="h-full flex flex-col">
      {intentTemplate && (
        <div className="bg-[#4f8cff]/5 rounded-xl p-3 text-sm text-slate-600 mb-4 shrink-0">
          {intentTemplate.description}
        </div>
      )}

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 py-12">
            <span className="text-4xl font-bold text-slate-200">H</span>
            <p className="text-sm">Hi! How can I help?</p>
            <p className="text-xs text-slate-300">Select an intent in the sidebar or just type below.</p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <p key={msg.id} className="text-xs text-slate-400 text-center py-2">
                {msg.content}
              </p>
            )
          }

          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="bg-slate-100 rounded-2xl px-4 py-3 text-sm ml-auto max-w-[80%] text-right">
                  {msg.content}
                </div>
              </div>
            )
          }

          // assistant
          return (
            <div key={msg.id} className="max-w-[85%]">
              <div
                className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm prose prose-sm max-w-none"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
              {msg.meta && (
                <p className="text-xs text-slate-400 mt-1 ml-2">{msg.meta}</p>
              )}
              <PostResponseActions />
            </div>
          )
        })}

        {loading && (
          <div className="max-w-[85%]">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-400">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 shrink-0">
        <textarea
          className="flex-1 resize-none text-sm outline-none bg-transparent"
          rows={2}
          placeholder="Ask me anything…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <PrimaryButton
          onClick={handleSend}
          disabled={loading || !inputText.trim()}
        >
          Send
        </PrimaryButton>
      </div>
    </SoftPanel>
  )
}
