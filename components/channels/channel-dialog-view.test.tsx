import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChannelDialogView } from './channel-dialog-view';

const departments = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Suporte' },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Vendas' },
];
const closeReasons = [
  { id: '00000000-0000-4000-8000-000000000003', name: 'Atendido' },
  { id: '00000000-0000-4000-8000-000000000004', name: 'Sem retorno' },
];

function setup(props: Partial<React.ComponentProps<typeof ChannelDialogView>> = {}) {
  const onSubmit = vi.fn();
  const onReveal = vi.fn();
  const onClose = vi.fn();
  render(
    <ChannelDialogView
      mode="create"
      open
      role="ADMIN"
      departments={departments}
      closeReasons={closeReasons}
      defaultValues={null}
      submitting={false}
      revealState="masked"
      onSubmit={onSubmit}
      onReveal={onReveal}
      onClose={onClose}
      {...props}
    />,
  );
  return { onSubmit, onReveal, onClose };
}

describe('ChannelDialogView', () => {
  it('em modo create não mostra botão "Revelar credenciais"', () => {
    setup();
    expect(screen.queryByRole('button', { name: /revelar credenciais/i })).not.toBeInTheDocument();
  });

  it('em modo edit + role=ADMIN + revealState=masked mostra botão "Revelar"', () => {
    setup({
      mode: 'edit',
      defaultValues: {
        name: 'X',
        provider: 'GUPSHUP',
        phoneNumber: '5511999998888',
        apiKey: '****9999',
        appId: '****8888',
        appName: 'app',
        defaultDepartmentId: null,
        inactivityTimeoutMinutes: null,
        inactivityCloseReasonId: null,
      },
    });
    expect(screen.getByRole('button', { name: /revelar credenciais/i })).toBeInTheDocument();
  });

  it('em modo edit + role=SUPERVISOR não mostra botão "Revelar"', () => {
    setup({
      mode: 'edit',
      role: 'SUPERVISOR',
      defaultValues: {
        name: 'X',
        provider: 'GUPSHUP',
        phoneNumber: '5511999998888',
        apiKey: '****9999',
        appId: '****8888',
        appName: 'app',
        defaultDepartmentId: null,
        inactivityTimeoutMinutes: null,
        inactivityCloseReasonId: null,
      },
    });
    expect(screen.queryByRole('button', { name: /revelar credenciais/i })).not.toBeInTheDocument();
  });

  it('phoneNumber inválido (contém "+") exibe erro inline e não chama onSubmit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.type(screen.getByLabelText(/nome/i), 'Canal X');
    await user.type(screen.getByLabelText(/telefone do canal/i), '+5511999998888');
    await user.type(screen.getByLabelText(/api key/i), 'k');
    await user.type(screen.getByLabelText(/app id/i), 'a');
    await user.type(screen.getByLabelText(/app name/i), 'n');
    await user.click(screen.getByRole('button', { name: /criar canal/i }));
    expect(await screen.findByText(/apenas dígitos/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('timeout > 0 sem closeReason exibe erro inline', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.type(screen.getByLabelText(/nome/i), 'Canal X');
    await user.type(screen.getByLabelText(/telefone do canal/i), '5511999998888');
    await user.type(screen.getByLabelText(/api key/i), 'k');
    await user.type(screen.getByLabelText(/app id/i), 'a');
    await user.type(screen.getByLabelText(/app name/i), 'n');
    await user.type(screen.getByLabelText(/timeout/i), '30');
    await user.click(screen.getByRole('button', { name: /criar canal/i }));
    expect(await screen.findByText(/selecione um motivo de fechamento/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
