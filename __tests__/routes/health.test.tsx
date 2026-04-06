import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
  useSearch: () => ({ tab: undefined, selectedId: undefined }),
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({
    primary,
    aside,
  }: {
    primary?: React.ReactNode;
    aside?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="scaffold-primary">{primary}</div>
      <div data-testid="scaffold-aside">{aside}</div>
    </div>
  ),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

import { useQuery } from '@tanstack/react-query';
const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

import { Route as HealthRouteModule } from '../../app/routes/health';
const HealthComponent = HealthRouteModule.options
  .component as React.ComponentType;

describe('health route — loading state', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });
  });

  it('renders loading indicator', () => {
    render(<HealthComponent />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });
});

describe('health route — empty / null data', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: false,
    });
  });

  it('renders empty state when no data', () => {
    render(<HealthComponent />);
    expect(screen.getByTestId('health-empty-state')).toBeTruthy();
  });
});

describe('health route — with health data', () => {
  const HEALTH_DATA = {
    overall: 'ok' as const,
    timestamp: '2026-04-04T00:00:00.000Z',
    services: [
      {
        id: 'vault-api',
        name: 'API',
        status: 'ok' as const,
        version: '1.0.0',
        uptime: 1234.5,
      },
      {
        id: 'mcp',
        name: 'MCP',
        status: 'ok' as const,
        latencyMs: 42,
        toolCount: 37,
      },
    ],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: HEALTH_DATA,
      isError: false,
    });
  });

  it('renders the service table', () => {
    render(<HealthComponent />);
    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('renders a row for vault-api service', () => {
    render(<HealthComponent />);
    expect(screen.getByText('API')).toBeTruthy();
  });

  it('renders a row for MCP service', () => {
    render(<HealthComponent />);
    expect(screen.getByText('MCP')).toBeTruthy();
  });

  it('shows overall status badge', () => {
    render(<HealthComponent />);
    expect(screen.getByTestId('health-overall-status')).toBeTruthy();
  });
});

describe('health route — degraded state', () => {
  const DEGRADED_DATA = {
    overall: 'degraded' as const,
    timestamp: '2026-04-04T00:00:00.000Z',
    services: [
      { id: 'vault-api', name: 'API', status: 'degraded' as const },
      {
        id: 'mcp',
        name: 'MCP',
        status: 'error' as const,
        detail: 'Connection refused',
      },
    ],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: DEGRADED_DATA,
      isError: false,
    });
  });

  it('shows degraded overall status', () => {
    render(<HealthComponent />);
    const badge = screen.getByTestId('health-overall-status');
    expect(badge.textContent?.toLowerCase()).toContain('degraded');
  });
});
