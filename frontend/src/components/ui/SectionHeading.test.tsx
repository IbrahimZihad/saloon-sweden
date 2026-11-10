import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeading } from './SectionHeading';

describe('SectionHeading', () => {
  it('renders the title as a level-2 heading', () => {
    render(<SectionHeading title="Våra tjänster" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Våra tjänster' })).toBeInTheDocument();
  });

  it('renders the eyebrow and subtitle when provided', () => {
    render(<SectionHeading eyebrow="Galleri" title="Inblick i salongen" subtitle="En kort text" />);
    expect(screen.getByText('Galleri')).toBeInTheDocument();
    expect(screen.getByText('En kort text')).toBeInTheDocument();
  });

  it('omits eyebrow and subtitle paragraphs when not provided', () => {
    const { container } = render(<SectionHeading title="Bara titel" />);
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  it('applies left alignment when requested', () => {
    const { container } = render(<SectionHeading title="X" align="left" />);
    expect(container.firstChild).toHaveClass('text-left');
  });

  it('centers by default', () => {
    const { container } = render(<SectionHeading title="X" />);
    expect(container.firstChild).toHaveClass('text-center');
  });
});