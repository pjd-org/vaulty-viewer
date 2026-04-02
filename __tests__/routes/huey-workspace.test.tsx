/**
 * Huey workspace — basic render and interaction wiring
 *
 * Tests the HueyWorkspace component in isolation:
 *   1. Empty state renders the greeting placeholder
 *   2. Send button is disabled when input is empty
 *   3. Send button is enabled when input has text
 *   4. Cancel button replaces Send while loading
 *   5. onCancel is called when Cancel button is clicked
 *   6. Messages render with correct roles
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

// TanStack Router Link requires a RouterProvider — stub it out for isolation
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  );
  return {
    ...actual,
    Link: ({
      to,
      children,
      className,
      onClick,
    }: {
      to?: string;
      children?: React.ReactNode;
      className?: string;
      onClick?: () => void;
    }) => (
      <a href={to} className={className} onClick={onClick}>
        {children}
      </a>
    ),
    useRouterState: vi.fn(() => ({ location: { pathname: '/huey' } })),
  };
});

// jsdom doesn't implement scrollTo — polyfill it
beforeAll(() => {
  if (!HTMLElement.prototype.scrollTo) {
    HTMLElement.prototype.scrollTo = () => {
      /* noop */
    };
  }
});

afterEach(cleanup);

// ── Import after mocks ────────────────────────────────────────────────────────

import { HueyWorkspace } from '../../app/components/huey/HueyWorkspace';
import type { ChatMessage } from '../../app/components/huey/HueyWorkspace';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HueyWorkspace — render', () => {
  it('shows greeting placeholder when there are no messages', () => {
    render(
      <HueyWorkspace
        messages={[]}
        loading={false}
        onSend={vi.fn()}
        activeIntent={null}
        intentTemplate={null}
      />
    );
    expect(screen.getByText(/How can I help/i)).toBeTruthy();
  });

  it('Send button is disabled when input is empty', () => {
    render(
      <HueyWorkspace
        messages={[]}
        loading={false}
        onSend={vi.fn()}
        activeIntent={null}
        intentTemplate={null}
      />
    );
    const send = screen.getByRole('button', { name: /send/i });
    expect(send).toBeDisabled();
  });

  it('Send button is enabled when input has text', () => {
    render(
      <HueyWorkspace
        messages={[]}
        loading={false}
        onSend={vi.fn()}
        activeIntent={null}
        intentTemplate={null}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'hello' },
    });
    const send = screen.getByRole('button', { name: /send/i });
    expect(send).not.toBeDisabled();
  });

  it('shows Cancel button while loading when onCancel is provided', () => {
    render(
      <HueyWorkspace
        messages={[]}
        loading={true}
        onSend={vi.fn()}
        onCancel={vi.fn()}
        activeIntent={null}
        intentTemplate={null}
      />
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /send/i })).toBeNull();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <HueyWorkspace
        messages={[]}
        loading={true}
        onSend={vi.fn()}
        onCancel={onCancel}
        activeIntent={null}
        intentTemplate={null}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renders user and assistant messages', () => {
    const messages: ChatMessage[] = [
      { id: 'm1', role: 'user', content: 'What is next?' },
      { id: 'm2', role: 'assistant', content: 'Check your task list.' },
    ];
    render(
      <HueyWorkspace
        messages={messages}
        loading={false}
        onSend={vi.fn()}
        activeIntent={null}
        intentTemplate={null}
      />
    );
    expect(screen.getByText('What is next?')).toBeTruthy();
    // assistant message rendered via marked — plain text should still appear
    expect(screen.getByText(/Check your task list/i)).toBeTruthy();
  });
});
