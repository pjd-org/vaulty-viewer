import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: (component: unknown) => component,
  Link: ({
    to,
    children,
    ...props
  }: {
    to?: string;
    children: React.ReactNode;
  }) => (
    <a href={typeof to === 'string' ? to : '#'} {...props}>
      {children}
    </a>
  ),
}));

import { InboxRow } from '../app/components/inbox/InboxRow';
import { KanbanCard } from '../app/components/kanban/KanbanCard';

afterEach(cleanup);

describe('viewer a11y fixes', () => {
  it('activates InboxRow with Space from the keyboard', () => {
    const onInspect = vi.fn();

    render(
      <InboxRow
        item={
          {
            title: 'Inbox item',
            summary: 'Needs review',
            severity: 'high',
            surfacedAt: '2026-04-16T00:00:00.000Z',
            inboxBucket: 'manual',
          } as any
        }
        onInspect={onInspect}
      />
    );

    fireEvent.keyDown(screen.getByRole('button', { name: 'Inbox item' }), {
      key: ' ',
    });

    expect(onInspect).toHaveBeenCalledOnce();
  });

  it('keeps read-only Kanban cards out of the tab order', () => {
    const { container, getByRole } = render(
      <KanbanCard
        task={
          {
            id: 'task-1',
            title: 'Plan release',
            status: 'todo',
            priority: 2,
            link: '/work',
          } as any
        }
        isDragging={false}
        isReadOnly={true}
        mutatingTaskId={null}
        onDragStart={() => undefined}
        onDragEnd={() => undefined}
        onStatusChange={() => undefined}
      />
    );

    expect(container.querySelector('article')).not.toHaveAttribute('tabindex');
    expect(getByRole('link', { name: /open/i })).toHaveAttribute('href', '/work');
  });
});
