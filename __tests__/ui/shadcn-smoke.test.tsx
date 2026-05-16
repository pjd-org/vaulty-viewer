import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@vault/ui';
import { Badge } from '@/app/components/ui/badge';

// ── Button ────────────────────────────────────────────────────────────────────

describe('shadcn Button', () => {
  it('renders without throwing', () => {
    render(<Button>Save</Button>);
    expect(screen.getByText('Save')).toBeTruthy();
  });
});

// ── Card ──────────────────────────────────────────────────────────────────────

describe('shadcn Card', () => {
  it('renders without throwing', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>
    );
    expect(screen.getByTestId('card')).toBeTruthy();
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });
});

// ── Badge ─────────────────────────────────────────────────────────────────────

describe('shadcn Badge', () => {
  it('renders without throwing', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeTruthy();
  });
});
