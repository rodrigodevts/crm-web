import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter } from 'axios';
import { apiClient } from '@/lib/api-client';
import { AcceptInviteForm } from './accept-invite-form';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const baseProps = {
  token: 'tok-123',
  email: 'maria@example.com',
  role: 'AGENT' as const,
  companyName: 'Acme Atendimentos',
};

const originalAdapter = apiClient.defaults.adapter;

function setAcceptAdapter(status: number, data: unknown): { adapter: ReturnType<typeof vi.fn> } {
  const adapter = vi.fn().mockImplementation((config) => {
    if (status >= 200 && status < 300) {
      return Promise.resolve({
        data,
        status,
        statusText: 'OK',
        headers: {},
        config,
      });
    }
    return Promise.reject({ response: { status, data }, config });
  });
  apiClient.defaults.adapter = adapter as AxiosAdapter;
  return { adapter };
}

describe('AcceptInviteForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('renderiza email/perfil/empresa read-only e os campos do form', () => {
    render(
      <Wrapper>
        <AcceptInviteForm {...baseProps} />
      </Wrapper>,
    );

    expect(screen.getByText('Acme Atendimentos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('maria@example.com')).toBeDisabled();
    expect(screen.getByDisplayValue('Atendente')).toBeDisabled();
    expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirmar senha/)).toBeInTheDocument();
  });

  it('valida nome curto, senha curta e senhas divergentes', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <AcceptInviteForm {...baseProps} />
      </Wrapper>,
    );

    await user.type(screen.getByLabelText(/^Nome/), 'M');
    await user.type(screen.getByLabelText(/^Senha/), '123');
    await user.type(screen.getByLabelText(/^Confirmar senha/), 'outra');
    await user.click(screen.getByRole('button', { name: /aceitar convite/i }));

    expect(await screen.findByText(/mínimo 2 caracteres/i)).toBeInTheDocument();
    expect(await screen.findByText(/pelo menos 8 caracteres/i)).toBeInTheDocument();
    expect(await screen.findByText(/senhas não conferem/i)).toBeInTheDocument();
  });

  it('redireciona para /atendimentos em sucesso', async () => {
    setAcceptAdapter(200, {
      user: {
        id: '00000000-0000-7000-8000-000000000001',
        companyId: '00000000-0000-7000-8000-000000000002',
        name: 'Maria',
        email: 'maria@example.com',
        role: 'AGENT',
      },
    });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <AcceptInviteForm {...baseProps} />
      </Wrapper>,
    );

    await user.type(screen.getByLabelText(/^Nome/), 'Maria');
    await user.type(screen.getByLabelText(/^Senha/), 'senha-segura-123');
    await user.type(screen.getByLabelText(/^Confirmar senha/), 'senha-segura-123');
    await user.click(screen.getByRole('button', { name: /aceitar convite/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/atendimentos');
    });
  });

  it('mostra mensagem amigável em 410 (convite expirado/revogado)', async () => {
    setAcceptAdapter(410, { message: 'Convite não está mais disponível' });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <AcceptInviteForm {...baseProps} />
      </Wrapper>,
    );

    await user.type(screen.getByLabelText(/^Nome/), 'Maria');
    await user.type(screen.getByLabelText(/^Senha/), 'senha-segura-123');
    await user.type(screen.getByLabelText(/^Confirmar senha/), 'senha-segura-123');
    await user.click(screen.getByRole('button', { name: /aceitar convite/i }));

    expect(await screen.findByText(/não está mais disponível/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
