import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DeleteCloseReasonDialog } from './delete-close-reason-dialog';

const reason = { id: 'r1', name: 'Atendido' } as const;

describe('DeleteCloseReasonDialog', () => {
  it('estado padrão mostra título de confirmação e dispara onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeleteCloseReasonDialog
        reason={reason}
        open
        blockedCounts={null}
        submitting={false}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /excluir motivo "atendido"/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^excluir$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('estado bloqueado mostra count pluralizado e botão "Entendi"', () => {
    render(
      <DeleteCloseReasonDialog
        reason={reason}
        open
        blockedCounts={{ channelsUsingCount: 3 }}
        submitting={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /não é possível excluir/i })).toBeInTheDocument();
    expect(screen.getByText(/3 canais/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entendi/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^excluir$/i })).not.toBeInTheDocument();
  });

  it('singular: "1 canal"', () => {
    render(
      <DeleteCloseReasonDialog
        reason={reason}
        open
        blockedCounts={{ channelsUsingCount: 1 }}
        submitting={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/1 canal[^iáis]/i)).toBeInTheDocument();
  });

  it('cancelar fecha sem chamar onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <DeleteCloseReasonDialog
        reason={reason}
        open
        blockedCounts={null}
        submitting={false}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
