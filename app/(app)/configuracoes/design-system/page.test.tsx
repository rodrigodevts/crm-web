import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import Page from './page';

describe('design-system page', () => {
  it('renderiza o título e o TOC', () => {
    render(
      <TooltipProvider>
        <Page />
      </TooltipProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Design System' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Sumário/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Tokens' })).toBeInTheDocument();
  });
});
