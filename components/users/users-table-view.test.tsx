import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { UserListResponseDto } from '@/lib/generated/types/UserListResponseDto';
import { UsersTableView } from './users-table-view';

type Item = UserListResponseDto['items'][number];

const baseItem = (overrides: Partial<Item> = {}): Item => ({
  id: '00000000-0000-7000-8000-000000000001',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Maria Atendente',
  email: 'maria@example.com',
  role: 'AGENT',
  active: true,
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: '2026-05-08T10:30:00.000Z',
  departments: [{ id: 'd1', name: 'Suporte' }],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T10:30:00.000Z',
  ...overrides,
});

describe('UsersTableView', () => {
  it('renderiza lista no estado ready', () => {
    render(<UsersTableView state="ready" items={[baseItem()]} />);
    expect(screen.getByText('Maria Atendente')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByText('Atendente')).toBeInTheDocument();
    expect(screen.getByText('Suporte')).toBeInTheDocument();
  });

  it('renderiza skeletons no estado loading', () => {
    const { container } = render(<UsersTableView state="loading" items={[]} />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renderiza mensagem de erro no estado error', () => {
    render(<UsersTableView state="error" items={[]} />);
    expect(screen.getByText('Erro ao carregar usuários.')).toBeInTheDocument();
  });

  it('renderiza empty state quando ready e items vazio', () => {
    render(<UsersTableView state="ready" items={[]} />);
    expect(screen.getByText('Nenhum usuário ativo.')).toBeInTheDocument();
  });

  it('mostra badge "Ausente" quando absenceActive é true', () => {
    render(<UsersTableView state="ready" items={[baseItem({ absenceActive: true })]} />);
    expect(screen.getByText('Ausente')).toBeInTheDocument();
  });

  it('placeholder em última atividade quando lastSeenAt é null', () => {
    render(<UsersTableView state="ready" items={[baseItem({ lastSeenAt: null })]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('combina múltiplos departamentos com vírgula', () => {
    render(
      <UsersTableView
        state="ready"
        items={[
          baseItem({
            departments: [
              { id: 'd1', name: 'Suporte' },
              { id: 'd2', name: 'Vendas' },
            ],
          }),
        ]}
      />,
    );
    expect(screen.getByText('Suporte, Vendas')).toBeInTheDocument();
  });
});
