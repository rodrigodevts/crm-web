import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { InvitationListResponseDto } from '@/lib/generated/types/InvitationListResponseDto';
import { InvitationsTableView } from './invitations-table-view';

type Item = InvitationListResponseDto['items'][number];

const item = (overrides: Partial<Item> = {}): Item => ({
  id: '00000000-0000-7000-8000-000000000001',
  email: 'novo@example.com',
  role: 'AGENT',
  status: 'PENDING',
  invitedById: '00000000-0000-7000-8000-000000000099',
  invitedByName: 'Admin',
  acceptedById: null,
  createdAt: '2026-05-08T10:00:00.000Z',
  acceptedAt: null,
  revokedAt: null,
  ...overrides,
});

describe('InvitationsTableView', () => {
  it('renderiza lista no estado ready com PENDING e ações visíveis', () => {
    render(
      <InvitationsTableView
        state="ready"
        emptyStatusLabel="pendente"
        items={[item()]}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText('novo@example.com')).toBeInTheDocument();
    expect(screen.getByText('Atendente')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar link/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reenviar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revogar/ })).toBeInTheDocument();
  });

  it('chama onAction com action e item ao clicar nas ações de PENDING', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    const it1 = item();
    render(
      <InvitationsTableView
        state="ready"
        emptyStatusLabel="pendente"
        items={[it1]}
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Copiar link/ }));
    expect(onAction).toHaveBeenLastCalledWith('copy', it1);

    await user.click(screen.getByRole('button', { name: /Reenviar/ }));
    expect(onAction).toHaveBeenLastCalledWith('resend', it1);

    await user.click(screen.getByRole('button', { name: /Revogar/ }));
    expect(onAction).toHaveBeenLastCalledWith('revoke', it1);
  });

  it('não exibe botões de ação para ACCEPTED e REVOKED', () => {
    render(
      <InvitationsTableView
        state="ready"
        emptyStatusLabel="aceito"
        items={[item({ status: 'ACCEPTED', acceptedAt: '2026-05-08T11:00:00.000Z' })]}
        onAction={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /Copiar link/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reenviar/ })).not.toBeInTheDocument();
  });

  it('renderiza skeletons no loading', () => {
    const { container } = render(
      <InvitationsTableView
        state="loading"
        emptyStatusLabel="pendente"
        items={[]}
        onAction={vi.fn()}
      />,
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renderiza erro no error state', () => {
    render(
      <InvitationsTableView
        state="error"
        emptyStatusLabel="pendente"
        items={[]}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText('Erro ao carregar convites.')).toBeInTheDocument();
  });

  it('renderiza empty com label customizada', () => {
    render(
      <InvitationsTableView
        state="ready"
        emptyStatusLabel="aceito"
        items={[]}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText('Nenhum convite aceito.')).toBeInTheDocument();
  });
});
