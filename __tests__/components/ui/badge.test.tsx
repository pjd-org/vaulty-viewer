import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Badge } from '@vault/ui';

describe('Badge smoke tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    render(<Badge data-testid="badge">Label</Badge>);
    expect(screen.getByTestId('badge')).toBeTruthy();
    expect(screen.getByText('Label')).toBeTruthy();
  });

  it('renders variant="secondary" without crashing', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText('Secondary')).toBeTruthy();
  });

  it('renders variant="destructive" without crashing', () => {
    render(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText('Error')).toBeTruthy();
  });

  it('renders variant="outline" without crashing', () => {
    render(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toBeTruthy();
  });

  it('default variant applies bg-primary class', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstElementChild;
    expect(badge).toBeTruthy();
    expect(badge!.className).toContain('bg-surface-2');
  });

  it('secondary variant applies bg-secondary class', () => {
    const { container } = render(<Badge variant="secondary">Sec</Badge>);
    const badge = container.firstElementChild;
    expect(badge).toBeTruthy();
    expect(badge!.className).toContain('bg-surface-2');
  });
});
