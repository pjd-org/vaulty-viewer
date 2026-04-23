import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BlockersRail } from '../../../app/components/projects/BlockersRail';
import type { KanbanTask } from '../../../src/lib/kanban-logic';

const blockedTasks: KanbanTask[] = [
  {
    id: 'task-001',
    title: 'Deploy API v2 to production',
    status: 'blocked',
    priority: 9,
    tags: ['backend', 'infra'],
    estimatedTimeMin: 60,
    cmsSlug: 'deploy-api-v2',
    link: '/work',
    completedAt: null,
    createdAt: null,
  },
  {
    id: 'task-002',
    title: 'Finalize onboarding copy',
    status: 'blocked',
    priority: 7,
    tags: ['copy', 'ux'],
    estimatedTimeMin: 30,
    cmsSlug: 'onboarding-copy',
    link: '/work',
    completedAt: null,
    createdAt: null,
  },
];

describe('BlockersRail', () => {
  afterEach(() => {
    cleanup();
  });

  it('returns null when blockedTasks is empty', () => {
    const { container } = render(<BlockersRail blockedTasks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders passive mode without select controls', () => {
    render(<BlockersRail blockedTasks={[blockedTasks[0]]} />);

    expect(screen.getByRole('heading', { name: 'Blockers' })).toBeTruthy();
    expect(screen.getByText('Deploy API v2 to production')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Select task' })).toBeNull();
    expect(
      screen.queryByRole('button', {
        name: 'Select blocker Deploy API v2 to production',
      })
    ).toBeNull();
  });

  it('supports interactive selection via card click, keyboard, and CTA', () => {
    const onSelectTask = vi.fn();

    render(
      <BlockersRail
        blockedTasks={blockedTasks}
        selectedTaskId="task-001"
        onSelectTask={onSelectTask}
        showSelectCta
      />
    );

    const firstCard = screen.getByRole('button', {
      name: 'Select blocker Deploy API v2 to production',
    });
    fireEvent.click(firstCard);
    fireEvent.keyDown(firstCard, { key: 'Enter' });

    const selectButtons = screen.getAllByRole('button', { name: 'Select task' });
    fireEvent.click(selectButtons[1]);

    expect(onSelectTask).toHaveBeenNthCalledWith(1, 'task-001');
    expect(onSelectTask).toHaveBeenNthCalledWith(2, 'task-001');
    expect(onSelectTask).toHaveBeenNthCalledWith(3, 'task-002');
    expect(
      screen
        .getAllByText('Deploy API v2 to production')[0]
        .closest('[data-selected="true"]')
    ).toBeTruthy();
  });
});
