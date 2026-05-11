import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DeleteChannelDialog } from './delete-channel-dialog';

const channel = { id: 'c1', name: 'Suporte BR' } as const;

describe('DeleteChannelDialog', () => {
  it('estado padrão mostra título de confirmação e dispara onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeleteChannelDialog
        channel={channel}
        open
        blockedCounts={null}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('heading', { name: /excluir canal "suporte br"/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^excluir$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('estado bloqueado mostra counts pluralizados e botão "Entendi"', () => {
    render(
      <DeleteChannelDialog
        channel={channel}
        open
        blockedCounts={{ openTicketsCount: 3, pendingTicketsCount: 1 }}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /não é possível excluir/i })).toBeInTheDocument();
    expect(screen.getByText(/3 atendimentos abertos/i)).toBeInTheDocument();
    expect(screen.getByText(/1 atendimento pendente/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entendi/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^excluir$/i })).not.toBeInTheDocument();
  });

  it('estado bloqueado oculta linha quando count = 0', () => {
    render(
      <DeleteChannelDialog
        channel={channel}
        open
        blockedCounts={{ openTicketsCount: 5, pendingTicketsCount: 0 }}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/5 atendimentos abertos/i)).toBeInTheDocument();
    expect(screen.queryByText(/pendentes?/i)).not.toBeInTheDocument();
  });

  it('singular: "1 atendimento aberto" (sem "s")', () => {
    render(
      <DeleteChannelDialog
        channel={channel}
        open
        blockedCounts={{ openTicketsCount: 1, pendingTicketsCount: 0 }}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/^1 atendimento aberto$/i)).toBeInTheDocument();
  });
});
