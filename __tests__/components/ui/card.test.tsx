import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../app/components/ui/card';

describe('Card smoke tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders Card without crashing', () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toBeTruthy();
  });

  it('renders full card composition without crashing', () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Body content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(screen.getByTestId('full-card')).toBeTruthy();
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Description')).toBeTruthy();
    expect(screen.getByText('Body content')).toBeTruthy();
    expect(screen.getByText('Footer')).toBeTruthy();
  });

  it('Card applies bg-card class', () => {
    const { container } = render(<Card>Card</Card>);
    const card = container.firstElementChild;
    expect(card).toBeTruthy();
    expect(card!.className).toContain('bg-card');
  });

  it('CardDescription applies muted-foreground class', () => {
    const { container } = render(
      <Card>
        <CardDescription>Desc</CardDescription>
      </Card>
    );
    const desc = container.querySelector('.text-muted-foreground');
    expect(desc).toBeTruthy();
  });
});
