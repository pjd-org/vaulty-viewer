import React, { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { SoftPanel } from '../layout';
import { PrimaryButton } from '../ui';
import type { IntentTemplate, IntentType } from '../../../src/lib/huey-intents';

// ---------------------------------------------------------------------------
// Types (exported for use in route)
// ---------------------------------------------------------------------------

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  meta?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderMarkdown(content: string): string {
  const raw = marked.parse(content, { async: false }) as string;
  return sanitizeHtml(raw, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'code',
      'pre',
      'kbd',
      'mark',
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      code: ['class'],
      pre: ['class'],
    },
  });
}

function PostResponseActions() {
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      <Link to="/" search={{}} className="text-xs text-primary hover:underline">
        View next actions →
      </Link>
      <Link
        to="/"
        search={{}}
        className="text-xs text-primary hover:underline"
        onClick={() => {
          sessionStorage.setItem('huey-open-session', '1');
        }}
      >
        Start session →
      </Link>
      <Link to="/kanban" className="text-xs text-primary hover:underline">
        Open board →
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HueyWorkspaceProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onCancel?: () => void;
  activeIntent: IntentType | null;
  intentTemplate: IntentTemplate | null;
}

export function HueyWorkspace({
  messages,
  loading,
  onSend,
  onCancel,
  intentTemplate,
}: HueyWorkspaceProps) {
  const [inputText, setInputText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === 'assistant') return i;
    }
    return -1;
  })();

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || loading) return;
    setInputText('');
    onSend(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <SoftPanel variant="elevated" className="h-full flex flex-col !p-5">
      {intentTemplate && (
        <div className="genie-surface genie-surface--utility rounded-2xl p-3 text-sm text-slate-700 mb-4 shrink-0">
          {intentTemplate.description}
        </div>
      )}

      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 mb-4"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600 py-12">
            <span className="text-4xl font-semibold text-slate-800">H</span>
            <p className="text-sm text-slate-700">Hi! How can I help?</p>
            <p className="text-xs text-slate-500">
              Select an intent in the sidebar or just type below.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.role === 'system') {
            return (
              <p
                key={msg.id}
                className="text-xs text-slate-400 text-center py-2"
              >
                {msg.content}
              </p>
            );
          }

          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="genie-surface genie-surface--elevated genie-pill genie-layer-panel text-sm ml-auto max-w-[80%] text-right text-slate-800">
                  {msg.content}
                </div>
              </div>
            );
          }

          // assistant
          const isHero = idx === lastAssistantIndex;
          return (
            <div key={msg.id} className="max-w-[85%]">
              <div
                className={[
                  'genie-surface genie-card text-sm',
                  isHero
                    ? 'genie-surface--hero genie-card--hero genie-layer-hero genie-halo'
                    : 'genie-surface--elevated genie-layer-panel',
                ].join(' ')}
              >
                <div
                  className="genie-content prose prose-sm max-w-none text-slate-800"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(msg.content),
                  }}
                />
              </div>
              {msg.meta && (
                <p className="text-xs text-slate-500 mt-1 ml-2">{msg.meta}</p>
              )}
              <PostResponseActions />
            </div>
          );
        })}

        {loading && (
          <div className="max-w-[85%]">
            <div className="genie-surface genie-surface--elevated genie-card text-sm text-slate-600">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="genie-surface genie-surface--overlay genie-layer-overlay genie-composer flex items-center gap-3 shrink-0">
        <textarea
          className="flex-1 resize-none text-sm outline-none border-none shadow-none ring-0 bg-transparent text-slate-800 placeholder:text-slate-500"
          rows={2}
          placeholder="Ask me anything…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        {loading && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 border border-slate-200 hover:border-red-300 hover:text-red-500 transition-colors"
          >
            Cancel
          </button>
        ) : (
          <PrimaryButton
            onClick={handleSend}
            disabled={loading || !inputText.trim()}
          >
            Send
          </PrimaryButton>
        )}
      </div>
    </SoftPanel>
  );
}
