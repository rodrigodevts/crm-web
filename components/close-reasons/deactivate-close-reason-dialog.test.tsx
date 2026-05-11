import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DeactivateCloseReasonDialog } from './deactivate-close-reason-dialog';

const reason = { id: 'r1', name: 'Atendido' } as const;

describe('DeactivateCloseReasonDialog', () => {
  it('mostra título com o nome do motivo e dispara onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeactivateCloseReasonDialog
        reason={reason}
        open
        submitting={false}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('heading', { name: /desativar motivo "atendido"/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^desativar$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancelar não chama onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <DeactivateCloseReasonDialog
        reason={reason}
        open
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
