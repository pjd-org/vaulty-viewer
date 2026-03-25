import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PrimaryButton } from '../app/components/ui';

describe('PrimaryButton', () => {
  it('renders children and default variant', () => {
    render(<PrimaryButton>Click me</PrimaryButton>);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('supports secondary variant', () => {
    render(<PrimaryButton variant="secondary">Sec</PrimaryButton>);
    expect(screen.getByText('Sec')).toBeTruthy();
  });
});
