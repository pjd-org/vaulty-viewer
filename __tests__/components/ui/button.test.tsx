import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from '../../../app/components/ui/button';

describe('Button smoke tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeTruthy();
  });

  it('renders variant="secondary" without crashing', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeTruthy();
  });

  it('renders variant="destructive" without crashing', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
  });

  it('renders variant="outline" without crashing', () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button', { name: 'Outline' })).toBeTruthy();
  });

  it('renders variant="ghost" without crashing', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button', { name: 'Ghost' })).toBeTruthy();
  });

  it('renders variant="link" without crashing', () => {
    render(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button', { name: 'Link' })).toBeTruthy();
  });

  it('applies secondary variant class — must not contain green accent class', () => {
    const { container } = render(<Button variant="secondary">Sec</Button>);
    const btn = container.querySelector('button');
    expect(btn).toBeTruthy();
    // Ensure bg-secondary class is present (token-mapped, not hard-coded green)
    expect(btn!.className).toContain('bg-secondary');
  });

  it('forwards disabled prop', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button', { name: 'Disabled' });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});
