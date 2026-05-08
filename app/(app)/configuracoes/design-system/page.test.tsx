import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import Page from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}

describe('design-system page', () => {
  it('renderiza o título e o TOC', () => {
    render(<Page />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { level: 1, name: 'Design System' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Sumário/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Tokens' })).toBeInTheDocument();
  });
});
