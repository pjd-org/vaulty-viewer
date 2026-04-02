/**
 * Smoke tests for shadcn/ui component rendering.
 *
 * These verify that:
 *  1. Components render without throwing.
 *  2. The expected Tailwind utility classes produced by shadcn CVA are present
 *     on the rendered element — which confirms that tailwind.config.cjs wires
 *     the shadcn color tokens (`bg-primary`, `bg-card`, `bg-secondary`, etc.)
 *     so Tailwind actually emits those class names.
 *
 * Failing before the fix: tailwind.config.cjs is missing the 18 shadcn base
 * color keys, so `bg-primary`, `bg-card`, `bg-secondary`, `bg-destructive`,
 * `text-foreground`, etc. are NOT in the generated CSS.  The class names are
 * still attached to the DOM elements but the CSS is empty — we test for the
 * class names themselves here because jsdom does not run CSS, so we assert the
 * structural contract (correct class applied) rather than computed styles.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Button } from '../../app/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../app/components/ui/card';
import { Badge } from '../../app/components/ui/badge';

// ── Button ────────────────────────────────────────────────────────────────────

describe('shadcn Button', () => {
  it('renders without throwing', () => {
    render(<Button>Save</Button>);
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('default variant carries bg-primary class', () => {
    render(<Button data-testid="btn">Save</Button>);
    const el = screen.getByTestId('btn');
    expect(el.className).toContain('bg-primary');
  });

  it('destructive variant carries bg-destructive class', () => {
    render(
      <Button variant="destructive" data-testid="btn-dest">
        Delete
      </Button>
    );
    const el = screen.getByTestId('btn-dest');
    expect(el.className).toContain('bg-destructive');
  });

  it('secondary variant carries bg-secondary class', () => {
    render(
      <Button variant="secondary" data-testid="btn-sec">
        Cancel
      </Button>
    );
    const el = screen.getByTestId('btn-sec');
    expect(el.className).toContain('bg-secondary');
  });

  it('outline variant carries border-input class', () => {
    render(
      <Button variant="outline" data-testid="btn-out">
        Outline
      </Button>
    );
    const el = screen.getByTestId('btn-out');
    expect(el.className).toContain('border-input');
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

  it('Card carries bg-card class', () => {
    render(<Card data-testid="card-bg">x</Card>);
    const el = screen.getByTestId('card-bg');
    expect(el.className).toContain('bg-card');
  });

  it('Card carries text-card-foreground class', () => {
    render(<Card data-testid="card-fg">x</Card>);
    const el = screen.getByTestId('card-fg');
    expect(el.className).toContain('text-card-foreground');
  });
});

// ── Badge ─────────────────────────────────────────────────────────────────────

describe('shadcn Badge', () => {
  it('renders without throwing', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeTruthy();
  });

  it('default variant carries bg-primary class', () => {
    render(<Badge data-testid="badge">New</Badge>);
    const el = screen.getByTestId('badge');
    expect(el.className).toContain('bg-primary');
  });

  it('secondary variant carries bg-secondary class', () => {
    render(
      <Badge variant="secondary" data-testid="badge-sec">
        Old
      </Badge>
    );
    const el = screen.getByTestId('badge-sec');
    expect(el.className).toContain('bg-secondary');
  });

  it('outline variant carries text-foreground class', () => {
    render(
      <Badge variant="outline" data-testid="badge-out">
        Tag
      </Badge>
    );
    const el = screen.getByTestId('badge-out');
    expect(el.className).toContain('text-foreground');
  });
});
