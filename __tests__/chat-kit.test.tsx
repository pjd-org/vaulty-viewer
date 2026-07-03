import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../src/components/tool-ui/plan', () => ({
  Plan: ({ title, todos }: { title: string; todos: Array<{ label: string }> }) => (
    <div>
      <div>Plan: {title}</div>
      {todos.map((todo) => (
        <div key={todo.label}>{todo.label}</div>
      ))}
    </div>
  ),
}));

vi.mock('../src/components/tool-ui/progress-tracker', () => ({
  ProgressTracker: () => <div>Progress tracker</div>,
}));

vi.mock('../src/components/tool-ui/stats-display', () => ({
  StatsDisplay: () => <div>Stats display</div>,
}));

vi.mock(
  '../src/components/tool-ui/primary-agent-tool-invocation',
  () => ({
    PrimaryAgentToolInvocation: ({
      toolName,
      result,
    }: {
      toolName: string;
      result?: unknown;
    }) => (
      <div>
        <div>Used tool: {toolName}</div>
        {result !== undefined && <div>Result:</div>}
      </div>
    ),
  })
);

afterEach(cleanup);

describe('chat-kit', () => {
  it('renders the shell chrome around content', async () => {
    const { ChatShell } = await import(
      '../app/components/chat-kit/ChatShell'
    );

    render(
      <ChatShell
        title="Primary Agent"
        subtitle="Reusable chat kit"
        sidebar={<div>Thread list</div>}
      >
        <div>Thread content</div>
      </ChatShell>
    );

    expect(screen.getByText('Primary Agent')).toBeTruthy();
    expect(screen.getByText('Reusable chat kit')).toBeTruthy();
    expect(screen.getByText('Thread list')).toBeTruthy();
    expect(screen.getByText('Thread content')).toBeTruthy();
  });

  it('renders the thread shell inside a modal frame', async () => {
    const { ChatThreadModal } = await import(
      '../app/components/chat-kit/ChatThreadModal'
    );

    render(
      <ChatThreadModal
        title="Primary Agent"
        subtitle="Reusable chat kit"
        sidebar={<div>Thread list</div>}
      >
        <div>Thread content</div>
      </ChatThreadModal>
    );

    expect(screen.getByRole('dialog', { name: 'Primary Agent' })).toBeTruthy();
    expect(screen.getByText('Thread list')).toBeTruthy();
    expect(screen.getByText('Thread content')).toBeTruthy();
  });

  it('renders a plan tool surface and falls back for unknown tools', async () => {
    const { ChatToolSurface } = await import(
      '../app/components/chat-kit/ChatToolSurface'
    );

    render(
      <div>
        <ChatToolSurface
          toolName="show_plan"
          result={{
            id: 'plan-1',
            title: 'Release checklist',
            description: 'Ship it with care.',
            todos: [
              { id: 'todo-1', label: 'Prep release notes', status: 'completed' },
              { id: 'todo-2', label: 'Cut release', status: 'pending' },
            ],
          }}
        />
        <ChatToolSurface
          toolName="mystery_tool"
          result={{ ok: true }}
        />
      </div>
    );

    expect(screen.getByText('Plan: Release checklist')).toBeTruthy();
    expect(screen.getByText('Prep release notes')).toBeTruthy();
    expect(screen.getByText('Cut release')).toBeTruthy();
    expect(screen.getByText('Used tool: mystery_tool')).toBeTruthy();
    expect(screen.getByText('Result:')).toBeTruthy();
  });

  it('renders dock actions inside the composer', async () => {
    const { ChatComposer } = await import(
      '../app/components/chat-kit/ChatComposer'
    );

    const { container } = render(
      <ChatComposer
        value="Draft a plan"
        onChange={() => undefined}
        onAttach={() => undefined}
        onToolSelect={() => undefined}
      />
    );

    const composerShell = container.querySelector(
      '[style*="--composer-accent"]'
    ) as HTMLElement;

    expect(screen.getByRole('button', { name: /attach file/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /plan/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /track/i })).toBeTruthy();
    expect(screen.getByText('IDLE')).toBeTruthy();
    expect(screen.getByText('No active thread')).toBeTruthy();
    expect(screen.getByText('mint')).toBeTruthy();
    expect(screen.getByText('sky')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Prompt input' })).toBeTruthy();
    expect(composerShell.style.getPropertyValue('--composer-accent')).toBe(
      'var(--a-lilac)'
    );
  });
});
