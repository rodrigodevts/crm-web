import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PreferencesFormView, type PreferencesFormValues } from './preferences-form-view';

const defaults: PreferencesFormValues = {
  hideOtherUsersTickets: true,
  agentSeeOtherUsersTicketsOnSameChannel: false,
  agentSeeTicketsWithOtherDefaultAgents: true,
  hidePhoneFromAgents: false,
  ignoreGroupMessages: false,
  showAssignedGroups: false,
  forceWalletRouting: false,
  agentCanDeleteContacts: false,
  agentCanChangeDefaultAgent: false,
  agentCanEditTags: false,
  agentCanToggleSignature: false,
  hideBotTicketsFromAgents: false,
};

function Wrapper({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

describe('PreferencesFormView', () => {
  it('renderiza os 6 cards e os 12 switches refletindo defaultValues', () => {
    render(<PreferencesFormView defaultValues={defaults} canEdit onSubmit={vi.fn()} />, {
      wrapper: Wrapper,
    });

    // 6 cards
    expect(screen.getByRole('heading', { name: 'Visibilidade de tickets' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Privacidade' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grupos do WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Roteamento' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Permissões do atendente' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bot' })).toBeInTheDocument();

    // amostra de 4 switches
    expect(
      screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }),
    ).toBeChecked();
    expect(
      screen.getByRole('switch', {
        name: 'Atendente vê tickets de outros do mesmo canal',
      }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('switch', {
        name: 'Ocultar número de telefone dos atendentes',
      }),
    ).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Ignorar mensagens de grupos' })).not.toBeChecked();
  });

  it('botão Salvar está disabled enquanto não dirty; habilita ao mudar um switch', async () => {
    const user = userEvent.setup();
    render(<PreferencesFormView defaultValues={defaults} canEdit onSubmit={vi.fn()} />, {
      wrapper: Wrapper,
    });

    const save = screen.getByRole('button', { name: 'Salvar alterações' });
    const discard = screen.getByRole('button', { name: 'Descartar alterações' });
    expect(save).toBeDisabled();
    expect(discard).toBeDisabled();

    await user.click(screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }));

    expect(save).toBeEnabled();
    expect(discard).toBeEnabled();
  });

  it('Descartar alterações reseta para defaultValues e desabilita botões', async () => {
    const user = userEvent.setup();
    render(<PreferencesFormView defaultValues={defaults} canEdit onSubmit={vi.fn()} />, {
      wrapper: Wrapper,
    });

    const sw = screen.getByRole('switch', {
      name: 'Ocultar tickets de outros atendentes',
    });
    await user.click(sw);
    expect(sw).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Descartar alterações' }));

    expect(sw).toBeChecked();
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
  });

  it('submit chama onSubmit apenas com campos dirty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PreferencesFormView defaultValues={defaults} canEdit onSubmit={onSubmit} />, {
      wrapper: Wrapper,
    });

    await user.click(screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }));
    await user.click(screen.getByRole('switch', { name: 'Ignorar mensagens de grupos' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      hideOtherUsersTickets: false,
      ignoreGroupMessages: true,
    });
  });

  it('quando canEdit=false, todos os switches ficam disabled e o footer some', () => {
    render(<PreferencesFormView defaultValues={defaults} canEdit={false} onSubmit={vi.fn()} />, {
      wrapper: Wrapper,
    });

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(12);
    for (const sw of switches) {
      expect(sw).toBeDisabled();
    }

    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Descartar alterações' })).not.toBeInTheDocument();
  });

  it('quando isSubmitting=true, botão Salvar mostra estado loading e bloqueia novo submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <PreferencesFormView
        defaultValues={defaults}
        canEdit
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
      { wrapper: Wrapper },
    );

    await user.click(screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }));

    rerender(
      <PreferencesFormView defaultValues={defaults} canEdit onSubmit={onSubmit} isSubmitting />,
    );

    const save = screen.getByRole('button', { name: /salvando/i });
    expect(save).toBeDisabled();
  });
});
