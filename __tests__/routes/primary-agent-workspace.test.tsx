/**
 * PrimaryAgent workspace — basic render and interaction wiring
 *
 * Tests the PrimaryAgentWorkspace component wrapped in a lightweight
 * AssistantRuntimeProvider + useLocalRuntime so that all
 * @assistant-ui/react primitives have the context they need.
 *
 * Behaviours verified:
 *   1. Empty state renders the greeting placeholder
 *   2. Send button is disabled when the composer is empty
 *   3. Send button is enabled once the composer has text
 *   4. Cancel button is absent while not running
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from '@assistant-ui/react';
import { TooltipProvider } from '@vault/ui';

// ── Mocks ────────────────────────────────────────────────────────────────────

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

afterEach(cleanup);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A no-op model adapter — never actually sends messages in tests */
const noopAdapter: ChatModelAdapter = {
  run: () => new Promise(() => {}), // never resolves
};

function PrimaryAgentWorkspaceWrapper({ children }: { children: React.ReactNode }) {
  const runtime = useLocalRuntime(noopAdapter);
  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}

// ── Import component after mocks ──────────────────────────────────────────────

import { PrimaryAgentWorkspace } from '../../app/components/primary-agent/PrimaryAgentWorkspace';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PrimaryAgentWorkspace — render', () => {
  it('shows greeting placeholder when the thread is empty', () => {
    render(
      <PrimaryAgentWorkspaceWrapper>
        <PrimaryAgentWorkspace intentTemplate={null} />
      </PrimaryAgentWorkspaceWrapper>
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/Execution interface/i)).toBeTruthy();
  });

  it('Send button is disabled when composer input is empty', () => {
    render(
      <PrimaryAgentWorkspaceWrapper>
        <PrimaryAgentWorkspace intentTemplate={null} />
      </PrimaryAgentWorkspaceWrapper>
    );
    const send = screen.getByRole('button', { name: /send/i });
    expect(send).toBeDisabled();
  });

  it('Send button is enabled once the composer has text', () => {
    render(
      <PrimaryAgentWorkspaceWrapper>
        <PrimaryAgentWorkspace intentTemplate={null} />
      </PrimaryAgentWorkspaceWrapper>
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'hello' },
    });
    const send = screen.getByRole('button', { name: /send/i });
    expect(send).not.toBeDisabled();
  });

  it('Cancel button is not present while thread is idle', () => {
    render(
      <PrimaryAgentWorkspaceWrapper>
        <PrimaryAgentWorkspace intentTemplate={null} />
      </PrimaryAgentWorkspaceWrapper>
    );
    // Cancel is only shown while running — absent in idle state
    expect(screen.queryByRole('button', { name: /cancel/i })).toBeNull();
  });
});
