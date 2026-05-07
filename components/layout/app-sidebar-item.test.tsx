import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppSidebarItem } from './app-sidebar-item';
import { Home } from 'lucide-react';

const pathnameMock = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock(),
}));

describe('AppSidebarItem', () => {
  it('marks aria-current="page" when pathname matches exactly', () => {
    pathnameMock.mockReturnValue('/atendimentos');
    render(<AppSidebarItem href="/atendimentos" icon={Home} label="Atendimentos" />);
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
  });

  it('marks aria-current="page" when pathname is a sub-route', () => {
    pathnameMock.mockReturnValue('/configuracoes/tags');
    render(<AppSidebarItem href="/configuracoes" icon={Home} label="Configurações" />);
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark aria-current when pathname is unrelated', () => {
    pathnameMock.mockReturnValue('/contatos');
    render(<AppSidebarItem href="/atendimentos" icon={Home} label="Atendimentos" />);
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current');
  });

  it('renders label hidden visually when collapsed but exposed via title', () => {
    pathnameMock.mockReturnValue('/atendimentos');
    render(<AppSidebarItem href="/atendimentos" icon={Home} label="Atendimentos" collapsed />);
    expect(screen.getByRole('link')).toHaveAttribute('title', 'Atendimentos');
  });
});
