import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProjectCard from '../../app/components/projects/ProjectCard';

describe('ProjectCard', () => {
  it('matches snapshot', () => {
    const p = { id: 'p1', title: 'Website revamp', statusVariant: 'active', progressPercent: 42, bestMoveTitle: 'Finalize landing' };
    const { container } = render(<ProjectCard project={p} />);
    expect(container).toMatchSnapshot();
  });
});
