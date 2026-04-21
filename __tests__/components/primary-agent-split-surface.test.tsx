import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PrimaryAgentSplitSurface } from '../../app/routes/primary-agent';

afterEach(() => {
  cleanup();
});

describe('PrimaryAgentSplitSurface', () => {
  it('renders the desktop resizable split on wide layouts', () => {
    const { container } = render(
      <PrimaryAgentSplitSurface
        isMobile={false}
        leftPane={<div>left pane</div>}
        rightPane={<div>right pane</div>}
      />
    );

    expect(screen.getByText('left pane')).toBeTruthy();
    expect(screen.getByText('right pane')).toBeTruthy();
    expect(
      container.querySelector('[data-slot="primary-agent-split-surface"][data-layout="desktop"]')
    ).toBeTruthy();
  });

  it('stacks the panes on mobile layouts', () => {
    const { container } = render(
      <PrimaryAgentSplitSurface
        isMobile
        leftPane={<div>left pane</div>}
        rightPane={<div>right pane</div>}
      />
    );

    expect(screen.getByText('left pane')).toBeTruthy();
    expect(screen.getByText('right pane')).toBeTruthy();
    expect(
      container.querySelector('[data-slot="primary-agent-split-surface"][data-layout="mobile"]')
    ).toBeTruthy();
  });
});
