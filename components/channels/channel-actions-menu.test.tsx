import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import { ChannelActionsMenu } from './channel-actions-menu';

const baseChannel: ChannelResponseDto = {
  id: 'c1',
  name: 'Canal Atendimento',
  provider: 'GUPSHUP',
  status: 'CONNECTED',
  phoneNumber: '5511999998888',
  externalId: null,
  config: { apiKey: '****1234', appId: '****5678', appName: 'app', sourcePhone: '5511999998888' },
  lastError: null,
  lastConnectedAt: null,
  defaultDepartmentId: null,
  defaultChatFlowId: null,
  inactivityTimeoutMinutes: null,
  inactivityCloseReasonId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function setup(overrides: Partial<ChannelResponseDto> = {}) {
  const handlers = {
    onEdit: vi.fn(),
    onActivate: vi.fn(),
    onDeactivate: vi.fn(),
    onRestart: vi.fn(),
    onDelete: vi.fn(),
  };
  render(<ChannelActionsMenu channel={{ ...baseChannel, ...overrides }} {...handlers} />);
  return handlers;
}

describe('ChannelActionsMenu', () => {
  it('Editar dispara onEdit imediatamente', async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();
    await user.click(screen.getByRole('button', { name: /ações do canal/i }));
    await user.click(screen.getByRole('menuitem', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('Desativar abre AlertDialog e só confirma após clicar em Desativar', async () => {
    const user = userEvent.setup();
    const { onDeactivate } = setup({ status: 'CONNECTED' });
    await user.click(screen.getByRole('button', { name: /ações do canal/i }));
    await user.click(screen.getByRole('menuitem', { name: /desativar/i }));
    expect(onDeactivate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /^desativar$/i }));
    expect(onDeactivate).toHaveBeenCalledTimes(1);
  });

  it('Ativar fica disabled quando status já é CONNECTED', async () => {
    const user = userEvent.setup();
    setup({ status: 'CONNECTED' });
    await user.click(screen.getByRole('button', { name: /ações do canal/i }));
    expect(screen.getByRole('menuitem', { name: /^ativar$/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('Desativar fica disabled quando status já é INACTIVE', async () => {
    const user = userEvent.setup();
    setup({ status: 'INACTIVE' });
    await user.click(screen.getByRole('button', { name: /ações do canal/i }));
    expect(screen.getByRole('menuitem', { name: /^desativar$/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('Excluir dispara onDelete imediatamente (dialog próprio)', async () => {
    const user = userEvent.setup();
    const { onDelete } = setup();
    await user.click(screen.getByRole('button', { name: /ações do canal/i }));
    await user.click(screen.getByRole('menuitem', { name: /excluir/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
