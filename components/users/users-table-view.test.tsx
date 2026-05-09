import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserListResponseDto } from '@/lib/generated/types/UserListResponseDto';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
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

const baseMe: UserResponseDto = {
  id: '00000000-0000-7000-8000-0000000000ad',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Admin Logado',
  email: 'admin@example.com',
  role: 'ADMIN',
  active: true,
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: '2026-05-08T11:00:00.000Z',
  departments: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T11:00:00.000Z',
};

const noopHandlers = {
  onEdit: vi.fn(),
  onDeactivate: vi.fn(),
  onForceLogout: vi.fn(),
  onReactivate: vi.fn(),
};

const allowAll = {
  canEditItem: () => true,
  canDeactivateItem: () => true,
  canForceLogoutItem: () => true,
};

describe('UsersTableView', () => {
  it('renderiza skeletons no estado loading', () => {
    const { container } = render(
      <UsersTableView state="loading" items={[]} me={baseMe} {...allowAll} {...noopHandlers} />,
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renderiza mensagem de erro no estado error', () => {
    render(<UsersTableView state="error" items={[]} me={baseMe} {...allowAll} {...noopHandlers} />);
    expect(screen.getByText('Erro ao carregar usuários.')).toBeInTheDocument();
  });

  it('renderiza empty state default quando ready e items vazio', () => {
    render(<UsersTableView state="ready" items={[]} me={baseMe} {...allowAll} {...noopHandlers} />);
    expect(screen.getByText('Nenhum usuário encontrado.')).toBeInTheDocument();
  });

  it('usa emptyMessage customizada quando fornecida', () => {
    render(
      <UsersTableView
        state="ready"
        items={[]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
        emptyMessage="Nenhum usuário inativo encontrado."
      />,
    );
    expect(screen.getByText('Nenhum usuário inativo encontrado.')).toBeInTheDocument();
  });

  it('renderiza linha completa: avatar com iniciais, nome, email, role traduzido, departamentos, lastSeenAt e badge Ativo', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem()]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('MA')).toBeInTheDocument(); // iniciais Maria Atendente
    expect(screen.getByText('Maria Atendente')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByText('Atendente')).toBeInTheDocument();
    expect(screen.getByText('Suporte')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('exibe badge "Inativo" quando active é false', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ active: false })]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('placeholder em última atividade quando lastSeenAt é null', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ lastSeenAt: null })]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
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
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Suporte, Vendas')).toBeInTheDocument();
  });

  it('mostra badge "Você" quando linha é do próprio usuário (sem importar absenceActive)', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ id: baseMe.id, name: 'Admin Logado', absenceActive: true })]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Você')).toBeInTheDocument();
    // Prioridade: Você suprime Ausente
    expect(screen.queryByText('Ausente')).not.toBeInTheDocument();
  });

  it('mostra badge "Conta da plataforma" quando role é SUPER_ADMIN', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ role: 'SUPER_ADMIN', absenceActive: true })]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Conta da plataforma')).toBeInTheDocument();
    expect(screen.queryByText('Ausente')).not.toBeInTheDocument();
  });

  it('mostra badge "Ausente" quando absenceActive=true e nenhuma prioridade maior se aplica', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ absenceActive: true })]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Ausente')).toBeInTheDocument();
  });

  it('mostra Editar, Desativar e Forçar logout em linha normal ativa, sem Reativar', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem()]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('button', { name: /editar usuário/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /desativar usuário/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forçar logout/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reativar/i })).not.toBeInTheDocument();
  });

  it('esconde Editar/Desativar/Forçar logout quando os gates retornam false (linha self ou SUPER_ADMIN)', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ id: baseMe.id })]}
        me={baseMe}
        canEditItem={() => false}
        canDeactivateItem={() => false}
        canForceLogoutItem={() => false}
        {...noopHandlers}
      />,
    );
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /desativar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /forçar logout/i })).not.toBeInTheDocument();
  });

  it('esconde só Desativar quando gate de deactivate retorna false (último ADMIN ativo)', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ role: 'ADMIN' })]}
        me={baseMe}
        canEditItem={() => true}
        canDeactivateItem={() => false}
        canForceLogoutItem={() => true}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('button', { name: /editar usuário/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /desativar usuário/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forçar logout/i })).toBeInTheDocument();
  });

  it('linha inativa mostra Reativar e oculta Desativar/Forçar logout (gate retorna false)', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ active: false })]}
        me={baseMe}
        canEditItem={() => true}
        canDeactivateItem={() => false}
        canForceLogoutItem={() => false}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('button', { name: /reativar usuário/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /desativar usuário/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /forçar logout/i })).not.toBeInTheDocument();
  });

  it('aciona onEdit/onDeactivate/onForceLogout/onReactivate ao clicar nos botões', async () => {
    const onEdit = vi.fn();
    const onDeactivate = vi.fn();
    const onForceLogout = vi.fn();
    const onReactivate = vi.fn();
    const user = userEvent.setup();

    const itemActive = baseItem();
    const itemInactive = baseItem({ id: 'i2', name: 'Inativo Foo', active: false });

    render(
      <UsersTableView
        state="ready"
        items={[itemActive, itemInactive]}
        me={baseMe}
        canEditItem={() => true}
        canDeactivateItem={(u) => u.active}
        canForceLogoutItem={(u) => u.active}
        onEdit={onEdit}
        onDeactivate={onDeactivate}
        onForceLogout={onForceLogout}
        onReactivate={onReactivate}
      />,
    );

    await user.click(screen.getByRole('button', { name: /editar usuário maria atendente/i }));
    await user.click(screen.getByRole('button', { name: /desativar usuário maria atendente/i }));
    await user.click(
      screen.getByRole('button', { name: /forçar logout do usuário maria atendente/i }),
    );
    await user.click(screen.getByRole('button', { name: /reativar usuário inativo foo/i }));

    expect(onEdit).toHaveBeenCalledWith(itemActive);
    expect(onDeactivate).toHaveBeenCalledWith(itemActive);
    expect(onForceLogout).toHaveBeenCalledWith(itemActive);
    expect(onReactivate).toHaveBeenCalledWith(itemInactive);
  });
});
