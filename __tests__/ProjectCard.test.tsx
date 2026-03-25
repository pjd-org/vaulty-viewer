import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectCard from '../app/components/projects/ProjectCard';

describe('ProjectCard', () => {
  it('renders title, status and progress', () => {
    render(<ProjectCard project={{ id: 'p1', title: 'Test', status: 'active', progress: 0.5 }} />);
    expect(screen.getByText('Test')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
  });
});
