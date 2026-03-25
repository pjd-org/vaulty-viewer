import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SoftChip } from '../app/components/ui/index';

describe('SoftChip', () => {
  it('renders content', () => {
    render(<SoftChip>Project</SoftChip>);
    expect(screen.getByText('Project')).toBeTruthy();
  });
});
